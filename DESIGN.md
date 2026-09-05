# DESIGN.md — Pet Product Design System

## 1. Visão do design

O produto deve transmitir imediatamente:

- diversão;
- carinho;
- confiança;
- tecnologia;
- simplicidade;
- personalidade;
- sensação de produto premium;
- proximidade com animais e seus tutores.

O site NÃO deve parecer:

- template de SaaS;
- landing page genérica;
- site criado automaticamente por IA;
- dashboard corporativo frio;
- startup genérica de tecnologia;
- conjunto de cards iguais;
- interface excessivamente minimalista e sem personalidade.

A experiência deve parecer uma mistura entre:

- aplicativo moderno de consumo;
- marca pet premium;
- produto gamificado;
- experiência editorial;
- universo visual próprio.

A interface deve ter identidade suficiente para que uma screenshot seja reconhecível mesmo sem mostrar o logotipo.

## 2. Conceito visual

**"Pet Playground"**

Criar um universo visual divertido e vivo em torno dos pets. O site deve passar a sensação de que o usuário entrou em um pequeno universo digital criado especialmente para ele e seu animal.

Usar:

- mascote;
- ilustrações autorais;
- objetos flutuantes;
- brinquedos;
- patinhas;
- ossinhos;
- bolinhas;
- coleiras;
- petiscos;
- estrelas;
- pequenas formas orgânicas;
- stickers;
- badges;
- elementos que reajam ao mouse;
- microanimações.

Esses elementos devem ser utilizados com moderação e intenção. Não transformar a interface em algo infantil.

A personalidade deve ser: **playful + premium + friendly + modern**.

## 3. Regra principal

Antes de criar qualquer componente, perguntar:

> "Isso poderia existir exatamente igual em um SaaS de contabilidade?"

Se a resposta for SIM, redesenhar.

Todo componente importante deve receber algum detalhe pertencente ao universo visual da marca.

## 4. Anti-AI Design Rules

Evitar explicitamente os padrões abaixo.

**NÃO usar**

- gradiente azul/roxo genérico;
- glow neon aleatório;
- glassmorphism em todos os cards;
- todos os cards com `border-radius: 24px`;
- 3 cards idênticos lado a lado;
- seção após seção com título, subtítulo e três cards;
- ícone Lucide dentro de quadrado arredondado para tudo;
- excesso de centralização;
- excesso de textos;
- fundos totalmente brancos;
- sombras genéricas;
- componentes perfeitamente simétricos;
- elementos decorativos sem função;
- ilustrações corporativas genéricas;
- fotos stock claramente artificiais;
- emojis como substitutos de identidade visual.

Evitar também:

```text
Hero
↓
3 benefícios
↓
6 cards
↓
depoimentos
↓
preço
↓
FAQ
```

como estrutura visual repetitiva. A informação pode continuar existindo, mas sua apresentação deve ganhar composição própria.

## 5. Personalidade visual

Características: divertido, curioso, seguro, amigável, expressivo, humano, tecnológico, levemente irreverente.

Não infantilizar a marca. Pensar:

> "Uma marca que pets usariam se soubessem usar aplicativos."

## 6. Paleta

A interface deve trabalhar principalmente com uma base clara e quente.

| Função | Nome | Cor | Uso |
|---|---|---|---|
| Background principal | Warm Cream | `#FFFDF7` | Evitar branco puro em grandes áreas |
| Ink | Ink | `#17211B` | Cor principal para textos; substitui o preto absoluto |
| Primary | Purple Blue | `#6757E8` | CTA principal, ações selecionadas, elementos importantes, detalhes de marca |
| Mint | Mint | `#9BE8C0` | Saúde, cuidado, sucesso, leveza |
| Lime | Lime | `#DDF56D` | Elemento energético: badges, destaques, indicadores, detalhes do mascote |
| Coral | Coral | `#FF796D` | Carinho, atenção, elementos emocionais, pequenos destaques |
| Sky | Sky | `#94D9F5` | Pontual, para diversidade visual |
| Surface | Surface | `#FFFFFF` | Cards e superfícies |
| Border | Border | `rgba(23, 33, 27, 0.10)` | Borders devem ser sutis |

