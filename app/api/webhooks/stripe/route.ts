import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/stripe/provider";
import {
  grantOrUpdateEntitlement,
  isWebhookEventProcessed,
  recordProcessedWebhookEvent,
  upsertBillingCustomer,
} from "@/features/billing/data";

export async function POST(req: NextRequest) {
  let env;
  try {
    env = getServerEnv();
  } catch {
    return NextResponse.json(
      { error: "Configuração do servidor inválida." },
      { status: 500 },
    );
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret não configurado no servidor." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura stripe-signature ausente." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = paymentProvider.constructWebhookEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `Assinatura de webhook inválida: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      },
      { status: 400 },
    );
  }

  const client = createSupabaseAdminClient();
  if (!client) {
    return NextResponse.json(
      { error: "Serviço de banco de dados temporariamente indisponível." },
      { status: 503 },
    );
  }

  // Idempotency: skip if already processed
  const alreadyProcessed = await isWebhookEventProcessed(client, event.id);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ?? session.metadata?.userId;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const planType = session.metadata?.planType;

        if (userId && customerId) {
          await upsertBillingCustomer(client, {
            userId,
            stripeCustomerId: customerId,
          });

          const scope =
            planType === "single_program" ? "full_program" : "subscription";
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id ?? null;

          await grantOrUpdateEntitlement(client, {
            userId,
            scope,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            expiresAt: null,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        const userId = subscription.metadata?.userId;

        let targetUserId = userId;
        if (!targetUserId && customerId) {
          const { data: customerRecord } = await client
            .from("billing_customers")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          targetUserId = customerRecord?.user_id;
        }

        if (targetUserId) {
          let status: "active" | "past_due" | "canceled" | "expired" = "active";
          if (
            subscription.status === "past_due" ||
            subscription.status === "unpaid"
          ) {
            status = "past_due";
          } else if (
            subscription.status === "canceled" ||
            subscription.status === "incomplete_expired"
          ) {
            status = "canceled";
          } else if (
            subscription.status === "active" ||
            subscription.status === "trialing"
          ) {
            status = "active";
          }

          // In Stripe SDK subscription items, current_period_end is seconds timestamp
          const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
          const expiresAt = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;

          await grantOrUpdateEntitlement(client, {
            userId: targetUserId,
            scope: "subscription",
            status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            expiresAt,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        let targetUserId = subscription.metadata?.userId;

        if (!targetUserId && customerId) {
          const { data: customerRecord } = await client
            .from("billing_customers")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          targetUserId = customerRecord?.user_id;
        }

        if (targetUserId) {
          await grantOrUpdateEntitlement(client, {
            userId: targetUserId,
            scope: "subscription",
            status: "canceled",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            expiresAt: new Date().toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          const { data: customerRecord } = await client
            .from("billing_customers")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (customerRecord?.user_id) {
            const subscriptionObj = invoice as unknown as { subscription?: string | { id: string } };
            const subscriptionId =
              typeof subscriptionObj.subscription === "string"
                ? subscriptionObj.subscription
                : subscriptionObj.subscription?.id;

            if (subscriptionId) {
              await grantOrUpdateEntitlement(client, {
                userId: customerRecord.user_id,
                scope: "subscription",
                status: "past_due",
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              });
            }
          }
        }
        break;
      }

      default:
        break;
    }

    // Record event as processed in the idempotency ledger
    await recordProcessedWebhookEvent(client, {
      eventId: event.id,
      eventType: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Erro ao processar evento de webhook: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      },
      { status: 500 },
    );
  }
}
