# P3 — landings por problema e SEO

P3 concluída tecnicamente em 01/09/2026. A implementação prepara aquisição orgânica, mas mantém toda a aplicação fora dos índices até revisão editorial e profissional. Não houve deploy nem liberação comercial nesta etapa.

## Implementado

- Três rotas estáticas: puxar a guia, mordidas de filhote e xixi no lugar errado.
- Copy própria por problema, com sinais para observar, uma prática de 3 a 5 minutos, três passos, condutas a evitar e foco futuro do programa.
- Orientação exclusivamente baseada em recompensa; mudança súbita, dor, pânico, agressão, autoagressão ou sofrimento acionam encaminhamento explícito conforme o contexto.
- Um CTA primário real por landing, apontando para o cadastro autenticado do cão. O texto informa que o programa ainda não está disponível e que nenhuma cobrança será iniciada.
- Metadata por rota com título e descrição exclusivos, Open Graph, Twitter e canonical somente quando `NEXT_PUBLIC_SITE_URL` estiver configurada.
- Imagem Open Graph dinâmica por problema, sem dependências externas.
- Sitemap limitado à home e às três landings prontas. Sem URL pública configurada, ele retorna vazio.
- `robots.txt` e metadata de página permanecem `noindex, nofollow`; a indexação não foi liberada.

## Verificação

- ESLint e TypeScript strict aprovados.
- 55 testes unitários/integração aprovados em oito arquivos.
- Build de produção aprovado; as três landings são geradas estaticamente e a imagem OG é dinâmica.
- Smoke Playwright aprovado em desktop 1440 px e mobile 360 px, com 30 casos após atualizar uma expectativa antiga do placeholder P2.
- Testes específicos comprovam copy exclusiva, duração visível, CTA, referral, metadata, canonical, sitemap e bloqueio de indexação.

## Limites e próximo passo

Esta revisão comprova contratos técnicos, acessibilidade exercitada e alinhamento às regras internas de segurança; não substitui revisão editorial, veterinária/comportamental ou jurídica. O conteúdo das landings não é um catálogo publicado e não pode ser usado por um planner. A próxima fase é P4: quiz e assessments com persistência segura, rate limit e eventos, mantendo cobrança, coaching ao vivo e indexação desativados.
