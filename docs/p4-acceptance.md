# P4 — quiz e assessments anônimos

P4 concluída tecnicamente em 01/09/2026. A fase registra respostas observáveis com segurança e não produz diagnóstico, triagem, plano ou recomendação. Todo assessment concluído permanece com `safety_status = pending` para processamento determinístico na P5.

## Implementado

- Três quizzes publicados e versionados, com oito perguntas em PT-BR para puxar a guia, mordidas de filhote e xixi no lugar errado.
- Uma pergunta por tela, progresso discreto, retorno sem perder respostas e retomada por até sete dias.
- Conteúdo limitado a situações observáveis, sem linguagem diagnóstica, medicação ou instruções aversivas. Metadados de risco ficam privados para a futura P5.
- Tabelas `problems`, `quiz_questions` e `assessments` com RLS forçada, grants mínimos e proibição de leitura/escrita direta dos assessments por `anon` e `authenticated`.
- Route Handlers com validação Zod, mutações same-origin, JSON e tamanho limitados, mensagens tipadas e nenhum segredo no cliente.
- Token HMAC imprevisível em cookie HttpOnly, SameSite=Lax e Secure em produção. O banco armazena somente o hash SHA-256 e a expiração; o localStorage não recebe token nem respostas.
- RPCs estreitas para criar, retomar, salvar uma resposta válida e concluir de modo idempotente. Chaves de questão/opção são verificadas contra a versão publicada.
- Rate limit atômico no PostgreSQL por chave pseudônima de rede/visitante ou hash do token: 10 criações, 120 atualizações e 10 conclusões a cada dez minutos.
- `started_at` e `completed_at` persistidos pelo servidor como registros canônicos de `quiz_started` e `quiz_completed`. O adaptador PostHog respeita consentimento e permanece inativo nesta fase.
- Resultado provisório informa apenas que as respostas foram salvas. Não há classificação, encaminhamento, paywall ou claim antes de P5/P6.

## Verificação

- Migration aplicada ao projeto Supabase dev por CLI com TLS `verify-full`; novo dry run confirmou o banco remoto atualizado. A Data API pública retornou os três problemas publicados e negou leitura direta de `assessments` com HTTP 401/código 42501.
- O fluxo local real, conectado ao Supabase hospedado, criou um assessment via Route Handler, carregou oito perguntas, salvou as oito respostas e concluiu com HTTP 200. Os dois registros e quatro contadores descartáveis gerados durante o aceite foram removidos em seguida.
- Integração PGlite valida 3 quizzes/24 perguntas, RLS/grants, token expirado, opção forjada, resposta/conclusão, idempotência e rate limit.
- Unitários validam contratos, token, persistência local, origem/cookie e Route Handlers.
- Playwright valida desktop e 360 px, axe, uma pergunta por tela, voltar, reload, conclusão e ausência de credenciais/respostas no localStorage.
- `pnpm verify` aprovado: lint, TypeScript strict e 70 testes em 11 arquivos. `pnpm e2e:smoke` aprovado com 34 cenários em desktop e 360 px. `pnpm build` aprovado com as três Route Handlers de assessment no bundle.

## Limites e próximo passo

O conteúdo ainda precisa de revisão profissional antes da abertura ao público. A política de privacidade permanece provisória. Assessments anônimos não têm ownership de usuário nem claim; isso pertence à P6. A introspecção física gerada não pôde ser atualizada nesta sessão porque Docker não está disponível e a CLI remota exige um PAT; o overlay estrito em `database.types.ts` cobre as tabelas e RPCs P4 e passou no typecheck. A P5 deve implementar o safety gate determinístico antes de qualquer resultado, com cobertura explícita de agressão de alto risco, mudança súbita, dor suspeita, sofrimento intenso e autoagressão. Nenhum LLM participa dessa decisão.
