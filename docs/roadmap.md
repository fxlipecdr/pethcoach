# Roadmap executável

## Execução atual

**Prompt Mestre + P0 a P14 implementados e validados tecnicamente. Fase atual: P15 (Release candidate), em andamento.** Cabeçalhos de segurança, Content Security Policy completa, exportação e exclusão de dados (LGPD), limite de requisições compartilhado entre instâncias e auditoria de IDOR entregues e verificados. Política de privacidade e termos de uso escritos e publicados em 05/09/2026, com controlador, encarregado, bases legais, retenção, operadores, transferência internacional e o direito de arrependimento do art. 49 do CDC. O controlador optou por seguir sem revisão de advogado nem revisão profissional do conteúdo comportamental, com o risco registrado em `docs/release-checklist.md` e `docs/pre-revisao-conteudo-e-juridica.md`. Evidências da fundação em `docs/verification.md`; matrizes em `docs/p1-acceptance.md` a `docs/p13-acceptance.md` situação de P14 em `docs/p14-acceptance.md` e da fase atual em `docs/p15-acceptance.md`. Conexão e repetição do aceite do projeto dev: `docs/p2-setup.md`. O documento de origem determina execução sequencial, com qualidade verificada ao final de cada fase.

P1 concluída após o refinamento visual: componentes, estados, home, navegação, layouts de acesso/área pessoal/admin e fluxo com largura limitada. A logo e a paleta oficiais foram integradas em 01/09/2026. Guia da identidade em `docs/ui-design.md`; isso não ativa fluxos de negócio de P2 em diante.

## Ordem de implementação

| Fase | Entrega | Critério de saída |
|---|---|---|
| P0 | Fundação e quality gates | `pnpm verify`, build e smoke sem credenciais |
| P1 | Design system e marketing shell — concluída | Componentes/estados/layouts completos; teclado/foco/360px/desktop e fechamento das prévias em produção validados |
| P2 | Banco, auth e cães — concluída | Magic link real, criação/edição de cão, RLS no Supabase e preservação do estado anônimo validados |
| P3 | Landings por problema e SEO — concluída tecnicamente | Copy única, metadata/canonical/sitemap/OG e 360px validados; indexação permanece bloqueada até revisão editorial/profissional |
| P4 | Quiz e assessments — concluída tecnicamente | Oito perguntas por problema, navegação/persistência, token anônimo seguro, rate limit distribuído e timestamps/eventos |
| P5 | Safety gate — concluída tecnicamente | Determinístico, prioridade BLOCK > REFER > CONTINUE, red flags e safety_events cobertos; revisão profissional ainda bloqueia lançamento |
| P6 | Resultado e claim — concluída tecnicamente | CONTINUE vs REFER/BLOCK; síntese observável; claim seguro via HMAC e ownership RLS no Supabase |
| P7 | Catálogo e plan engine — concluída tecnicamente | 12 módulos publicados (reforço positivo); validação anti-alucinação de IDs; fallback determinístico; 14 dias com 1-3 tarefas/dia |
| P8 | Dashboard e treino — concluída tecnicamente | 14 dias, 1-3 tarefas/dia, conclusão idempotente, Dia 1 grátis, autorização server-side e check-in diário |
| P9 | Check-ins e adaptação — concluída tecnicamente | Autoavaliação, regressão/progressão com segurança, timeline e marcos |
| P10 | Stripe e entitlements — concluída tecnicamente | Checkout/portal test mode; webhooks assinados e idempotentes; cancelamento/past_due/avulso |
| P11 | Analytics e atribuição — concluída tecnicamente | Consentimento, first/last touch, eventos deduplicados e compra no servidor |
| P12 | E-mail e retenção — concluída tecnicamente | Templates, preferências, unsubscribe, jobs idempotentes e entrega testada |
| P13 | Admin e conteúdo — concluída tecnicamente | RBAC, draft/reviewed/published, revisões, validação anti-aversiva e inspector sem PII |
| P14 | Segurança e privacidade — escopo de código concluído | IDOR e entitlement bypass auditados, rate limits compartilhados, CSP completa, exportação/exclusão entregues; documentos legais publicados, sem revisão de advogado por decisão do controlador |
| P15 | Release candidate — **em andamento** | Funil real ponta a ponta, webhook de billing, readiness protegido, backup/restore ensaiado e performance reduzida em 41%; faltam checkout hospedado do Stripe, staging, monitoring e rollback, que dependem de contas externas |
| P16 | Vídeo, somente V2 | Não executar antes dos gates abaixo |

## Gates de V2

Pelo menos 100 compradores ou volume justificável de retenção; retorno D7 consistente; demanda por feedback visual; custo de suporte controlado; catálogo e incidentes auditados; unit economics comportando armazenamento e inferência. Nenhum desses gates foi validado nesta fundação.

## Dependências externas futuras

Projeto Supabase dev/staging, produtos/preços Stripe test, Resend e domínio validado, PostHog, Sentry, chave/modelos de API OpenAI realmente disponíveis e projeto Vercel/GitHub. Não criar IDs, preços ou credenciais fictícios. Não ativar cobranças, envs de produção ou deploy público como parte da fundação.

## Procedimento por fase

Ler `AGENTS.md` e docs; definir mudança coesa; implementar; executar `pnpm verify` e smoke se tocar fluxo; revisar alterações, evidências e limitações. Credenciais ausentes não devem levar a simuladores que pareçam produção.
