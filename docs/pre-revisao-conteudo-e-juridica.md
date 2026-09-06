# Pré-revisão: conteúdo comportamental e jurídico

**O que este documento é.** Uma análise técnica de lacunas, feita em 05/09/2026 comparando o que o produto realmente faz com as diretrizes publicadas e a legislação brasileira. Serve para o profissional e o advogado chegarem com o trabalho meio caminho andado — e para você saber o tamanho do que falta.

**O que este documento não é.** Não é a revisão exigida pelo `AGENTS.md` nem pelo checklist de release. Aquela revisão precisa de assinatura profissional: um médico-veterinário ou adestrador responde com registro próprio, um advogado responde com OAB, e é essa responsabilidade que vale perante o CRMV, o Procon, a ANPD ou um juiz. Nenhuma análise minha substitui isso.

Some-se a isso um problema de independência: boa parte do conteúdo e das decisões analisadas aqui passou por mim. Quem revisa não pode ser quem escreveu.

---

## Estado em 05/09/2026 — o que saiu do papel desde a análise

A análise abaixo permanece como foi escrita, porque é o registro do que foi encontrado. Este bloco diz o que mudou depois dela.

**Resolvido no código:**

- **Revisor fictício.** A migração `20260912000000_p15_revisor_real_do_catalogo.sql` zerou `reviewed_by` e `reviewed_at` dos 12 módulos. O banco não afirma mais uma revisão que não houve. O `status` continua `published`: mudar para `draft` deixaria a geração de plano indisponível, e essa é decisão de produto.
- **Política de privacidade e termos de uso.** Existem, com conteúdo real, em `app/(marketing)/privacidade` e `app/(marketing)/termos`. Os dados factuais vêm de `content/legal.ts`, fonte única para páginas e rodapé.
- **Controlador identificado.** Razão social, CNPJ, natureza jurídica e endereço nas duas páginas e no rodapé de todas as páginas públicas.
- **Encarregado indicado**, com nome e canal, como pede o art. 41.
- **Direito de arrependimento escrito.** Sete dias corridos, sem justificativa, pelo canal de suporte — seção 5 dos termos.
- **Transferência internacional declarada**, com a lista de operadores e a localização de cada um, citando o art. 33.
- **Prazos de retenção publicados**, incluindo os 7 dias do quiz anônimo e a preservação fiscal do art. 16, II.
- **Idade mínima** de 18 anos nos termos e política dizendo que o serviço não se destina a menores.
- **Limite de escopo** como seção 1 dos termos, a primeira coisa que o leitor encontra.
- **Teste de regressão.** `tests/e2e/legal.spec.ts` trava a presença desses elementos, para que uma edição futura não devolva as páginas ao estado de aviso genérico sem ninguém notar.

**Decisão do controlador, 05/09/2026 — as revisões profissionais não vão acontecer antes do lançamento.**

Felipe Cordeiro de Paula, responsável pela empresa, leu e aprovou tanto os documentos jurídicos quanto o conteúdo comportamental e a copy de segurança. Não houve revisão por advogado, por médico-veterinário nem por adestrador com credencial.

O que isso muda no registro:

- `reviewed_by` dos 12 módulos **permanece nulo**. A coluna registra profissional com nome e registro; aprovação do controlador não é isso, e gravá-la ali recriaria exatamente o defeito que a migração `20260912000000` removeu.
- Os itens correspondentes do `docs/release-checklist.md` **seguem desmarcados**, com a decisão anotada. Eles exigem revisão profissional, que não ocorreu.
- O que existe é **risco assumido pelo controlador**, e é assim que está escrito.

O que isso não muda: a aprovação do próprio responsável não transfere responsabilidade técnica. Perante a ANPD, o Procon, o CRMV ou um juiz, o que vale é quem assina com registro profissional. Enquanto não houver essa assinatura, quem responde é o controlador.

**Continua em aberto, independentemente da decisão acima:**

- Operação real do reembolso: o direito está escrito, o processo precisa ser executado quando alguém pedir
- Os achados 2, 3 e 4 da Parte 1 (equipamento aversivo, filhote e vacinação, idade do cão), que são perguntas de produto ainda sem resposta

