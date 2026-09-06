# Revisão geral do sistema — 05/09/2026

Varredura completa antes de colocar o produto para rodar. Cobre portões automatizados, segurança, dados e higiene do repositório. O que foi verificado está listado com o método, para que a próxima revisão saiba o que já foi olhado e como.

## Portões automatizados

Todos executados com o código de saída real, sem canalizar a saída para `tail` — um `pnpm typecheck | tail` devolve o status do `tail`, não do TypeScript, e mascara falha.

| Portão | Resultado |
|---|---|
| `pnpm lint` | 0 |
| `pnpm typecheck` | 0 |
| `pnpm test` | 0 — 32 arquivos, 262 testes |
| `pnpm test:integration` | 0 — 15 arquivos, 117 testes |
| `pnpm build` | 0 |
| `pnpm e2e:smoke` | 74/74 |
| `pnpm audit` | nenhuma vulnerabilidade conhecida |

`pnpm e2e:funnel` não foi executado: exige credenciais reais e stack local de pé.

## Segurança — o que foi verificado

- **Chave de serviço.** `SUPABASE_SECRET_KEY` aparece em um único lugar, `lib/supabase/admin.ts`, marcado com `import "server-only"`. A `service_role` clássica não é usada em lugar nenhum: só aparece numa mensagem de validação que a **rejeita**.
- **Variáveis públicas.** As seis `NEXT_PUBLIC_*` são legitimamente públicas — URL do site, URL e chave publicável do Supabase, host e chave de projeto do PostHog, DSN do Sentry. Nenhum segredo exposto ao navegador.
- **RLS.** As 20 tabelas de `public` têm row level security ativa, com 30 políticas. Nenhuma política `using (true)`.
- **Autorização.** O proxy só renova sessão; quem autoriza são as páginas e as ações, via `requireUser`, que usa `auth.getUser()` — validação no servidor, não leitura de cookie. Contas anonimizadas a pedido do titular perdem acesso mesmo com sessão válida em outro dispositivo.
- **Rotas de API.** Cada uma tem sua forma de autorização: sessão em `/api/conta/exportar`, token HMAC em cookie nas rotas de assessment, assinatura Stripe verificada no webhook, `CRON_SECRET` em `/api/ready` e no job de retenção. `/api/health` não revela configuração.
- **Limites de requisição.** Todas as ações mutáveis passam por `consumeActionLimit`, com as regras no banco. Exceções conhecidas abaixo.
- **Cabeçalhos.** CSP com nonce nas rotas dinâmicas, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, HSTS com preload em produção, `Permissions-Policy` restritiva.
- **Segredos no repositório.** Nenhum `.env` versionado além do `.env.example`. Nenhum vazamento de chave de produção.
- **Fronteiras de erro.** `app/error.tsx` e `app/global-error.tsx` mostram mensagem genérica, sem stack nem texto do erro.

## Corrigido nesta revisão

**1. Andaime do Sentry exposto em produção.** `app/api/sentry-example-api` e `app/sentry-example-page` vinham do gerador do Sentry e continuavam publicados. A rota de API lança exceção em **todo** GET, sem autenticação: qualquer pessoa podia chamá-la em laço e esgotar a cota de eventos do Sentry, além de poluir os alertas com erro falso. Ambas removidas. Se for preciso testar o Sentry de novo, restaurar do histórico do git.

**2. `pnpm test:integration` rodava a suíte inteira.** `mergeConfig` do Vitest **concatena** arrays em vez de substituir, então o `include` da configuração de integração somava aos padrões da base: 32 arquivos em vez dos 15 de integração, sem nenhum sinal de que estava fazendo mais do que o nome diz. O `include` passou a ser sobrescrito depois da mesclagem. Agora roda 15 arquivos, 117 testes.

## Achados aceitos, com o motivo

- **Limites de auth e billing são por instância.** `authLimiter` guarda contagem em memória. Numa plataforma com várias instâncias, o limite vale por instância, não globalmente. Afeta o envio de link mágico e a criação de sessão de checkout. Os limites que protegem dados — escrita de cão, plano, check-in, perfil, exportação, exclusão — usam o banco e são distribuídos de fato. Vale migrar auth e billing para o mesmo mecanismo quando houver tráfego real.
- **`'unsafe-inline'` em `script-src` nas rotas públicas estáticas.** Página estática não tem nonce possível, porque o HTML sai do build. As rotas que leem sessão ou parâmetro usam nonce e não têm `'unsafe-inline'`. Decisão registrada em `lib/security/csp.ts`.
- **Chaves de stack local nos arquivos do funil.** `playwright.funnel.config.ts` e `tests/e2e-funnel/billing.spec.ts` têm chaves `sb_publishable_`/`sb_secret_` como valor padrão, ao lado de `http://127.0.0.1:54321`. São da stack local, não do projeto remoto — a chave publicável ali é diferente da do projeto de São Paulo. Inalcançáveis de fora.

## Observações operacionais

- **Indexação.** `app/robots.ts` tem `disallow: "/"` **fixo**, e todas as páginas trazem `robots: { index: false }` no metadata. Liberar indexação exige editar esses dois lugares — não é controlado por variável de ambiente.
- **Testes em Windows.** Executar a suíte E2E muitas vezes seguidas esgota sockets e produz `net::ERR_NO_BUFFER_SPACE`, que se parece com falha de aplicação e não é. Aconteceu uma vez nesta revisão, com 519 sockets em `TIME_WAIT`; o mesmo teste passou ao ser repetido.
- **Servidores de desenvolvimento.** Encerrar o shell não mata o processo filho do Next. Conferir a porta depois de parar um servidor, porque servidor esquecido compete por CPU e faz a suíte parecer lenta ou instável.
