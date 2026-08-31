# Interface e identidade visual

Sistema visual da P1, concluído em 31/08/2026 após o refinamento de UI/UX solicitado sobre a fundação P0. Critérios de aceite em `docs/p1-acceptance.md`. Nenhum recurso de negócio foi ativado.

## Direção visual

Tipografia Geist local, títulos com maior hierarquia, espaço entre seções, ícones Lucide e superfícies discretas. Os programas têm categorias e números, além de cores, para não depender exclusivamente da percepção de cor. A paleta e a marca atuais continuam provisórias.

Uma ação principal na home leva à proposta dos programas. A prévia tem abas de contexto e três etapas navegáveis, explicitamente identificadas como demonstração. Não cria perfil, treino, pagamento, evento de analytics ou dado persistente. O menu mobile usa painel lateral com foco contido e retorno ao botão ao fechar. FAQ compartilhado entre home e ajuda.

## Bibliotecas e uso concreto

| Recurso | Implementação |
|---|---|
| Tailwind CSS | Layout responsivo e tokens semânticos |
| Radix UI, composição no padrão shadcn | Tabs, Accordion, Dialog, Sheet e Drawer; teclado, foco e estados acessíveis |
| Lucide | Ícones consistentes; decorativos ocultos de tecnologias assistivas |
| Motion | Transição curta entre etapas da prévia, sem movimentos contínuos |
| Sonner | Toast no kit de desenvolvimento, com exemplo local funcional |
| React Hook Form + Zod | Validação do formulário de demonstração já existente |

Os componentes ficam no repositório, em `components/ui/`, e podem ser adaptados sem trocar a arquitetura. Motion respeita `prefers-reduced-motion`; as animações CSS também são desativadas nessa preferência. A página continua majoritariamente renderizada no servidor, com componentes de cliente limitados às interações.

## Trocar as cores

Edite `:root` em `app/globals.css`. As telas consomem tokens como `primary`, `foreground`, `card`, `muted`, `strong`, `border` e cores auxiliares dos programas. Sombras também são derivadas dos tokens, sem uma segunda paleta fixa nos componentes. O UI kit mostra os nomes das variáveis.

Mantenha os pares de contraste: `primary` / `primary-foreground`, `strong` / `strong-foreground`, `background` / `foreground` e `card` / `muted-foreground`. Reexecute axe e a inspeção visual após trocar a paleta; a acessibilidade verificada hoje não garante contraste de cores futuras.

## Trocar a logo

1. Coloque o arquivo oficial em `public/brand/` (crie a pasta ao adicionar o arquivo).
2. Em `lib/brand.ts`, configure `logo` com `src`, `width` e `height`. Exemplo de formato: `{ src: "/brand/logo.svg", width: 180, height: 40 }`; o arquivo precisa existir.
3. O componente compartilhado `Brand` atualiza cabeçalho, rodapé, menu e área de acesso. `logo: null` mantém o símbolo provisório. Nome e assinatura também ficam nessa configuração.
4. Atualize separadamente `app/icon.svg` para o favicon. Metadata e textos editoriais devem ser revisados se o nome do produto também mudar.

## Verificação e limites

`tests/e2e/design-system.spec.ts` cobre abas por teclado, mudança e reset de etapas, movimento reduzido, menu mobile, restauração de foco, navegação, FAQ e toast. A suíte da fundação mantém verificação de overflow em 360px, axe e proteção de rotas. O kit `/dev/ui-kit` continua indisponível em produção.

A revisão visual confere desktop, 360px, abertura dos painéis e todos os layouts da P1. Fluxos completos de quiz, autenticação, plano, billing e operação administrativa continuam no roadmap.

## Layouts e componentes da P1

- `components/layouts/auth-shell.tsx`: acesso com cabeçalho reduzido, coluna de contexto no desktop e conteúdo focado no celular.
- `components/layouts/workspace-shell.tsx`: área pessoal e administração com barra lateral no desktop e Sheet no celular. As rotas reais continuam verificando sessão/permissão antes de renderizar.
- `PageContainer`: largura máxima de 1200 px para conteúdo geral e 720 px para fluxos. `PageHeading` usa escala de 24–32 px no app.
- `ChoiceCard`: rádio nativo reutilizável; `Field`: label/ajuda/erro; `Feedback`: estados sem depender apenas de cor; `Button`: loading, disabled e tipo nativo seguro por padrão.
- `/dev/layouts/auth`, `/dev/layouts/app`, `/dev/layouts/flow` e `/dev/layouts/admin`: prévias isoladas, sem dados de usuários. Todos os atalhos aparecem no início do UI kit. Essas rotas retornam 404 fora de development.

Tokens de forma (`--shape-control`, `--shape-card`, `--shape-panel`), largura (`--layout-dashboard`, `--layout-flow`) e duração (`--motion-feedback`, `--motion-panel`) também ficam em `app/globals.css`. Os contratos de uso e a matriz completa estão em `docs/p1-acceptance.md`.

Referências oficiais consultadas: [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs), [Radix Accordion](https://www.radix-ui.com/primitives/docs/components/accordion), [Motion](https://motion.dev/docs/react-animation), [Sonner](https://sonner.emilkowal.ski/).