Não transformar toda a interface em roxo.

## 7. Distribuição das cores

Regra aproximada:

- 60% — Warm Cream / tons neutros
- 20% — Ink + superfícies
- 10% — Primary
- 10% — Mint / Lime / Coral / Sky

As cores secundárias devem criar momentos de surpresa. Não pintar todos os componentes.

## 8. Tipografia

A tipografia é parte central da identidade.

**Display / Headlines** — fonte arredondada e expressiva. Sugestões: Sora, Manrope, Plus Jakarta Sans, Nunito Sans (elementos mais lúdicos), Geist (alternativa mais tecnológica). Preferência: **Sora**.

Headlines devem ter peso 600–750, tracking levemente negativo e line-height compacto.

```css
font-size: clamp(3rem, 7vw, 6.5rem);
line-height: 0.98;
letter-spacing: -0.05em;
font-weight: 700;
```

**Body** — preferência: **Manrope** ou **Inter**. Usar alta legibilidade.

## 9. Headlines

Evitar títulos excessivamente corporativos.

Ruim:

> Uma solução completa para cuidar do seu pet.

Melhor:

> Tudo que seu pet precisa.
> Sem complicar sua vida.

É permitido destacar apenas algumas palavras visualmente:

```text
Seu pet merece
um cuidado [mais inteligente].
```

A palavra destacada pode mudar de cor, receber underline desenhado, ter um sticker, receber pequena ilustração ou inclinar levemente.

## 10. Layout

Evitar uma página perfeitamente simétrica. Usar:

- assimetria controlada;
- sobreposição;
- cards de tamanhos diferentes;
- imagens parcialmente fora do container;
- objetos invadindo outras seções;
- composições editoriais;
- whitespace generoso;
- seções com ritmos diferentes.

Container:

```css
max-width: 1280px;
padding-inline: clamp(20px, 5vw, 72px);
```

## 11. Grid

Grid de 12 colunas no desktop, mas sem que todos os componentes obedeçam visualmente ao mesmo tamanho.

Permitir cards 7/5, 8/4, 5/7, blocos 2x2, elementos que ocupam duas linhas, cards grandes misturados com cards pequenos.

Inspiração conceitual: bento irregular, não "Bento AI".

## 12. Bordas

Não utilizar o mesmo radius em tudo.

```text
small: 10px
medium: 16px
large: 24px
xl: 32px
organic: 40px 24px 36px 20px
pill: 999px
```

Algumas imagens podem utilizar formatos mais orgânicos.

## 13. Sombras

Sombras discretas e físicas.

Evitar:

```css
box-shadow: 0 20px 60px rgba(80, 60, 200, .25);
```

Preferir:

```css
box-shadow:
  0 1px 2px rgba(0,0,0,.04),
  0 8px 24px rgba(0,0,0,.06);
```

Cards importantes podem utilizar shadow mais pronunciada durante hover.

## 14. Hero

O Hero deve ser uma das áreas mais memoráveis.

Desktop:

```text
------------------------------------------------
NAV
------------------------------------------------

Headline                  PET / MASCOTE
Headline                  + elementos flutuantes
descrição                 + mini UI
CTA
social proof
------------------------------------------------
```

Não colocar tudo centralizado.

**Lado esquerdo:** eyebrow, headline grande, descrição curta, CTA, CTA secundário opcional, prova social.

**Lado direito:** composição visual. Pode conter mascote, foto recortada de um pet, card de perfil, indicador de saúde, coração, badge, brinquedo, sticker, pequenas partículas. Os objetos podem utilizar movimento suave.

## 15. Mascote

O mascote deve funcionar como parte da experiência, não apenas como logo.

Pode aparecer olhando para um botão, segurando uma placa, reagindo ao sucesso, atrás de um card, apontando para informações, comemorando, dormindo em estados vazios, acompanhando onboarding, surgindo no footer.

Expressões sugeridas: normal, feliz, curioso, preocupado, celebrando, dormindo.

## 16. Fotografias

Priorizar fotografias reais: pets olhando para câmera, enquadramentos próximos, personalidade, iluminação natural, cenários reais.