**Pendências de cadastro:** o endereço do controlador foi confirmado como o do registro da Receita. Seguem em aberto, por decisão de adiar: o CNAE, que precisa contemplar serviço digital antes da primeira nota fiscal, e a migração de MEI para LTDA antes do teto de faturamento. Detalhe em `docs/proximos-passos.md`, seção 6.

---

---

# Parte 1 — Conteúdo comportamental

## O que está alinhado com as diretrizes

Comparado à [posição da AVSAB sobre treino humanitário](https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf), o produto acerta o essencial:

- **Somente métodos baseados em recompensa.** A AVSAB recomenda exclusivamente reforço positivo e punição negativa, e desaconselha métodos aversivos em qualquer contexto, por dano ao bem-estar e ao vínculo. O catálogo segue isso: nenhum módulo ensina tranco, enforcador, choque ou correção física.
- **Instrução explícita contra puxões.** O módulo de guia frouxa diz "pare suavemente sem dar trancos" e "não dê puxões de volta" — trata o erro comum diretamente.
- **Critérios de parada por módulo.** Cada exercício tem `stop_conditions` acionáveis, como interromper diante de agitação intensa ou frustração.
- **Contraindicações por módulo**, ligadas às mesmas tags do gate de segurança.
- **Encaminhamento antes de treino** nos sinais que exigem: mordida com perfuração, risco a vulneráveis, suspeita de dor, mudança súbita com sinais físicos, sofrimento intenso.
- **Gate determinístico, sem IA.** As red flags não dependem de modelo de linguagem, e `BLOCK` prevalece sobre `REFER`, que prevalece sobre `CONTINUE`.

## Achados

### 1. CRÍTICO — o banco afirma uma revisão que não existiu

A migração `20260903000000_p7_catalog_and_plans.sql` publica os 12 módulos com:

```sql
version, status, reviewed_by, reviewed_at
1, 'published', 'educador-supervisor', now()
```

`educador-supervisor` não é uma pessoa. Não há registro profissional, nome ou data real por trás disso. O sistema tem uma trilha de auditoria que **afirma uma revisão que não aconteceu**.

Isso contradiz o próprio `docs/safety.md`, que determina "não publicar seeds automaticamente" e "fluxo draft → reviewed → published com revisor e timestamp". A migração publica automaticamente, com revisor fictício.

Também contraria o `AGENTS.md`, que proíbe conteúdo fabricado.

**O que fazer.** Uma de duas: mudar o `status` dos 12 módulos para `draft` até que alguém real revise — e nesse caso a geração de plano fica indisponível, porque o fallback exige catálogo aprovado; ou manter publicado apenas se um profissional revisar agora e o campo passar a registrar o nome e o registro dele.

A primeira opção é a honesta enquanto não houver revisor. A segunda é a que destrava o produto.

**Situação (05/09/2026):** resolvido pela metade. A migração `20260912000000_p15_revisor_real_do_catalogo.sql` anulou os campos, e o comentário da coluna passou a dizer que nulo significa ausência de revisão profissional. O catálogo segue publicado sem revisor real — visível agora, em vez de mascarado.

### 2. Equipamento aversivo gera aviso, não encaminhamento

Quando o tutor declara usar "trancos, sustos, dor, enforcador, choque ou correção física", o gate registra `AVERSIVE_METHOD_REPORTED` com severidade `caution` e desfecho **`continue`** — segue para o plano, com mensagem redirecionando para métodos baseados em recompensa.

É uma decisão defensável e provavelmente correta: a AVSAB quer justamente que essas pessoas migrem para reforço positivo, e barrá-las as devolveria ao método aversivo sem alternativa. Mas é uma **decisão de risco que precisa de aval profissional**, porque envolve seguir orientando alguém que hoje usa ferramenta com dano documentado.

Ponto a favor da implementação: se houver sinal de agressão junto, `BLOCK` prevalece pela regra de prioridade.

**Pergunta para o profissional:** a mensagem atual é suficiente para provocar a mudança de método, ou o caso merece um passo dedicado antes de liberar exercícios?

### 3. Filhotes: janela de socialização versus vacinação

O problema `filhote-mordendo` atende filhotes, e o programa de guia envolve passeios. Existe uma tensão clássica e bem documentada entre a janela de socialização, que fecha cedo, e o calendário vacinal, que recomenda cautela com exposição externa.

O catálogo **não trata disso**. Não vi orientação sobre ambiente seguro para filhote não vacinado, nem pergunta sobre status vacinal.

