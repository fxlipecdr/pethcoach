# Limites de domínio

Adicionar cada feature quando sua fase começar, sem colocar decisões sensíveis em componentes:

- `dogs`: P2, perfil e ownership.
- `assessments`: P4/P6, quiz anônimo e claim seguro.
- `safety`: P5, regras determinísticas antes da IA.
- `plans`: P7-P9, catálogo, versões, tarefas e adaptação.
- `billing`: P10, entitlements somente por webhook.
- `analytics`: contratos preparados; ativação e atribuição em P11.
- `admin`: P13, revisão e auditoria.

Cada domínio terá `contracts.ts` validado com Zod conforme seus endpoints reais forem implementados. Não criar schemas de treino hipotéticos como se tivessem sido aprovados.
