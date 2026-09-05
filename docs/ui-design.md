# Interface e identidade visual

Sistema visual do PethCoach. A direção atual é a do **`DESIGN.md`** ("Pet Playground"), adotada em 05/09/2026, que substituiu a identidade azul/teal da P1. `DESIGN.md` é a fonte de verdade sobre intenção e composição; este documento registra como ela está implementada e o que precisa ser mantido.

## Direção visual

Base clara e quente (`cream`), texto em `ink` no lugar do preto absoluto, roxo pontual como ação principal e mint/lime/coral/sky como momentos de cor. Tipografia Sora nos títulos e Manrope no corpo, ambas locais via `@fontsource-variable`. Composição assimétrica, bento irregular, raios variados, sombras discretas e o mascote Peth como parte da experiência.

| Função | Token cru | Cor |
|---|---|---|
| Fundo principal | `--cream` | `#FFFDF7` |
| Texto principal | `--ink` | `#17211B` |
| Ação principal | `--purple` | `#6757E8` |
| Saúde e sucesso | `--mint` | `#9BE8C0` |
| Energia e destaques | `--lime` | `#DDF56D` |
| Carinho e atenção | `--coral` | `#FF796D` |
| Diversidade pontual | `--sky` | `#94D9F5` |
| Superfícies | `--surface` | `#FFFFFF` |
| Bordas | `--border` | `rgba(23,33,27,0.10)` |

Os tokens semânticos (`--primary`, `--background`, `--card`, `--strong`, `--success`…) derivam desses e são o que os componentes consomem. Aliases antigos (`--brand-700`, `--brand-100`, `--heart`, `--canvas`) continuam existindo apontando para os novos, para não quebrar telas legadas.

### Roxo em texto x roxo em superfície

`--primary` (`#6757E8`) é usado como **preenchimento** (CTA, barras, chips selecionados) com texto branco por cima — 5,1:1. Como **texto** sobre cream, branco ou roxo claro ele fica abaixo de 4,5:1, então existe `--primary-strong` (`#5344CE`), exposto como `text-primary-strong`. Toda cor de texto roxa no código usa esse token. Não volte a usar `text-primary`.

## Universo visual

- `components/pethcoach/doodles.tsx`: biblioteca autoral (`paw`, `bone`, `ball`, `heart`, `spark`, `treat`, `collar`, `star`, `wave`, `scribble`). Grade 32×32, contorno `--ink` de 1.8, preenchimento chapado por `tone`, decorativos e ocultos para leitores de tela. O contorno pode ser trocado (`stroke="var(--cream)"`) para uso sobre superfície ink.
- `components/pethcoach/playground.tsx`: `Sticker`, `Achievement`, `FloatingCard`, `SectionHeader`, `MetricCard`, `FeatureCard`, `PetAvatar`, `ProgressBar`, `PetCard`, `Testimonial` e `SuccessState`.
- `components/pethcoach/peth-mascot.tsx`: o Peth, com oito expressões. Redesenhado em 05/09/2026 com as mesmas regras dos traços — cor chapada, contorno `--ink` de 3 na grade de 120, sem gradiente e sem sombra. A silhueta é a assinatura: cabeça grande, **uma orelha em pé e outra caída**, mancha em volta de um olho, nariz em coração e coleira roxa com plaquinha lime (o mesmo par do traço `collar`). Aparece no hero, no rodapé, no painel de compromisso, na área de acesso, na barra lateral do app, no painel do plano e nos estados vazios. As expressões estão todas no UI kit.
- `/dev/ui-kit` mostra todo o inventário em "Pet Playground".

`Testimonial` existe mas não é usado na landing: o `AGENTS.md` proíbe depoimento fabricado e ainda não há depoimento real publicado. A gamificação implementada é afirmativa (`Achievement`, `ProgressBar`); não há mecânica de sequência/streak, também por regra do `AGENTS.md`.

## Bibliotecas e uso concreto

| Recurso | Implementação |
|---|---|
| Tailwind CSS | Layout responsivo e tokens semânticos |
| Sora e Manrope (`@fontsource-variable`) | Títulos e corpo, servidos localmente |
| Radix UI, composição no padrão shadcn | Tabs, Accordion, Dialog, Sheet e Drawer; teclado, foco e estados acessíveis |
| Lucide | Ícones consistentes; decorativos ocultos de tecnologias assistivas |
| Motion | Transição curta entre etapas da prévia, sem movimentos contínuos |
| Sonner | Toast no kit de desenvolvimento, com exemplo local funcional |
| React Hook Form + Zod | Validação do formulário de demonstração já existente |

Os componentes ficam no repositório, em `components/ui/`, e podem ser adaptados sem trocar a arquitetura. Motion respeita `prefers-reduced-motion`; as animações CSS também são desativadas nessa preferência. A página continua majoritariamente renderizada no servidor, com componentes de cliente limitados às interações.

## Manter as cores

Edite `:root` em `app/globals.css` somente quando houver uma nova decisão de identidade, e atualize o `DESIGN.md` junto. As telas consomem tokens semânticos; sombras e superfícies de estado derivam deles, sem uma segunda paleta fixa nos componentes. O UI kit mostra os nomes das variáveis.

