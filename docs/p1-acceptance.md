# P1 — Design system e marketing shell

Fonte: prompt P1 da seção 25, página 17, e direção visual da seção 6 do blueprint. A solicitação atual autoriza concluir essa fase. A preferência do usuário de substituir cores e logos depois permanece válida: o sistema de tokens estável é a entrega; a identidade oficial não é um bloqueio da P1.

## Matriz de implementação

| Critério | Entrega e localização |
|---|---|
| Tokens CSS e mobile-first | `app/globals.css`: cores semânticas, formas, larguras de dashboard/fluxo, tipografia e movimento reduzido |
| Button | `components/ui/button.tsx`: variantes, foco, disabled e loading tipado; links compostos com Slot |
| Input e Select | `components/ui/primitives.tsx`: controles nativos, labels reais via Field, disabled, readonly e aria-invalid |
| ChoiceCard | `components/ui/choice-card.tsx`: rádio nativo, descrição, seleção, teclado, foco, disabled e estilo de erro |
| Card e Badge | Primitivos reutilizados no produto e no kit, sem dados ou métricas fictícios |
| Dialog | Radix com título/descrição, foco contido, Escape, retorno de foco e rolagem em telas baixas |
| Drawer / Sheet | Painel inferior e lateral sobre Radix; respeito à área segura, rolagem e preferência de movimento reduzido |
| Toast | Sonner com mensagens e nomes acessíveis em PT-BR; exemplos de informação, sucesso e erro |
| Skeleton e EmptyState | Estados de carregamento e ausência de conteúdo; sem controles falsamente ativos |
| Progress e Stepper | Progresso nomeado e lista de etapas com indicação semântica da etapa atual |
| Estados e feedback | Field e Feedback compartilham ajuda/erro/confirmação; as mensagens não dependem apenas de cor |
| Marketing | Header/footer, home institucional PT-BR, problemas, proposta, limites e FAQ; prévia identificada como demonstração |
| Layout de acesso | `components/layouts/auth-shell.tsx`, usado em `/entrar`; ainda sem formulário ou envio de e-mail |
| Área pessoal e administração | `components/layouts/workspace-shell.tsx`; navegação própria responsiva, usada depois dos guards existentes |
| Conteúdo e fluxo | PageContainer limita o dashboard a 1200 px e o fluxo a 720 px; PageHeading padroniza a hierarquia |
| UI kit apenas em development | `/dev/ui-kit` e `/dev/layouts/{auth,app,flow,admin}` retornam 404 em produção |

## Contratos de uso

- `Button` usa `type="button"` por padrão. Formulários devem declarar `type="submit"`. `loading` desabilita a ação nativa e define `aria-busy`; `loadingText` preserva um nome claro. A variante `asChild` não aceita loading, evitando tratar um link como ação assíncrona desabilitada.
- `ChoiceCard` mantém o comportamento do rádio nativo: agrupar por `name`, fornecer `value`, usar `fieldset`/`legend` e ligar erro do grupo por `aria-describedby`. Pode ser controlado ou não controlado.
- `Field` associa o label ao `id` do controle. O chamador liga `aria-describedby` aos IDs `${id}-hint` e/ou `${id}-error` existentes e define `aria-invalid`. O asterisco visual usa `required` junto do atributo nativo do controle.
- `Feedback` só anuncia mensagens quando `announce` é solicitado. Erros usam alert; os demais estados usam status. Exemplos estáticos do kit não precisam interromper leitores de tela.
- O drawer tem abertura por botão, Escape, botão de fechamento e ações explícitas. Não depende de gesto de arrastar para funcionar.
- `WorkspaceShell` é apresentação. `app/app/layout.tsx` chama `requireUser()` e `app/admin/layout.tsx` chama `requireAdmin()` antes de renderizá-lo. Endpoints e ações futuros continuam exigindo autorização própria.
- As prévias de layout são rotas isoladas de desenvolvimento, sem consultas, sessões artificiais, usuários, IDs ou permissões de demonstração. Parâmetros de URL não desbloqueiam os layouts reais.

## Validação de saída

**P1 concluída e validada em 31/08/2026.** `pnpm verify` aprovado (20 testes de unidade/integração); E2E em development: 20 aprovados; build aprovado; E2E sobre produção: 16 aprovados e 4 exemplos exclusivos de development omitidos. Evidências e limites em `docs/verification.md`.

Cobertura nova em `tests/e2e/p1.spec.ts`: acesso, navegação por teclado nos rádios, estado loading, foco visível, ciclo e restauração de foco do drawer, cancelar/aplicar preferências locais, viewport 360 × 480, quatro layouts, largura do fluxo, menu mobile, axe e fechamento das prévias em produção. As verificações da fundação e do refinamento visual permanecem ativas.

## Fora desta fase

P2: autenticação real e perfil do cão. P3: landings completas e SEO/indexação. P4 em diante: quiz, triagem, conteúdo aprovado, planos, cobrança, analytics e operação. A home da P1 é uma página institucional funcional, mas não anuncia recursos futuros como disponíveis. Nenhum serviço foi provisionado ou publicado externamente nesta fase.
