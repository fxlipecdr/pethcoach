import { expect, type Page } from "@playwright/test";

const mailpit = process.env.FUNNEL_MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitSummary {
  messages: { ID: string; To: { Address: string }[] }[];
}

/** Endereço novo a cada uso: o envio de magic link é limitado a 1/min por e-mail. */
export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@funil.local`;
}

async function findMessageId(address: string) {
  const response = await fetch(`${mailpit}/api/v1/messages?limit=50`);
  if (!response.ok) return null;
  const data = (await response.json()) as MailpitSummary;
  const match = data.messages.find((message) =>
    message.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
  );
  return match?.ID ?? null;
}

/**
 * Lê o link de acesso que o Supabase entregou ao Mailpit.
 *
 * O e-mail traz a URL de verificação do próprio Auth; abri-la faz o Auth
 * redirecionar para `/auth/callback` com o `code`, que é o caminho real do
 * usuário. Nada aqui inventa sessão nem escreve cookie à mão.
 */
export async function readMagicLink(address: string): Promise<string> {
  let id: string | null = null;
  for (let attempt = 0; attempt < 40 && !id; attempt += 1) {
    id = await findMessageId(address);
    if (!id) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  expect(id, `nenhum e-mail chegou para ${address}`).toBeTruthy();

  const raw = await fetch(`${mailpit}/api/v1/message/${id}`).then((response) =>
    response.json(),
  );
  const body = `${raw.HTML ?? ""}${raw.Text ?? ""}`;
  const link = body.match(/https?:\/\/[^\s"'<>]*\/auth\/v1\/verify[^\s"'<>]*/)?.[0];
  expect(link, "o e-mail não continha link de verificação").toBeTruthy();
  return link!.replace(/&amp;/g, "&");
}

/** Percorre o acesso como o tutor faria: formulário, e-mail e link. */
export async function signIn(page: Page, address: string) {
  await page.goto("/entrar");
  await page.getByLabel(/e-mail/i).fill(address);
  await page.getByRole("button", { name: /receber link/i }).click();
  await expect(page.getByText(/enviamos|verifique|caixa de entrada/i).first()).toBeVisible();
  const link = await readMagicLink(address);
  await page.goto(link);
  await page.waitForURL(/\/app(?:\/|$)/, { timeout: 60000 });
}
