# Catálogo comportamental — base das recomendações

Registro do que fundamenta cada programa. Serve para o revisor profissional saber de onde veio cada exercício, e para que ninguém precise reconstruir esse raciocínio depois.

**Isto não é revisão profissional.** É o levantamento que a antecede. O campo `reviewed_by` dos módulos continua nulo, e nulo significa exatamente isso.

## Os sete programas

| Programa | Entrada | Exercícios |
|---|---|---|
| `cachorro-puxa-guia` | guia esticada no passeio | 4 |
| `filhote-mordendo` | mordida de brincadeira em filhote | 4 |
| `xixi-lugar-errado` | eliminação fora do lugar | 4 |
| `cachorro-late-muito` | latido na porta e campainha | 4 |
| `cachorro-pula-nas-pessoas` | pular em quem chega | 4 |
| `cachorro-nao-vem-quando-chamado` | chamado que falhou | 4 |
| `cachorro-nao-fica-sozinho` | ficar sozinho — prevenção e casos leves | 4 |

## O que sustenta os quatro novos

**Latido na porta.** O protocolo de "lugar de espera" — ensinar o cão a ir para um tapete e permanecer enquanto a porta é acionada — foi testado com reforço positivo em cães de família, com resultado medido: o latido caiu de 19,3 para 2,1 por minuto e os pulos na porta chegaram a zero. Os exercícios reproduzem a progressão do protocolo: primeiro o valor do lugar, depois som fraco, depois campainha em volume crescente, por fim alguém entrando de verdade.

**Pular nas pessoas.** A análise funcional desse comportamento em cães de companhia mostra que ele é mantido pelas consequências dadas por quem chega — inclusive empurrar e falar alto, que para o cão continuam sendo atenção. A intervenção que funcionou troca a consequência, entregando reforço na ausência do pulo, em vez de punir o pulo. Daí a regra de entregar o petisco **no chão**, e de a pessoa parar e silenciar quando o cão sobe.

**Chamado.** Reconstruído por valor em distância curta, com guia longa obrigatória enquanto não for confiável. A escolha por reforço em vez de coleira eletrônica segue os estudos comparativos, que não encontram vantagem de eficácia no equipamento aversivo e registram prejuízo de bem-estar.

**Ficar sozinho.** Este é o programa com maior distância entre demanda e o que é responsável entregar. Ansiedade de separação é **diagnóstico veterinário**: só médico-veterinário diagnostica, o tratamento leva tipicamente de 8 a 16 semanas e frequentemente envolve medicação junto de modificação de comportamento. Um programa de 14 dias não trata isso, e dizer o contrário seria mentira com consequência.

O que o programa faz é o que cabe: prevenção e desconforto leve, com dessensibilização por ausências curtas mantidas abaixo do limiar em que o cão se incomoda — abordagem com suporte na literatura, inclusive quando aplicada de forma imperfeita pelo tutor.

O que o programa **não** faz é seguir adiante diante de sinal clínico. O quiz marca com tags de segurança: destruição em portas e janelas, eliminação apenas na ausência, vocalização por horas e salivação intensa entram como `severe_distress` e encaminham; automutilação entra como `self_injury` e bloqueia; tentativa de fuga entra como `escape_risk` e bloqueia. `tests/integration/p16-novos-programas.test.ts` falha se qualquer uma dessas tags sair do lugar.

## Regra que vale para todos

Nenhum exercício usa tranco, enforcador, choque, correção física ou intimidação. Isso não é preferência estética: é o que a literatura de bem-estar animal sustenta, e é o que separa este produto da parte do mercado que ainda vende o contrário.

## Fontes

- Protocolo de reforço positivo para comportamentos na porta, com medição de latidos e pulos: [Applied Animal Behaviour Science](https://www.sciencedirect.com/science/article/abs/pii/S0168159107003607)
- Análise funcional e tratamento do pular em cães de companhia: [Animals, PMC6940775](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6940775/)
- Impacto de métodos aversivos no bem-estar: [PLOS ONE, PMC7743949](https://pmc.ncbi.nlm.nih.gov/articles/PMC7743949/)
- Coleira eletrônica versus reforço positivo em eficácia e bem-estar: [Frontiers in Veterinary Science, PMC7387681](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7387681/)
- Dessensibilização sistemática em comportamento relacionado à separação: [Applied Animal Behaviour Science](https://www.sciencedirect.com/science/article/abs/pii/S0168159110002923)
- Abordagem clínica da ansiedade de separação, com prazo de tratamento e papel do veterinário: [Today's Veterinary Practice](https://todaysveterinarypractice.com/behavior/algorithmic-approach-separation-anxiety-in-dogs/)
