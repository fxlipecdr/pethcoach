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
Prompt Mestre + P0 + P1 delivered and validated. P2 is connected to a development Supabase project with Resend SMTP; migrations, remote SQL RLS tests and anonymous Data API denial passed. Real PKCE/session/logout/replay and two-user isolation through the app passed with real Auth users; direct two-JWT PostgREST acceptance, token refresh/expiry/failure cases and generated-type comparison remain pending. A Vercel Hobby validation deploy exists at `https://coach.peth.com.br` with valid DNS/HTTPS but without envs; it is noindex and Auth fails closed, so it is not a customer release. See `docs/external-services.md`, `docs/p2-acceptance.md` and `docs/p2-setup.md` before declaring P2 complete or proceeding to P3. Colors and logo remain provisional and configurable. Layout/form previews are development-only presentation fixtures, never an auth bypass. Auth and dog CRUD require configured Supabase; no live coaching, checkout or AI generation is enabled. Never equate email delivery, PGlite, SQL impersonation or mocked-provider tests with real Auth/PostgREST validation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
