import { readFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../lib/supabase/database.types";

const emailSchema = z.email();
const publicKeySchema = z
  .string()
  .regex(/^sb_publishable_[A-Za-z0-9]+_[A-Za-z0-9]+$/);
const dogSchema = z.object({
  id: z.uuid(),
  owner_id: z.uuid(),
  name: z.string(),
});

type Client = SupabaseClient<Database>;
type Actor = {
  client: Client;
  userId: string;
  accessToken: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseEnv(source: string) {
  const values: Record<string, string> = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return values;
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

function createPkceClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
      storage: createMemoryStorage(),
    },
  });
}

async function exchangeEmailLink(
  label: "A" | "B",
  client: Client,
  email: string,
  callbackUrl: string,
  projectOrigin: string,
  reader: ReturnType<typeof createInterface>,
): Promise<Actor> {
  const request = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl, shouldCreateUser: true },
  });
  if (request.error)
    throw new Error(`Conta ${label}: fornecedor recusou o pedido de acesso.`);

  stdout.write(`Conta ${label}: link enviado. Cole a URL completa do e-mail: `);
  const linkText = (await reader.question("")).trim();
  const link = z.url().parse(linkText);
  const verifyUrl = new URL(link);
  assert(
    verifyUrl.origin === projectOrigin &&
      verifyUrl.pathname === "/auth/v1/verify" &&
      verifyUrl.searchParams.has("token"),
    `Conta ${label}: URL de verificação não pertence ao projeto esperado.`,
  );

  const verification = await fetch(verifyUrl, { redirect: "manual" });
  assert(
    verification.status >= 300 && verification.status < 400,
    `Conta ${label}: verificação não retornou redirecionamento.`,
  );
  const location = verification.headers.get("location");
  assert(location, `Conta ${label}: callback ausente.`);
  const callback = new URL(location);
  assert(
    callback.origin === new URL(callbackUrl).origin,
    `Conta ${label}: callback saiu da origem permitida.`,
  );
  const code = callback.searchParams.get("code");
  assert(code, `Conta ${label}: código PKCE ausente.`);

  const exchange = await client.auth.exchangeCodeForSession(code);
  if (exchange.error || !exchange.data.session)
    throw new Error(`Conta ${label}: troca PKCE falhou.`);
  const user = await client.auth.getUser(exchange.data.session.access_token);
  if (user.error || !user.data.user)
    throw new Error(`Conta ${label}: sessão não foi confirmada pelo Auth.`);

  stdout.write(`Conta ${label}: sessão Auth confirmada.\n`);
  return {
    client,
    userId: user.data.user.id,
    accessToken: exchange.data.session.access_token,
  };
}

async function dataRequest(
  projectUrl: string,
  publishableKey: string,
  actor: Actor,
  route: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("apikey", publishableKey);
  headers.set("Authorization", `Bearer ${actor.accessToken}`);
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(new URL(`/rest/v1/${route}`, projectUrl), {
    ...init,
    headers,
  });
}

async function returnedDogs(response: Response) {
  assert(response.ok, `Data API retornou HTTP ${response.status}.`);
  return z.array(dogSchema).parse(await response.json());
}

async function createDog(
  projectUrl: string,
  publishableKey: string,
  actor: Actor,
  name: string,
) {
  const response = await dataRequest(
    projectUrl,
    publishableKey,
    actor,
    "dogs?select=id,owner_id,name",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ owner_id: actor.userId, name }),
    },
  );
  const rows = await returnedDogs(response);
  const dog = rows[0];
  assert(
    rows.length === 1 && dog,
    "Criação deveria retornar exatamente um cão.",
  );
  return dog;
}

async function deleteOwnDog(
  projectUrl: string,
  publishableKey: string,
  actor: Actor,
  dogId: string,
) {
  await dataRequest(
    projectUrl,
    publishableKey,
    actor,
    `dogs?id=eq.${encodeURIComponent(dogId)}`,
    { method: "DELETE" },
  );
}

