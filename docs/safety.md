# Segurança comportamental

Este documento registra requisitos do blueprint e a implementação P5, **não certifica revisão clínica**. Não há orientação de treino publicada nesta versão.

## Regras do produto

Treino baseado somente em recompensas. Sem diagnóstico, medicação, prognóstico, garantias de cura ou certeza clínica. Um aviso genérico nunca substitui os controles de produto. Revisão humana qualificada será necessária antes de publicar exercícios ou mensagens de encaminhamento.

## Pipeline P5-P7

Entradas validadas → normalização → **safety gate determinístico P5** → classificação de contexto → módulos publicados e elegíveis → restrições → planner estruturado → validação de schema/IDs/pré-requisitos/contraindicações → pós-checagem → persistência versionada e auditável. As etapas após o gate pertencem às fases seguintes.

| Sinal | Resultado previsto |
|---|---|
| Mudança súbita acompanhada de sinais físicos | REFER; avaliação veterinária antes de treino |
| Suspeita de dor | REFER; avaliação veterinária |
| Mordida com perfuração, ataque imprevisível ou risco a vulneráveis | BLOCK; interromper funil comercial e encaminhar |
| Sofrimento intenso, fuga ou autolesão ao ficar sozinho | BLOCK/REFER segundo regra revisada, sem diagnóstico |
| Uso de ferramentas/técnicas aversivas | Não ensinar uso; redirecionar para estratégia baseada em recompensas |
| Sem sinais definidos de risco | CONTINUE; não significa certificação de ausência de risco |

P5 usa a versão de regras `p5-v1`. A decisão ocorre dentro da mesma transação PostgreSQL que conclui o assessment. Os códigos ficam em `safety_events`, sem acesso direto de clientes, e o assessment recebe status/versão/data da avaliação. `BLOCK` sempre prevalece sobre `REFER`, que prevalece sobre `CONTINUE`. Sinal desconhecido em conteúdo publicado falha fechado como `REFER` para revisão manual. Não existe chamada de IA nesse caminho.

As mensagens de `features/safety/presentation.ts` são fixas, versionadas pelo contrato e aprovadas apenas para validação técnica em ambiente fechado. Revisão por profissional qualificado continua obrigatória antes de qualquer lançamento ao público.

Regras devem abranger tanto quiz quanto check-in. Não depender de LLM para detectar red flags. Segurança prevalece sobre progressão, preço e conversão. REFER/BLOCK substituem o paywall por encaminhamento.

## Catálogo

Módulos: setup, steps, success criteria, stop conditions, progression/regression rules, difficulty, tags, contraindications e version. Fluxo draft → reviewed → published com revisor e timestamp. Não publicar seeds automaticamente. Fallback também exige catálogo aprovado; catálogo vazio mantém geração indisponível.

## Casos de teste

P5 cobre red flags isoladas e combinadas, prioridade de BLOCK, idempotência, RLS dos eventos, método aversivo e sinal desconhecido. Falha de LLM, schema inválido, ID inventado, módulo não publicado, contraindicação, pré-requisito ausente, mais de 3 tarefas/dia e tentativa de elevar dificuldade com risco entram junto do planner/check-in nas fases P7-P9. Injeção em texto livre e vazamento de PII permanecem no hardening P14.

## Bloqueio de lançamento

É necessário validar estas regras e a copy com profissional qualificado e conferir referências atuais, inclusive [AVSAB](https://avsab.org/resources/position-statements/). A fundação não realizou essa revisão e não deve ser oferecida como orientação comportamental pronta.
