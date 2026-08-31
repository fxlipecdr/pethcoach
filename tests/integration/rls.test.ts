import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
let db: PGlite;

async function asUser<T>(id: string, operation: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  try {
    return await operation();
  } finally {
    await db.exec("reset role");
  }
}

describe("baseline migration and real Postgres RLS (PGlite)", () => {
  beforeAll(async () => {
    db = new PGlite();
    // Emulate only Supabase's Auth schema; RLS is executed by real PostgreSQL, not mocked.
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('${owner}'), ('${other}');`);
    await db.exec(
      await readFile(
        new URL(
          "../../supabase/migrations/20260831000000_profiles_baseline.sql",
          import.meta.url,
        ),
        "utf-8",
      ),
    );
    await asUser(owner, () =>
      db.query(
        "insert into public.profiles (id, name) values ($1, 'Tutor A')",
        [owner],
      ),
    );
    await asUser(other, () =>
      db.query(
        "insert into public.profiles (id, name) values ($1, 'Tutor B')",
        [other],
      ),
    );
  });
  afterAll(async () => {
    await db?.close();
  });
  it("shows only the authenticated owner's profile", async () => {
    const result = await asUser(owner, () =>
      db.query<{ id: string }>("select id from public.profiles"),
    );
    expect(result.rows).toEqual([{ id: owner }]);
  });
  it("prevents cross-owner reads, updates and deletion", async () => {
    await asUser(owner, async () => {
      expect(
        (await db.query("select * from public.profiles where id = $1", [other]))
          .rows,
      ).toEqual([]);
      expect(
        (
          await db.query(
            "update public.profiles set name = 'forged' where id = $1 returning id",
            [other],
          )
        ).rows,
      ).toEqual([]);
      expect(
        (
          await db.query(
            "delete from public.profiles where id = $1 returning id",
            [other],
          )
        ).rows,
      ).toEqual([]);
    });
    expect(
      (
        await asUser(other, () =>
          db.query<{ name: string }>("select name from public.profiles"),
        )
      ).rows[0]?.name,
    ).toBe("Tutor B");
  });
  it("rejects forged ownership on insert", async () => {
    await expect(
      asUser(owner, () =>
        db.query("insert into public.profiles(id) values ($1)", [other]),
      ),
    ).rejects.toThrow(/row-level security/i);
  });
  it("prevents changing owner and timestamps directly", async () => {
    await expect(
      asUser(owner, () =>
        db.query("update public.profiles set id = $1 where id = $2", [
          other,
          owner,
        ]),
      ),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      asUser(owner, () =>
        db.query(
          "update public.profiles set created_at = now() where id = $1",
          [owner],
        ),
      ),
    ).rejects.toThrow(/permission denied/i);
  });
  it("allows normal owner edits", async () => {
    const result = await asUser(owner, () =>
      db.query<{ name: string }>(
        "update public.profiles set name = 'Novo nome' where id = $1 returning name",
        [owner],
      ),
    );
    expect(result.rows[0]?.name).toBe("Novo nome");
  });
  it("denies anonymous access", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select * from public.profiles")).rejects.toThrow(
        /permission denied/i,
      );
    } finally {
      await db.exec("reset role");
    }
  });
  it("deletes profile when its auth user is deleted", async () => {
    await db.query("delete from auth.users where id = $1", [other]);
    expect(
      (await db.query("select * from public.profiles where id = $1", [other]))
        .rows,
    ).toEqual([]);
  });
});
