import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../lib/supabase/database.types";

const publicKeySchema = z
  .string()
  .regex(/^sb_publishable_[A-Za-z0-9]+_[A-Za-z0-9]+$/);
const localStatusSchema = z.object({
  API_URL: z.url(),
  MAILPIT_URL: z.url(),
  PUBLISHABLE_KEY: publicKeySchema,
});
const mailboxSchema = z.object({
  messages: z.array(
    z
      .object({
        ID: z.string(),
        To: z.array(z.object({ Address: z.email() }).passthrough()),
      })
      .passthrough(),
  ),
});
const messageSchema = z
  .object({ HTML: z.string().optional(), Text: z.string().optional() })
  .passthrough();
const jwtTimeSchema = z.object({ exp: z.number().int(), iat: z.number().int() });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

function createPkceClient(
  apiUrl: string,
  publishableKey: string,
  customFetch?: typeof fetch,
) {
  return createClient<Database>(apiUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
      storage: createMemoryStorage(),
    },
    global: customFetch ? { fetch: customFetch } : undefined,
  });
}

function readLocalStatus() {
  const cli = new URL("../node_modules/supabase/dist/supabase.js", import.meta.url);
  const output = execFileSync(
    process.execPath,
    [fileURLToPath(cli), "status", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return localStatusSchema.parse(JSON.parse(output.slice(output.indexOf("{"))));
}

async function readJson(response: Response) {
  assert(response.ok, `Mailpit retornou HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

async function waitForMagicLink(mailpitUrl: string, email: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const mailbox = mailboxSchema.parse(
      await readJson(await fetch(new URL("/api/v1/messages", mailpitUrl))),
    );
    const message = mailbox.messages.find((item) =>
      item.To.some((recipient) => recipient.Address === email),
    );
    if (message) {
      const detail = messageSchema.parse(
        await readJson(
          await fetch(
            new URL(`/api/v1/message/${encodeURIComponent(message.ID)}`, mailpitUrl),
          ),
        ),
      );
      const body = `${detail.Text ?? ""}\n${detail.HTML ?? ""}`.replaceAll(
        "&amp;",
        "&",
      );
      const link = body.match(
        /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/,
      )?.[0];
      assert(link, "O e-mail local não continha uma URL de verificação.");
      return z.url().parse(link);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("O Mailpit não recebeu o magic link local.");
}

function readJwtTimes(accessToken: string) {
  const payload = accessToken.split(".")[1];
  assert(payload, "O JWT local não contém payload.");
  return jwtTimeSchema.parse(
    JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
  );
}

async function run() {
  const status = readLocalStatus();
  const email = `p2-session-${randomUUID()}@example.test`;
  const callbackUrl = "http://127.0.0.1:3000/auth/callback?next=%2Fapp";
  const client = createPkceClient(status.API_URL, status.PUBLISHABLE_KEY);

  const request = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl, shouldCreateUser: true },
  });
  assert(!request.error, "O Auth local recusou o magic link.");

  const link = new URL(await waitForMagicLink(status.MAILPIT_URL, email));
  assert(
    link.origin === new URL(status.API_URL).origin &&
      link.pathname === "/auth/v1/verify",
    "O magic link não pertence ao Supabase local esperado.",
  );
  const verification = await fetch(link, { redirect: "manual" });
  assert(
    verification.status >= 300 && verification.status < 400,
    "A verificação local não redirecionou para o callback.",
  );
  const location = verification.headers.get("location");
  assert(location, "O callback local não foi retornado.");
  const code = new URL(location).searchParams.get("code");
  assert(code, "O callback local não continha código PKCE.");

  const exchange = await client.auth.exchangeCodeForSession(code);
  assert(
    !exchange.error && exchange.data.session,
    "A troca PKCE local não criou uma sessão.",
  );
  const jwtTimes = readJwtTimes(exchange.data.session.access_token);
  const tokenTtlSeconds = jwtTimes.exp - jwtTimes.iat;
  process.stdout.write(`TTL assinado do JWT local: ${tokenTtlSeconds}s.\n`);
  // The local gateway allows a small clock-skew window after the JWT exp claim.
  const expiryWaitMs = tokenTtlSeconds * 1000 + 35_000;
  assert(
    expiryWaitMs > 0 && expiryWaitMs <= 160_000,
    "Configure jwt_expiry = 120 no Supabase local para este aceite.",
  );
  process.stdout.write("Aguardando a expiração natural do JWT local…\n");
  await new Promise((resolve) => setTimeout(resolve, expiryWaitMs));

  const expiredDataResponse = await fetch(
    new URL("/rest/v1/profiles?select=id", status.API_URL),
    {
      headers: {
        apikey: status.PUBLISHABLE_KEY,
        Authorization: `Bearer ${exchange.data.session.access_token}`,
      },
    },
  );
  assert(
    expiredDataResponse.status === 401,
    "A Data API aceitou um JWT expirado após a tolerância de relógio.",
  );

  const refresh = await client.auth.refreshSession();
  assert(
    !refresh.error && refresh.data.session,
    "O refresh token válido não restaurou a sessão.",
  );
  const refreshedUser = await client.auth.getUser(
    refresh.data.session.access_token,
  );
  assert(
    !refreshedUser.error && refreshedUser.data.user?.email === email,
    "O Auth não confirmou o usuário após o refresh.",
  );

  const invalidRefreshClient = createPkceClient(
    status.API_URL,
    status.PUBLISHABLE_KEY,
  );
  const invalidRefresh = await invalidRefreshClient.auth.refreshSession({
    refresh_token: "refresh-token-invalido",
  });
  assert(
    invalidRefresh.error && !invalidRefresh.data.session,
    "Um refresh token inválido criou uma sessão.",
  );

  const failingFetch: typeof fetch = async () => {
    throw new TypeError("Falha de rede simulada.");
  };
  const offlineClient = createPkceClient(
    status.API_URL,
    status.PUBLISHABLE_KEY,
    failingFetch,
  );
  const offline = await offlineClient.auth.signInWithOtp({
    email: `offline-${randomUUID()}@example.test`,
  });
  assert(
    offline.error && !offline.data.session,
    "Uma falha de rede criou uma sessão.",
  );

  await client.auth.signOut({ scope: "local" });
  process.stdout.write(
    "APROVADO: expiração, refresh válido/inválido e falha de rede no Auth local.\n",
  );
}

await run();
