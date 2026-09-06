"use server";

import { getPublicEnv } from "@/lib/env/public";
import { authLimiter, privateRateKey } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { paymentProvider } from "@/lib/stripe/provider";
import {
  createCheckoutInputSchema,
  type CreateCheckoutInput,
} from "./contracts";
import { getBillingCustomer } from "./data";

export type CreateCheckoutActionResult =
  | {
      status: "success";
      checkoutUrl: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function createCheckoutSessionAction(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutActionResult> {
  const parsed = createCheckoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Opção de plano inválida.",
    };
  }

  const client = await createSupabaseServerClient();
  if (!client) {
    return {
      status: "error",
      message: "Serviço indisponível no momento.",
    };
  }

  const session = await client.auth.getUser().catch(() => null);
  if (!session || !session.data.user) {
    return {
      status: "error",
      message: "Você precisa entrar na sua conta para assinar o plano.",
    };
  }
  const user = session.data.user;

  if (!authLimiter.allow(`checkout:${privateRateKey(user.id)}`, 10, 60_000)) {
    return {
      status: "error",
      message: "Muitas tentativas recentes. Aguarde um minuto e tente novamente.",
    };
  }

  const customer = await getBillingCustomer(client, user.id);
  const publicEnv = getPublicEnv();
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

  const successUrl = `${siteUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = parsed.data.dogId
    ? `${siteUrl}/app/caes/${parsed.data.dogId}`
    : `${siteUrl}/app/conta`;

  const result = await paymentProvider.createCheckout({
    userId: user.id,
    userEmail: user.email ?? "",
    planType: parsed.data.planType,
    successUrl,
    cancelUrl,
    stripeCustomerId: customer?.stripeCustomerId,
    metadata: {
      dogId: parsed.data.dogId ?? "",
      // Viajam até o webhook para que a conversão de servidor saiba se há
      // aceite e com quais identificadores casar o evento do navegador.
      metaConsent: parsed.data.meta?.consent ?? "pending",
      metaFbp: parsed.data.meta?.fbp ?? "",
      metaFbc: parsed.data.meta?.fbc ?? "",
    },
  });

  if (!result.ok) {
    if ("code" in result && result.code === "NOT_IMPLEMENTED") {
      return {
        status: "error",
        message:
          "O sistema de pagamentos da Stripe está em preparação para este ambiente.",
      };
    }
    return {
      status: "error",
      message: "error" in result ? result.error : "Não foi possível iniciar o checkout.",
    };
  }

  return {
    status: "success",
    checkoutUrl: result.url,
  };
}

export type CreatePortalActionResult =
  | {
      status: "success";
      portalUrl: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function createCustomerPortalAction(): Promise<CreatePortalActionResult> {
  const client = await createSupabaseServerClient();
  if (!client) {
    return {
      status: "error",
      message: "Serviço indisponível no momento.",
    };
  }

  const session = await client.auth.getUser().catch(() => null);
  if (!session || !session.data.user) {
    return {
      status: "error",
      message: "Você precisa entrar na sua conta.",
    };
  }
  const user = session.data.user;

  if (!authLimiter.allow(`portal:${privateRateKey(user.id)}`, 10, 60_000)) {
    return {
      status: "error",
      message: "Muitas tentativas recentes. Aguarde um minuto e tente novamente.",
    };
  }

  const customer = await getBillingCustomer(client, user.id);
  if (!customer?.stripeCustomerId) {
    return {
      status: "error",
      message:
        "Nenhum registro de faturamento associado à sua conta ainda. Assine um plano para habilitar o portal de gestão.",
    };
  }

  const publicEnv = getPublicEnv();
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
  const returnUrl = `${siteUrl}/app/conta`;

  const result = await paymentProvider.createPortal({
    stripeCustomerId: customer.stripeCustomerId,
    returnUrl,
  });

  if (!result.ok) {
    if ("code" in result && result.code === "NOT_IMPLEMENTED") {
      return {
        status: "error",
        message:
          "O portal de gestão da Stripe está em preparação para este ambiente.",
      };
    }
    return {
      status: "error",
      message: "error" in result ? result.error : "Não foi possível abrir o portal.",
    };
  }

  return {
    status: "success",
    portalUrl: result.url,
  };
}
