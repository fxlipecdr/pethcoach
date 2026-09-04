# PethCoach - AGENTS.md

## Mission
Build a production-grade, mobile-first dog behavior coaching SaaS for Brazil. Prioritize safety, conversion, maintainability, and measurable product outcomes.

## Non-negotiable product rules
- This product is not a veterinary diagnosis or treatment system.
- Never generate medication, diagnosis, medical prognosis, or clinical certainty.
- Training guidance must be reward-based only.
- Safety rules are deterministic and run before any LLM planner.
- The LLM may only select/reorder/personalize approved behavior modules.
- Never allow a model-generated module id that is not in the published catalog.
- High-risk aggression, sudden behavior change, suspected pain, severe distress, or self-injury must trigger the documented referral path.

## Engineering rules
- TypeScript strict. Avoid `any`; explain unavoidable exceptions.
- Prefer server components/actions for sensitive data and authorization.
- Validate all external/user input with Zod.
- Supabase RLS is mandatory for user-owned tables.
- Never expose service-role keys or provider secrets to the browser.
- Billing access is granted only from verified webhook state/entitlements.
- Webhooks must be signature-verified and idempotent.
- AI calls must use strict structured outputs and persist model/prompt/content versions.
- Keep providers behind adapters (`AIProvider`, `PaymentProvider`, `AnalyticsProvider` where useful).
- Use accessible semantic HTML; WCAG 2.2 AA target.
- All copy shown to users is PT-BR unless a task explicitly says otherwise.
- No lorem ipsum or fake testimonials.

## UX rules
- Mobile-first; test at 360px width.
- One primary CTA per screen.
- No dark patterns, fake urgency, or guilt-based streak mechanics.
- Every async action needs loading/error/success states.
- Keep daily plans to 1-3 tasks and make estimated duration visible.

## Required commands before task completion
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm e2e:smoke` when the task touches a critical user flow.

## Change protocol
1. Read relevant files and docs before editing.
2. State a short plan for changes.
3. Make the smallest coherent implementation.
4. Add/update tests.
5. Run required commands.
6. Summarize files changed, tests run, known limitations, and next recommended task.

## Do not
- Do not invent credentials or external IDs.
- Do not hard-code prices, Stripe product IDs, model names, or domains that belong in env/config.
- Do not bypass RLS to make it work.
- Do not remove tests or safety checks to pass CI.
- Do not silently replace a working architecture with a new framework.

## Current phase
Prompt Mestre + P0 + P1 + P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9 + P10 + P11 + P12 + P13 delivered and technically validated. P2 uses a development Supabase project with Resend SMTP; migrations, remote SQL RLS tests, anonymous denial, real PKCE/session/logout/replay, two-user app isolation and direct two-JWT PostgREST acceptance passed. The production Vercel callback/login was also confirmed by the responsible user. P3 adds three unique problem landings with SEO/OG. P4 adds three versioned quizzes with anonymous HMAC token and Postgres distributed rate limits. P5 adds atomic deterministic safety gate (BLOCK > REFER > CONTINUE) with audit trail. P6 delivers observable behavioral synthesis for CONTINUE, keeps REFER/BLOCK strictly outside the commercial funnel, and implements cryptographic claim via HMAC token, ownership RLS and dog profile linking. P7 implements the reviewed positive reinforcement modules catalog, strict anti-hallucination validation, deterministic 14-day progression with 1-3 tasks/day and visible duration, and mobile-first plan interface. P8 delivers dashboard integration with today's training card, server-side entitlement authorization (Day 1 is 100% free, Days 2-14 require entitlement), daily check-in with mindful pause management (no guilt-based streaks), and RLS on public.entitlements and public.daily_checkins. P9 delivers check-in difficulty perception, deterministic safety gate with immediate safety pause and veterinary referral, idempotent milestone unlocks (5 milestones), schedule adaptation audit trail, and responsive Timeline tab. P10 delivers official Stripe SDK integration, PaymentProvider with typed credentials fallback, billing_customers and processed_webhook_events idempotency tables, signed raw webhook verification route (/api/webhooks/stripe), automatic entitlement grant on checkout/subscription events, rate-limited server actions, celebratory success screen (/checkout/sucesso) and customer portal billing card (/app/conta). P11 delivers LGPD cookie consent banner and preference toggle, strict client/server event tracking allowlists across all 12 funnel events with zero PII, anonymous-to-user attribution linking, first-touch & last-touch UTM attribution pipeline in public.attribution_touches with RLS, server-side purchase_completed dispatch on verified Stripe webhook, and 100% test coverage across 194 unit/integration tests and 60 smoke tests. P12 delivers 7 welcoming, guilt-free transactional email templates, purpose-based LGPD consent, 1-click token unsubscribe (/unsubscribe), notification preference card (/app/conta), public.email_preferences and public.email_delivery_logs with RLS, Resend provider with typed fallback, idempotent delivery ledger, automated retention jobs, and 100% test coverage across 205 vitest tests and 64 smoke tests. P13 delivers operator RBAC (admin, reviewer, operator) with Supabase RLS and server-side authorization, behavioral module editorial lifecycle (draft -> reviewed -> published -> archived) with mandatory technical notes and public.module_revisions audit trail, deterministic anti-aversive keyword rejection on all module edits/creations, Zero PII Operational Inspector (/admin/inspector) with email masking for LGPD support, mobile-first admin interface (/admin, /admin/modulos, /admin/inspector) with WCAG 2.2 AA (0 Axe violations), and 100% test coverage across 218 vitest tests and 68 smoke tests. Next phase is P14 (Segurança e privacidade). The Vercel Hobby validation deploy at `https://coach.peth.com.br` has valid DNS/HTTPS and production-only public Supabase envs; it remains noindex and is not a customer release. See `docs/p13-acceptance.md`. Layout/form previews are development-only presentation fixtures, never an auth bypass. No live coaching, checkout or unverified AI generation is enabled. Never equate email delivery, PGlite, SQL impersonation or mocked-provider tests with real Auth/PostgREST validation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
