import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .url()
    .refine((value) => /^https?:\/\//.test(value), "Use HTTP ou HTTPS.")
    .optional(),
);

export const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalText,
    NEXT_PUBLIC_POSTHOG_KEY: optionalText,
    NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  })
  .superRefine((env, ctx) => {
    for (const [url, key] of [
      ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      ["NEXT_PUBLIC_POSTHOG_HOST", "NEXT_PUBLIC_POSTHOG_KEY"],
    ] as const) {
      if (Boolean(env[url]) !== Boolean(env[key]))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `Configure ${url} e ${key} juntos.`,
        });
    }
    const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (key && !key.startsWith("sb_publishable_"))
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
        message:
          "Use uma chave sb_publishable_, nunca uma chave secreta ou service_role.",
      });
  });

export const serverEnvSchema = z
  .object({
    ASSESSMENT_TOKEN_SECRET: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(32).max(256).optional(),
    ),
    SUPABASE_SECRET_KEY: optionalText,
    OPENAI_API_KEY: optionalText,
    AI_MODEL_PLANNER: optionalText,
    AI_MODEL_COPY: optionalText,
    AI_MODEL_REVIEW: optionalText,
    AI_GENERATION_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    STRIPE_SECRET_KEY: optionalText,
    STRIPE_WEBHOOK_SECRET: optionalText,
    STRIPE_PRICE_MONTHLY: optionalText,
    STRIPE_PRICE_ANNUAL: optionalText,
    STRIPE_PRICE_SINGLE_PROGRAM: optionalText,
    RESEND_API_KEY: optionalText,
    EMAIL_FROM: optionalText,
    SENTRY_DSN: optionalUrl,
  })
  .superRefine((env, ctx) => {
    if (
      env.AI_GENERATION_ENABLED &&
      (!env.OPENAI_API_KEY || !env.AI_MODEL_PLANNER)
    )
      ctx.addIssue({
        code: "custom",
        path: ["AI_GENERATION_ENABLED"],
        message: "Ativar IA exige chave e modelo do planner.",
      });
  });

export function parseEnvironment<T>(schema: z.ZodType<T>, values: unknown): T {
  const result = schema.safeParse(values);
  if (!result.success) {
    // Report field names only; never log supplied values or credential-bearing URLs.
    throw new Error(
      `Configuração de ambiente inválida: ${[...new Set(result.error.issues.map((issue) => issue.path.join(".")))].join(", ")}`,
    );
  }
  return result.data;
}