**Para o profissional:** decidir se o produto deve perguntar sobre vacinação e adaptar recomendações, ou se deve encaminhar filhotes ao veterinário antes de exercícios externos.

### 4. Sem verificação de idade do cão para exercício físico

Não há pergunta sobre idade ou condição física antes de exercícios que envolvem caminhada. Filhotes em crescimento e cães idosos ou com problema articular têm limites diferentes.

A contraindicação `suspected_pain` existe, mas depende do tutor **perceber e relatar** dor — o que frequentemente não acontece.

### 5. A copy de segurança nunca foi validada

`features/safety/presentation.ts` traz as mensagens de encaminhamento, e o próprio `docs/safety.md` diz que elas estão "aprovadas apenas para validação técnica em ambiente fechado".

São as mensagens que aparecem no pior momento — quando há mordida, dor ou sofrimento. É o texto de maior consequência do produto inteiro e o que mais merece o tempo do revisor.

## O que levar ao profissional

Peça revisão específica de:

1. Os **12 módulos** (`setup_instructions`, `steps`, `success_criteria`, `stop_conditions`, `contraindications`), com nome e registro para gravar em `reviewed_by`
2. As **mensagens de encaminhamento** de `features/safety/presentation.ts`
3. A **tabela de red flags** de `docs/safety.md`: os sinais cobrem o necessário? Falta algum?
4. As decisões dos achados 2, 3 e 4

Um adestrador com formação em reforço positivo cobre 1 e 4. Os itens 2 e 3 tocam saúde e pedem médico-veterinário — de preferência com atuação em comportamento animal.

---

# Parte 2 — Jurídico

## O ponto de partida

> **Superado em 05/09/2026.** As duas páginas foram escritas e publicadas. O texto abaixo descreve o estado que motivou a análise.

**Não existia política de privacidade nem termos de uso.** As duas páginas são avisos de desenvolvimento que declaram isso:

> "A política completa, a identificação do controlador e o canal para solicitações serão publicados antes da abertura ao público. Este texto não é uma política final de privacidade."

Como o Stripe já está configurado e a compra funciona, o produto está tecnicamente apto a cobrar **sem ter documento jurídico nenhum**. É a lacuna de maior severidade do projeto hoje.

## Achados

### 1. CRÍTICO — falta a identificação do controlador

A [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) exige que o titular saiba quem trata seus dados. Hoje não há em lugar nenhum do produto: razão social, CNPJ, endereço ou contato do responsável.

Sem isso, o titular não tem a quem dirigir um pedido de acesso ou exclusão, e a ANPD não tem a quem responsabilizar.

**Só você tem esses dados.** Preciso deles para qualquer redação: a empresa existe formalmente? Qual CNPJ? Qual endereço consta no contrato social?

### 2. CRÍTICO — falta encarregado (DPO) e canal de solicitações

O art. 41 da LGPD exige a indicação de encarregado, com identidade e contato divulgados publicamente. Não existe.

Para operação pequena, o encarregado pode ser o próprio responsável pela empresa; o que a lei exige é que seja **identificado e alcançável**.

### 3. CRÍTICO — direito de arrependimento não implementado

O [art. 49 do CDC](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) dá ao consumidor **7 dias corridos** para desistir de compra feita fora do estabelecimento — o que inclui compra por site — com devolução integral do valor.

O produto tem checkout e portal de gestão, mas **nenhum fluxo de reembolso**. Cancelar no portal do Stripe encerra a renovação; não devolve o que foi pago. Para a compra avulsa do programa completo, que é pagamento único, não há caminho nenhum de devolução.

**O que falta:** decidir o processo (reembolso pelo Stripe, prazo de resposta, canal de pedido), escrever nos termos e implementar ou operar manualmente.

### 4. Transferência internacional de dados não declarada

O banco foi migrado para São Paulo, mas os demais fornecedores processam dados **fora do Brasil**: Vercel, Stripe, Resend, Sentry e PostHog.

O art. 33 da LGPD exige base legal para transferência internacional, e o titular precisa ser informado. Isso tem que constar da política.

### 5. Lista de operadores ausente

A política precisa dizer quem mais toca os dados. Levantei do código:

