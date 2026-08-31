# Segurança comportamental

Este documento registra requisitos do blueprint, **não certifica revisão clínica**. Não há orientação de treino publicada nesta fundação.

## Regras do produto

Treino baseado somente em recompensas. Sem diagnóstico, medicação, prognóstico, garantias de cura ou certeza clínica. Um aviso genérico nunca substitui os controles de produto. Revisão humana qualificada será necessária antes de publicar exercícios ou mensagens de encaminhamento.

## Pipeline a implementar em P5-P7

Entradas validadas → normalização → safety gate determinístico → classificação de contexto → módulos publicados e elegíveis → restrições → planner estruturado → validação de schema/IDs/pré-requisitos/contraindicações → pós-checagem → persistência versionada e auditável.

| Sinal | Resultado previsto |
|---|---|
| Mudança súbita acompanhada de sinais físicos | REFER; avaliação veterinária antes de treino |
| Suspeita de dor | REFER; avaliação veterinária |
| Mordida com perfuração, ataque imprevisível ou risco a vulneráveis | BLOCK; interromper funil comercial e encaminhar |
| Sofrimento intenso, fuga ou autolesão ao ficar sozinho | BLOCK/REFER segundo regra revisada, sem diagnóstico |
| Uso de ferramentas/técnicas aversivas | Não ensinar uso; redirecionar para estratégia baseada em recompensas |
| Sem sinais definidos de risco | CONTINUE; não significa certificação de ausência de risco |

Regras devem abranger tanto quiz quanto check-in. Não depender de LLM para detectar red flags. Segurança prevalece sobre progressão, preço e conversão. REFER/BLOCK substituem o paywall por encaminhamento.

## Catálogo

Módulos: setup, steps, success criteria, stop conditions, progression/regression rules, difficulty, tags, contraindications e version. Fluxo draft → reviewed → published com revisor e timestamp. Não publicar seeds automaticamente. Fallback também exige catálogo aprovado; catálogo vazio mantém geração indisponível.

## Casos de teste futuros obrigatórios

Red flags isoladas e combinadas; prioridade de BLOCK; falha de LLM; schema inválido; ID inventado; módulo não publicado; contraindicação; pré-requisito ausente; mais de 3 tarefas/dia; tentativa de elevar dificuldade com risco; injeção em texto livre; vazamento de PII.

## Bloqueio de lançamento

É necessário validar estas regras e a copy com profissional qualificado e conferir referências atuais, inclusive [AVSAB](https://avsab.org/resources/position-statements/). A fundação não realizou essa revisão e não deve ser oferecida como orientação comportamental pronta.
