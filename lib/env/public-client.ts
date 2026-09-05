import type { PublicEnv } from "./public";

/**
 * Leitura do ambiente público no navegador, sem Zod — P15.
 *
 * O Next substitui `process.env.NEXT_PUBLIC_*` por literais no build, então no
 * cliente essas variáveis são constantes: validá-las de novo não protege nada
 * e arrastava o schema Zod (`lib/env/schema.ts`) para o bundle inicial de toda
 * página. A validação continua acontecendo no servidor, via `getPublicEnv`,
 * que é onde uma configuração errada precisa falhar cedo.
 *
 * Aqui só reproduzimos a normalização do schema: string vazia vira `undefined`,
 * para que `if (!env.X)` continue se comportando igual.
 */
function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getPublicEnvClient(): PublicEnv {
  // Acesso literal é obrigatório: o Next só substitui a expressão completa.
  return {
    NEXT_PUBLIC_SITE_URL: present(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_SUPABASE_URL: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: present(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    NEXT_PUBLIC_POSTHOG_KEY: present(process.env.NEXT_PUBLIC_POSTHOG_KEY),
    NEXT_PUBLIC_POSTHOG_HOST: present(process.env.NEXT_PUBLIC_POSTHOG_HOST),
    NEXT_PUBLIC_SENTRY_DSN: present(process.env.NEXT_PUBLIC_SENTRY_DSN),
  };
}