Mantenha os pares de contraste: `primary` / `primary-foreground`, `primary-strong` sobre `secondary`, `strong` / `strong-foreground`, `background` / `foreground` e `card` / `muted-foreground`. Reexecute axe e a inspeção visual após trocar a paleta; a acessibilidade verificada hoje não garante contraste de cores futuras. A troca de identidade de 05/09/2026 quebrou 29 verificações de contraste antes de `--primary-strong` existir — o roxo claro sobre superfície roxa clara é a armadilha recorrente.

## Manter a logo

1. O arquivo aprovado está preservado em `public/brand/pethcoach-logo.png`.
2. `lib/brand.ts` registra dimensões intrínsecas e o recorte visual não destrutivo do raster original.
3. O componente compartilhado `Brand` usa `next/image` e atualiza cabeçalho, rodapé, menu e área de acesso.
4. `app/icon.svg` usa a paleta oficial (fundo roxo, patinha cream, almofada lime). Um master vetorial ou PNG transparente da marca deve substituir o raster atual quando for fornecido, sem redesenho automático.

## Verificação e limites

`tests/e2e/design-system.spec.ts` cobre abas por teclado, mudança e reset de etapas, movimento reduzido, menu mobile, restauração de foco, navegação, FAQ e toast. A suíte da fundação mantém verificação de overflow em 360px, axe e proteção de rotas. O kit `/dev/ui-kit` continua indisponível em produção.

A revisão visual confere desktop, 360px, abertura dos painéis e todos os layouts da P1. O teste de fundação também valida o carregamento da logo e os cinco tokens crus centrais (`--ink`, `--cream`, `--purple`, `--coral`, `--lime`). Fluxos completos de quiz, plano, billing e operação administrativa continuam no roadmap.

## Prioridade e navegação na área logada

Revisão de usabilidade de 05/09/2026, mobile primeiro:

- **Barra inferior fixa** (`components/layouts/workspace-tabbar.tsx`): Hoje, Meus cães, Histórico e Menu ficam ao alcance do polegar em telas menores que `lg`. O quarto slot é o gatilho do mesmo `Sheet` de antes — o menu não sumiu, mudou de lugar. No desktop a barra lateral continua sendo a navegação; a barra inferior não aparece. A área administrativa mantém o botão de menu no cabeçalho.
- **A ação principal abre a tela.** Em `/app`, o cartão "Treino de hoje" (mascote, dia, duração, barra de progresso e um botão de largura total) é o primeiro bloco, seguido de três atalhos grandes. O cabeçalho de boas-vindas foi reduzido a duas linhas para que tudo caiba na primeira tela de um celular.
- **`/app/caes/[dogId]` abre no treino.** O `PlanView` (ou o convite para gerar o plano) vem primeiro; o formulário de perfil desceu para um `Disclosure` recolhido no fim da página, aberto automaticamente logo após a criação do cão. Antes era preciso rolar o formulário inteiro para chegar ao exercício do dia.
- **Lista de cães compacta**: linhas com `PetAvatar`, nome e detalhes em uma linha, com o tom alternando por posição. O cartão alto anterior mostrava dois cães por tela; a linha mostra seis.
- O `main` reserva `pb-28` no celular para que a barra inferior nunca cubra conteúdo.

## Layouts e componentes da P1

- `components/layouts/auth-shell.tsx`: acesso com cabeçalho reduzido, coluna de contexto no desktop e conteúdo focado no celular.
- `components/layouts/workspace-shell.tsx`: área pessoal e administração com barra lateral no desktop e Sheet no celular. As rotas reais continuam verificando sessão/permissão antes de renderizar.
- `PageContainer`: largura máxima de 1200 px para conteúdo geral e 720 px para fluxos. `PageHeading` usa escala de 24–32 px no app.
- `ChoiceCard`: rádio nativo reutilizável; `Field`: label/ajuda/erro; `Feedback`: estados sem depender apenas de cor; `Button`: loading, disabled e tipo nativo seguro por padrão.
- `/dev/layouts/auth`, `/dev/layouts/app`, `/dev/layouts/flow` e `/dev/layouts/admin`: prévias isoladas, sem dados de usuários. Todos os atalhos aparecem no início do UI kit. Essas rotas retornam 404 fora de development.

Tokens de forma (`--shape-sm`, `--shape-control`, `--shape-card`, `--shape-panel`, `--shape-organic`, `--shape-pill`), largura (`--layout-dashboard`, `--layout-flow`) e duração (`--motion-fast`, `--motion-normal`, `--motion-slow`, com `--motion-ease`) também ficam em `app/globals.css`. Os contratos de uso e a matriz completa estão em `docs/p1-acceptance.md`.

Referências oficiais consultadas: [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs), [Radix Accordion](https://www.radix-ui.com/primitives/docs/components/accordion), [Motion](https://motion.dev/docs/react-animation), [Sonner](https://sonner.emilkowal.ski/).