Evitar: cães excessivamente perfeitos, hospital genérico, pessoa segurando tablet, stock corporativo, imagens claramente geradas por IA.

É permitido remover o fundo de algumas fotos para integrá-las à composição.

## 17. Cards

Cards devem contar histórias. Cada seção pode utilizar um estilo diferente de card dentro do mesmo sistema visual.

**Profile Card**

```text
Pet: Milo 🐶
2 anos

Vacinas
██████████ 100%

Último cuidado
Hoje
```

**Daily Pet Streak**

```text
🔥 12 dias
Você está cuidando muito bem do Milo.
```

**Health Status**

```text
Tudo certo por aqui.
● Pet saudável
```

Evitar seis cards completamente iguais.

## 18. Botões

**Primary:** fundo `Primary`, texto branco, altura 52–56px, radius 16–18px, peso 600.

Hover:

```text
translateY(-2px)
scale(1.01)
```

Adicionar mudança suave de shadow.

**Secondary:** fundo transparente, borda discreta, ou link textual com seta animada.

## 19. Microinterações

Microinterações são obrigatórias. Aplicar somente quando melhorarem a percepção do produto.

- **Cards** — hover: `translateY(-4px)`, `rotate ±0.3deg`.
- **Buttons** — seta `→` move aproximadamente 4px para a direita.
- **Mascote** — movimento vertical discreto: `0 → -5px → 0`, em 6–8 segundos.
- **Stickers** — pequena rotação no hover.
- **Numbers** — valores importantes podem utilizar count-up.

## 20. Scroll

Elementos podem surgir utilizando opacity, translateY, blur muito leve e stagger. Duração: 300–600ms.

Não animar todas as coisas. Nunca prejudicar leitura.

## 21. Navegação

Navbar simples. Logo à esquerda, links centrais, CTA à direita.

```text
LOGO      Como funciona   Recursos   Benefícios      Começar
```

A navbar pode ficar em uma cápsula discreta após o scroll. Usar `backdrop-filter: blur(12px);` apenas nesse contexto.

## 22. Seções

Cada seção precisa possuir personalidade visual própria. Alternar: cream, white, mint muito suave, ink, ilustração, fotografia. Isso cria ritmo.

## 23. Feature section

Evitar:

```text
[card] [card] [card]
[card] [card] [card]
```

Preferir:

```text
---------------------------------
|                       |       |
| BIG FEATURE           | SMALL |
|                       |-------|
|                       | SMALL |
---------------------------------
```

ou:

```text
BIG PHOTO     FEATURE

FEATURE       BIG VISUAL
```

## 24. Storytelling

As funcionalidades devem aparecer dentro de situações reais.

Em vez de "Monitoramento — Monitore as informações do seu pet", mostrar:

```text
Luna
Golden Retriever

Hoje

✓ Água
✓ Alimentação
✓ Passeio
✓ Medicação

4/4 tarefas concluídas
```

Isso torna o benefício concreto.

## 25. Prova social

Evitar depoimentos perfeitamente formatados. Mostrar algo mais humano.

```text
★★★★★

"Finalmente consegui organizar tudo da Amora em um lugar só."

Mariana
Tutora da Amora 🐾
```

Adicionar avatar + pequena foto do pet.

## 26. Gamificação

O design pode incorporar elementos leves de gamificação.

- **Streak** — 🔥 7 dias cuidando juntos
- **Progress** — Perfil do pet ████████░░ 80%
- **Achievement** — 🏅 Rotina em dia
- **Celebration** — "Seu pet está com tudo em dia!" com o mascote comemorando.

A gamificação NÃO deve transformar a experiência em um jogo infantil.

## 27. Empty states

Nunca mostrar apenas "Nenhum dado encontrado."

```text
         🐶

Parece que ainda não temos nada aqui.

Comece adicionando seu primeiro cuidado.

[Adicionar cuidado]
```

Idealmente usando o mascote real da marca.

## 28. Feedback de sucesso

Depois de ações importantes:

```text
✓ Tudo certo!

Informação salva.
```

Pode acompanhar pequena animação, reação do mascote ou confete extremamente discreto.

## 29. Mobile

O mobile NÃO deve parecer apenas o desktop espremido.

