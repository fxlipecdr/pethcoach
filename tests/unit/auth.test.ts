import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  profile: vi.fn(),
}));

/** Cliente mínimo: sessão do Auth mais a leitura de `profiles.deleted_at`. */
function clientWithProfile(deletedAt: string | null = null) {
  mocks.profile.mockResolvedValue({ data: { deleted_at: deletedAt }, error: null });
  return {
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.profile }),
      }),
    }),
  };
}
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createClient,
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
import { requireAdmin, requireUser } from "@/lib/security/auth";

describe("server authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("redirects when provider is absent", async () => {
    mocks.createClient.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/entrar");
  });
  it("redirects when the Auth server rejects the session", async () => {
    mocks.createClient.mockResolvedValue(clientWithProfile());
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("invalid jwt"),
    });
    await expect(requireUser()).rejects.toThrow("REDIRECT:/entrar");
  });
  it("recusa uma conta anonimizada mesmo com sessão válida", async () => {
    mocks.createClient.mockResolvedValue(
      clientWithProfile("2026-09-05T00:00:00.000Z"),
    );
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "test", app_metadata: {} } },
      error: null,
    });
    await expect(requireUser()).rejects.toThrow("REDIRECT:/entrar?conta=removida");
  });
  it("does not grant admin from user-editable metadata", async () => {
    mocks.createClient.mockResolvedValue(clientWithProfile());
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "test",
          user_metadata: { role: "admin" },
          app_metadata: {},
        },
      },
      error: null,
    });
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });
  it("accepts only a verified user with server-managed admin role", async () => {
    const user = { id: "test", app_metadata: { role: "admin" } };
    mocks.createClient.mockResolvedValue(clientWithProfile());
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    await expect(requireAdmin()).resolves.toEqual(user);
  });
});
