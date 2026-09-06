import { getServerEnv } from "@/lib/env/server";
import { getPublicEnv } from "@/lib/env/public";
import { scrubDiagnosticEvent } from "@/lib/observability/scrub";

/**
 * Inicialização do servidor.
 *
 * Esta função roda uma vez por processo, **antes de qualquer rota**, inclusive
 * das que não dependem de nada — `/api/health` incluída. Por isso ela não pode
 * lançar: uma exceção aqui não degrada um recurso, tira o site inteiro do ar
 * com 500 em toda URL.
 *
 * Foi exatamente o que aconteceu. A validação de ambiente era chamada solta,
 * e uma variável mal preenchida derrubou a aplicação inteira em produção. A
 * verificação continua valendo — o que muda é que a falha vira registro no log,
 * com o nome do campo, em vez de indisponibilidade total.
 *
 * O nome do campo é seguro para o log: `parseEnvironment` reporta apenas o
 * caminho do erro, nunca o valor recebido.
 */
export async function register() {
  let dsn: string | undefined;

  try {
    getPublicEnv();
    dsn = getServerEnv().SENTRY_DSN;
  } catch (err) {
    console.error(
      `[ambiente] configuração inválida detectada na inicialização: ${
        err instanceof Error ? err.message : "erro desconhecido"
      }. O servidor continua de pé; corrija a variável indicada.`,
    );
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs" && dsn) {
    try {
      const sentry = await import("@sentry/nextjs");
      sentry.init({
        dsn,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        defaultIntegrations: false,
        beforeSend: scrubDiagnosticEvent,
      });
    } catch (err) {
      // Monitoramento indisponível é problema; site fora do ar é pior.
      console.error(
        `[sentry] inicialização falhou: ${err instanceof Error ? err.message : "erro desconhecido"}`,
      );
    }
  }
}

export async function onRequestError() {
  try {
    if (!getServerEnv().SENTRY_DSN) return;
    const sentry = await import("@sentry/nextjs");
    sentry.captureMessage("Falha de requisição no servidor", "error");
  } catch {
    // Já estamos tratando um erro de requisição: falhar aqui só o esconderia.
  }
}