| Fornecedor | O que processa |
|---|---|
| Supabase | banco e autenticação (São Paulo) |
| Vercel | hospedagem e execução da aplicação |
| Stripe | pagamento e dados de cobrança |
| Resend | envio de e-mail |
| Sentry | relatórios de erro (com PII removida) |
| PostHog | métricas, apenas com consentimento |

### 6. A retenção já implementada precisa de base legal declarada

P14 implementou exclusão por anonimização preservando `billing_customers` e `entitlements`. A decisão foi sua e está correta em espírito, mas a política precisa **declarar isso e citar a base**: art. 16, II da LGPD permite conservação para cumprimento de obrigação legal ou regulatória.

Hoje o produto faz a coisa certa sem dizer que faz — e, para a lei, o que não está informado ao titular não conta.

### 7. Prazo de retenção não definido

A política precisa de prazos. O que o código já determina:

- Token anônimo do quiz: 7 dias
- Dados da conta: enquanto a conta existir
- Registros de cobrança: pendente de definição, tipicamente 5 anos por prazo fiscal — **confirme com o contador**

### 8. Dados do cão não são dado pessoal sensível

Uma boa notícia que simplifica: o art. 5º, II da LGPD define dado sensível como referente a saúde **da pessoa natural**. Informação de comportamento e saúde do cão não se enquadra.

Isso evita as exigências reforçadas do art. 11. Vale confirmar com o advogado, mas a leitura direta da lei sustenta.

### 9. Termos precisam carregar o limite de escopo

O disclaimer de que o produto não faz diagnóstico nem substitui veterinário aparece no FAQ e nas telas. **Precisa estar nos termos de uso**, que é o documento contratual, com linguagem de limitação de responsabilidade.

O [CFMV](https://crmvsp.gov.br/resolucao-publicada-hoje-detalha-e-especifica-as-atividades-privativas-de-medicos-veterinarios/) reserva a clínica veterinária a médicos-veterinários. Orientação comportamental baseada em recompensa não é ato privativo, mas a fronteira precisa estar escrita — e é justamente o que o gate de encaminhamento implementa na prática.

### 10. Idade mínima não verificada

Não há verificação de idade nem menção a menores. Os termos devem exigir 18 anos, e a política deve dizer que o serviço não se destina a crianças — o art. 14 da LGPD tem regime próprio para dados de criança e adolescente que é melhor evitar.

## O que levar ao advogado

Leve este documento e mais:

1. **Os dados que só você tem:** razão social, CNPJ, endereço, quem será o encarregado, canal de contato
2. **A lista de operadores** da tabela acima
3. **A decisão de retenção** de P14 e o prazo fiscal confirmado pelo contador
4. **Os preços e condições** que você cadastrou no Stripe
5. **O processo de arrependimento** que você pretende operar

Com isso, o advogado redige política e termos. O trabalho dele fica menor porque o levantamento factual — o que o sistema coleta, de quem, por quanto tempo, com quem compartilha — já está feito e é verificável no código.

---

## Resumo de severidade

| Achado | Severidade | Trava lançamento? | Situação em 05/09/2026 |
|---|---|---|---|
| Revisor fictício em `reviewed_by` | Crítico | Sim | Afirmação removida; `reviewed_by` segue nulo por decisão do controlador |
| Sem política de privacidade | Crítico | Sim | Publicada |
| Sem termos de uso | Crítico | Sim | Publicados |
| Sem controlador identificado | Crítico | Sim | Identificado nas páginas e no rodapé |
| Sem encarregado (DPO) | Crítico | Sim | Indicado, com canal |
| Sem direito de arrependimento | Crítico | Sim | Escrito; processo a operar |
| Copy de segurança não validada | Alto | Sim | Aprovada pelo controlador, sem revisão profissional |
| Transferência internacional não declarada | Alto | Sim | Declarada, com lista de operadores |
| Redação jurídica sem revisão de advogado | Alto | Sim | Aprovada pelo controlador, sem revisão de advogado |
| Filhote: vacinação e socialização | Médio | Avaliar | Aberto |
| Equipamento aversivo segue para plano | Médio | Avaliar | Aberto |
| Sem verificação de idade do cão | Médio | Não | Aberto |
| Sem idade mínima do usuário | Médio | Não | Exigida nos termos |

Nada aqui é surpresa em relação ao que o checklist já registrava. O que muda é que agora está específico o bastante para virar tarefa — e para um profissional cobrar por revisar em vez de por levantar.