async function run() {
  const fileEnv = parseEnv(await readFile(".env.local", "utf8"));
  const projectUrl = z.url().parse(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
      fileEnv.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = publicKeySchema.parse(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const siteUrl = z.url().parse(
    process.env.NEXT_PUBLIC_SITE_URL ?? fileEnv.NEXT_PUBLIC_SITE_URL,
  );
  const projectOrigin = new URL(projectUrl).origin;
  const callback = new URL("/auth/callback", siteUrl);
  callback.searchParams.set("next", "/app");

  const reader = createInterface({ input: stdin, output: stdout });
  let actorA: Actor | undefined;
  let actorB: Actor | undefined;
  let dogAId: string | undefined;
  let dogBId: string | undefined;
  try {
    const emailA = emailSchema.parse((await reader.question("Conta A: ")).trim());
    const emailB = emailSchema.parse((await reader.question("Conta B: ")).trim());
    assert(emailA !== emailB, "As contas A e B devem ser diferentes.");

    actorA = await exchangeEmailLink(
      "A",
      createPkceClient(projectUrl, publishableKey),
      emailA,
      callback.toString(),
      projectOrigin,
      reader,
    );
    actorB = await exchangeEmailLink(
      "B",
      createPkceClient(projectUrl, publishableKey),
      emailB,
      callback.toString(),
      projectOrigin,
      reader,
    );

    const dogA = await createDog(
      projectUrl,
      publishableKey,
      actorA,
      "P2 API A",
    );
    dogAId = dogA.id;
    const dogB = await createDog(
      projectUrl,
      publishableKey,
      actorB,
      "P2 API B",
    );
    dogBId = dogB.id;

    const foreignSelect = await returnedDogs(
      await dataRequest(
        projectUrl,
        publishableKey,
        actorB,
        `dogs?id=eq.${encodeURIComponent(dogA.id)}&select=id,owner_id,name`,
      ),
    );
    assert(foreignSelect.length === 0, "Conta B conseguiu ler o cão A.");

    const foreignUpdate = await returnedDogs(
      await dataRequest(
        projectUrl,
        publishableKey,
        actorB,
        `dogs?id=eq.${encodeURIComponent(dogA.id)}&select=id,owner_id,name`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ name: "INVASAO" }),
        },
      ),
    );
    assert(foreignUpdate.length === 0, "Conta B conseguiu editar o cão A.");

    const foreignDelete = await returnedDogs(
      await dataRequest(
        projectUrl,
        publishableKey,
        actorB,
        `dogs?id=eq.${encodeURIComponent(dogA.id)}&select=id,owner_id,name`,
        {
          method: "DELETE",
          headers: { Prefer: "return=representation" },
        },
      ),
    );
    assert(foreignDelete.length === 0, "Conta B conseguiu excluir o cão A.");

    const forgedInsert = await dataRequest(
      projectUrl,
      publishableKey,
      actorB,
      "dogs",
      {
        method: "POST",
        body: JSON.stringify({ owner_id: actorA.userId, name: "INVASAO" }),
      },
    );
    assert(!forgedInsert.ok, "Conta B inseriu cão com owner_id da conta A.");

    const ownerChange = await dataRequest(
      projectUrl,
      publishableKey,
      actorB,
      `dogs?id=eq.${encodeURIComponent(dogB.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ owner_id: actorA.userId }),
      },
    );
    assert(!ownerChange.ok, "Conta B alterou owner_id.");

    const timestampChange = await dataRequest(
      projectUrl,
      publishableKey,
      actorB,
      `dogs?id=eq.${encodeURIComponent(dogB.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ created_at: new Date(0).toISOString() }),
      },
    );
    assert(!timestampChange.ok, "Conta B alterou timestamp protegido.");

    const ownerCheck = await returnedDogs(
      await dataRequest(
        projectUrl,
        publishableKey,
        actorA,
        `dogs?id=eq.${encodeURIComponent(dogA.id)}&select=id,owner_id,name`,
      ),
    );
    assert(
      ownerCheck.length === 1 && ownerCheck[0]?.name === "P2 API A",
      "Cão A não permaneceu íntegro após as tentativas cruzadas.",
    );

    stdout.write(
      "APROVADO: PKCE de duas contas e isolamento direto da Data API.\n",
    );
  } finally {
    if (actorA && dogAId)
      await deleteOwnDog(projectUrl, publishableKey, actorA, dogAId);
    if (actorB && dogBId)
      await deleteOwnDog(projectUrl, publishableKey, actorB, dogBId);
    if (actorA) await actorA.client.auth.signOut({ scope: "local" });
    if (actorB) await actorB.client.auth.signOut({ scope: "local" });
    reader.close();
  }
}

await run();
