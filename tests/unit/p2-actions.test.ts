import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  config: vi.fn(),
  allow: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  otp: vi.fn(),
  exchange: vi.fn(),
  signOut: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.client,
}));
vi.mock("@/features/auth/config", () => ({ getAuthConfig: mocks.config }));
vi.mock("@/lib/security/rate-limit", () => ({
  authLimiter: { allow: mocks.allow },
  privateRateKey: (value: string) => value,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
import { requestMagicLink, signOut } from "@/features/auth/actions";
import { saveDog } from "@/features/dogs/actions";
import { saveProfile } from "@/features/profile/actions";
import { GET } from "@/app/auth/callback/route";
const owner = "11111111-1111-4111-8111-111111111111";
const dogId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const idle = { status: "idle" as const };
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
function dogForm(mode = "create") {
  return form({
    id: dogId,
    mode,
    name: "Mel",
    neutered: "no",
    owner_id: "forged",
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({
    enabled: true,
    origin: "http://127.0.0.1:3000",
  });
  mocks.allow.mockReturnValue(true);
  mocks.client.mockResolvedValue({
    auth: {
      getUser: mocks.getUser,
      signInWithOtp: mocks.otp,
      exchangeCodeForSession: mocks.exchange,
      signOut: mocks.signOut,
    },
    from: mocks.from,
  });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: owner } },
    error: null,
  });
  mocks.otp.mockResolvedValue({ error: null });
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});
describe("magic link and callback security", () => {
  it("does not contact providers while unconfigured, invalid or limited", async () => {
    mocks.config.mockReturnValue({ enabled: false, origin: null });
    expect(
      (await requestMagicLink(idle, form({ email: "a@example.test" }))).status,
    ).toBe("error");
    mocks.config.mockReturnValue({
      enabled: true,
      origin: "http://127.0.0.1:3000",
    });
    expect(
      (await requestMagicLink(idle, form({ email: "broken" }))).fieldError,
    ).toBeDefined();
    mocks.allow.mockReturnValue(false);
    expect(
      (await requestMagicLink(idle, form({ email: "a@example.test" }))).status,
    ).toBe("error");
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("sends a normalized address with a trusted callback, never a client-provided origin", async () => {
    expect(
      (
        await requestMagicLink(
          idle,
          form({ email: " USER@EXAMPLE.TEST ", next: "//evil.test" }),
        )
      ).status,
    ).toBe("success");
    expect(mocks.otp).toHaveBeenCalledWith({
      email: "user@example.test",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "http://127.0.0.1:3000/auth/callback?next=%2Fapp",
      },
    });
  });
  it("does not leak raw provider errors or claim success after failure", async () => {
    mocks.otp.mockResolvedValue({
      error: { message: "secret token and user email" },
    });
    const result = await requestMagicLink(
      idle,
      form({ email: "a@example.test" }),
    );
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  it("requires a successful exchange and verified user before redirecting to private content", async () => {
    const response = await GET(
      new NextRequest(
        "http://forged-host.test/auth/callback?code=valid-code-123&next=/app/caes",
      ),
    );
    expect(mocks.exchange).toHaveBeenCalledWith("valid-code-123");
    expect(mocks.getUser).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:3000/app/caes",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("fails closed on expired/reused codes and missing PKCE verifier", async () => {
    mocks.exchange.mockResolvedValue({
      error: new Error("expired or verifier missing"),
    });
    const response = await GET(
      new NextRequest(
        "http://127.0.0.1:3000/auth/callback?code=expired-code&next=https://evil.test",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:3000/entrar?error=link&next=%2Fapp",
    );
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("does not redirect after an unverified exchange result", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error(),
    });
    const response = await GET(
      new NextRequest(
        "http://127.0.0.1:3000/auth/callback?code=valid-code-123",
      ),
    );
    expect(response.headers.get("location")).toContain("/entrar?error=link");
  });
  it("signs out locally, invalidates private UI and reports provider failure", async () => {
    await expect(signOut()).rejects.toThrow("REDIRECT:/entrar");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/app", "layout");
    mocks.signOut.mockResolvedValue({ error: new Error() });
    expect((await signOut()).status).toBe("error");
  });
});
describe("authenticated mutations", () => {
  it("returns recoverable feedback if Auth is unreachable, without calling the database", async () => {
    mocks.getUser.mockRejectedValue(new Error("private provider details"));
    expect((await saveDog(idle, dogForm())).status).toBe("error");
    expect((await saveProfile(idle, form({ name: "Tutor" }))).status).toBe(
      "error",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("checks the session inside each mutation before touching data", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await saveDog(idle, dogForm())).status).toBe("error");
    expect((await saveProfile(idle, form({ name: "Tutor" }))).status).toBe(
      "error",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("derives dog ownership from the verified user, ignoring form ownership", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert });
    await expect(saveDog(idle, dogForm())).rejects.toThrow(
      `REDIRECT:/app/caes/${dogId}?created=1`,
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: dogId,
        owner_id: owner,
        name: "Mel",
        neutered: false,
      }),
    );
  });
  it("filters an update by id AND owner and refuses an invisible row", async () => {
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ error: null, data: null }),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
    const result = await saveDog(idle, dogForm("update"));
    expect(query.eq).toHaveBeenCalledWith("id", dogId);
    expect(query.eq).toHaveBeenCalledWith("owner_id", owner);
    expect(result.status).toBe("error");
    expect(result.values?.name).toBe("Mel");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("does not treat a duplicate UUID belonging to another user as a successful retry", async () => {
    const query = {
      insert: vi.fn().mockResolvedValue({ error: { code: "23505" } }),
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
    expect((await saveDog(idle, dogForm())).status).toBe("error");
    expect(query.eq).toHaveBeenCalledWith("owner_id", owner);
  });
  it("returns typed field errors and preserves fields after a database failure", async () => {
    const invalid = dogForm();
    invalid.set("birth_date", "2999-01-01");
    expect((await saveDog(idle, invalid)).errors?.birth_date).toBeDefined();
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.from.mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error("secret connection string")),
    });
    const result = await saveDog(idle, dogForm());
    expect(result).toMatchObject({ status: "error", values: { name: "Mel" } });
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