No mobile: títulos continuam expressivos; navegação simplificada; cards empilhados; elementos decorativos reduzidos; CTA principal facilmente acessível; componentes importantes próximos ao polegar.

Hero mobile:

```text
headline
copy
CTA

pet visual
floating card
```

## 30. Motion System

Usar preferencialmente CSS transitions; Motion / Framer Motion quando necessário.

```text
fast: 150ms
normal: 250ms
slow: 450ms
```

Easing:

```css
cubic-bezier(.22, 1, .36, 1)
```

## 31. Ícones

Utilizar Lucide apenas para ícones funcionais. Não usar Lucide como principal personalidade visual.

Complementar com ilustrações próprias, stickers, desenhos lineares, mascote e elementos pet.

## 32. Ilustrações

Ilustrações devem compartilhar mesma espessura de linha, mesma paleta, mesma estética e mesma personalidade.

Visual sugerido: shapes macios, outline escuro, cores chapadas, detalhes ligeiramente imperfeitos.

Objetivo: parecer desenhado por uma equipe de marca, não gerado aleatoriamente.

## 33. Elementos decorativos

Criar uma biblioteca própria:

```text
paw.svg
bone.svg
ball.svg
heart.svg
spark.svg
treat.svg
collar.svg
star.svg
wave.svg
scribble.svg
```

Esses elementos poderão ser reutilizados pela interface inteira.

## 34. Cursor e interação

Desktop pode possuir pequenas interações especiais: uma patinha aparecer discretamente ao interagir com determinada área; elementos decorativos seguirem alguns pixels do cursor.

Não utilizar cursor customizado que prejudique usabilidade.

## 35. Footer

Footer pode possuir maior personalidade. Sugestão: background Ink, com mascote, logo, links, CTA e frase de marca.

```text
     🐶

Até a próxima aventura.

[LOGO]

Produto
Empresa
Ajuda
Social
```

Um mascote pode aparecer apoiado na borda superior do footer.

## 36. Acessibilidade

Obrigatório:

- contraste WCAG AA;
- estados de foco claros;
- navegação por teclado;
- `prefers-reduced-motion`;
- textos legíveis;
- alt text;
- tamanho mínimo recomendado de 16px no body.

Nunca sacrificar usabilidade para criar uma interface "bonita".

## 37. Performance

Não utilizar dezenas de bibliotecas apenas para estética.

Preferir CSS, SVG, WebP, AVIF, lazy loading e animações GPU-friendly. Evitar animações pesadas em scroll.

## 38. Design Tokens

```css
--background: #FFFDF7;

--foreground: #17211B;

--primary: #6757E8;

--mint: #9BE8C0;
--lime: #DDF56D;
--coral: #FF796D;
--sky: #94D9F5;

--surface: #FFFFFF;

--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;

--shadow-sm:
  0 1px 2px rgba(0,0,0,.04);

--shadow-md:
  0 8px 24px rgba(0,0,0,.06);
```

## 39. Componentes essenciais

Criar componentes reutilizáveis para: Button, Badge, Sticker, PetAvatar, PetCard, FeatureCard, MetricCard, ProgressBar, Achievement, Testimonial, FloatingCard, SectionHeader, Navbar, Footer, Mascot, EmptyState, SuccessState.

Não criar componentes genéricos quando um componente semanticamente específico melhorar a experiência.

## 40. Regra de composição

Cada viewport deve conter pelo menos um elemento de surpresa visual: pet parcialmente fora de um container, sticker inclinado, texto desenhado, card sobreposto, mascote espiando, elemento que reage ao mouse, fotografia recortada.

Mas nunca colocar vários desses elementos competindo simultaneamente.

## 41. Resultado desejado

Quando alguém abrir o produto deve pensar:

> "Isso é uma marca de verdade."

E não:

> "Isso parece uma landing page feita por IA."

O produto deve ter personalidade suficiente para ser reconhecido visualmente sem precisar mostrar seu nome.

## 42. Filosofia final

Menos template. Mais composição.

Menos cards. Mais storytelling.

Menos ícones genéricos. Mais identidade.

Menos efeitos. Mais intenção.

Menos "SaaS". Mais produto.

Menos IA aparente. Mais marca.
