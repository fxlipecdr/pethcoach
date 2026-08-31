import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const dogId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherDog = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
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
describe("P2 migrations and PostgreSQL ownership policies", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('${owner}');`);
    for (const file of [
      "20260831000000_profiles_baseline.sql",
      "20260831010000_p2_auth_dogs_attribution.sql",
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }
    await db.query("insert into auth.users values ($1)", [other]);
    await asUser(owner, () =>
      db.query(
        "insert into dogs (id, owner_id, name) values ($1, $2, 'Cão A')",
        [dogId, owner],
      ),
    );
    await asUser(other, () =>
      db.query(
        "insert into dogs (id, owner_id, name) values ($1, $2, 'Cão B')",
        [otherDog, other],
      ),
    );
    await db.exec(`insert into attribution_touches (user_id, touch_type) values ('${owner}', 'first'), ('${other}', 'first');
      insert into attribution_touches (anonymous_id, touch_type) values ('${dogId}', 'first');`);
  });
  afterAll(async () => {
    await db?.close();
  });
  it("backfills old profiles and creates new profiles via the private auth trigger", async () => {
    expect(
      (await db.query("select id from profiles order by id")).rows,
    ).toEqual([{ id: owner }, { id: other }]);
    await expect(
      asUser(owner, () => db.query("select private.create_user_profile()")),
    ).rejects.toThrow(/permission denied/i);
  });
  it("does not expose another profile or permit changing its name", async () => {
    await asUser(owner, async () => {
      expect((await db.query("select id from profiles")).rows).toEqual([
        { id: owner },
      ]);
      expect(
        (
          await db.query(
            "update profiles set name = 'forged' where id = $1 returning id",
            [other],
          )
        ).rows,
      ).toEqual([]);
    });
  });
  it("lists only the current owner's dogs, even without an application filter", async () => {
    expect(
      (await asUser(owner, () => db.query("select id from dogs"))).rows,
    ).toEqual([{ id: dogId }]);
    expect(
      (await asUser(other, () => db.query("select id from dogs"))).rows,
    ).toEqual([{ id: otherDog }]);
  });
  it("blocks IDOR reads, edits and deletes", async () => {
    await asUser(owner, async () => {
      expect(
        (await db.query("select * from dogs where id = $1", [otherDog])).rows,
      ).toEqual([]);
      expect(
        (
          await db.query(
            "update dogs set name = 'forged' where id = $1 returning id",
            [otherDog],
          )
        ).rows,
      ).toEqual([]);
      expect(
        (
          await db.query("delete from dogs where id = $1 returning id", [
            otherDog,
          ])
        ).rows,
      ).toEqual([]);
    });
    expect(
      (await asUser(other, () => db.query("select name from dogs"))).rows,
    ).toEqual([{ name: "Cão B" }]);
  });
  it("rejects forged ownership on create and owner/timestamp changes", async () => {
    await expect(
      asUser(owner, () =>
        db.query("insert into dogs (owner_id, name) values ($1, 'forged')", [
          other,
        ]),
      ),
    ).rejects.toThrow(/row-level security/i);
    for (const assignment of [
      "owner_id = '22222222-2222-4222-8222-222222222222'",
      "created_at = now()",
      "updated_at = now()",
      "id = gen_random_uuid()",
    ]) {
      await expect(
        asUser(owner, () =>
          db.query(`update dogs set ${assignment} where id = $1`, [dogId]),
        ),
      ).rejects.toThrow(/permission denied/i);
    }
  });
  it("persists optional fields and updates the server timestamp", async () => {
    const before = (
      await db.query<{ updated_at: Date }>(
        "select updated_at from dogs where id = $1",
        [dogId],
      )
    ).rows[0]?.updated_at;
    const result = await asUser(owner, () =>
      db.query<{ name: string; updated_at: Date; neutered: boolean }>(
        "update dogs set name = 'Novo nome', birth_date = '2020-03-01', neutered = false, sex = 'female', size = 'medium', environment = 'apartment' where id = $1 returning name, updated_at, neutered",
        [dogId],
      ),
    );
    expect(result.rows[0]?.name).toBe("Novo nome");
    expect(result.rows[0]?.neutered).toBe(false);
    expect(result.rows[0]?.updated_at.getTime()).toBeGreaterThan(
      before!.getTime(),
    );
    await asUser(owner, () =>
      db.query(
        "update dogs set birth_date = null, neutered = null where id = $1",
        [dogId],
      ),
    );
  });
  it("validates inputs even when bypassing the UI and Server Actions", async () => {
    for (const [field, value] of [
      ["name", "  "],
      ["sex", "invalid"],
      ["size", "invalid"],
      ["birth_date", "2999-01-01"],
      ["environment", "invalid"],
    ]) {
      await expect(
        asUser(owner, () =>
          db.query(`update dogs set ${field} = $1 where id = $2`, [
            value,
            dogId,
          ]),
        ),
      ).rejects.toThrow(/check constraint/i);
    }
  });
  it("never exposes anonymous attribution or lets clients claim/write attribution", async () => {
    expect(
      (
        await asUser(owner, () =>
          db.query("select user_id from attribution_touches"),
        )
      ).rows,
    ).toEqual([{ user_id: owner }]);
    await expect(
      asUser(owner, () =>
        db.query("update attribution_touches set user_id = $1", [owner]),
      ),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      asUser(owner, () =>
        db.query(
          "insert into attribution_touches (user_id, touch_type) values ($1, 'last')",
          [owner],
        ),
      ),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      asUser(owner, () =>
        db.query("update profiles set onboarding_source = 'forged'"),
      ),
    ).rejects.toThrow(/permission denied/i);
  });
  it("denies anonymous table access and profile deletion through the data API", async () => {
    await expect(
      asUser(owner, () =>
        db.query("delete from profiles where id = $1", [owner]),
      ),
    ).rejects.toThrow(/permission denied/i);
    await db.exec("set role anon");
    try {
      for (const table of ["profiles", "dogs", "attribution_touches"]) {
        await expect(db.query(`select * from ${table}`)).rejects.toThrow(
          /permission denied/i,
        );
      }
      await expect(
        db.query("insert into dogs (owner_id, name) values ($1, 'forged')", [
          owner,
        ]),
      ).rejects.toThrow(/permission denied/i);
    } finally {
      await db.exec("reset role");
    }
  });
  it("removes user-owned records when the auth user is deleted", async () => {
    await db.query("delete from auth.users where id = $1", [other]);
    for (const [table, column] of [
      ["profiles", "id"],
      ["dogs", "owner_id"],
      ["attribution_touches", "user_id"],
    ]) {
      expect(
        (await db.query(`select * from ${table} where ${column} = $1`, [other]))
          .rows,
      ).toEqual([]);
    }
  });
});
