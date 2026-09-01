# P5 — Safety Gate determinístico

P5 concluída tecnicamente em 01/09/2026. O gate roda antes de qualquer resultado personalizado ou futura chamada de IA. Ele não diagnostica: transforma sinais estruturados do quiz em `CONTINUE`, `REFER` ou `BLOCK` usando regras fixas `p5-v1` e prioridade conservadora.

## Implementado

- Quiz versão 2 com dez perguntas por problema; versão 1 preservada para assessments em andamento.
- Perguntas comuns cobrem risco de mordida, criança/idoso/pessoa vulnerável, fuga/autoagressão quando sozinho e técnicas aversivas.
- Regras para suspeita de dor, mudança súbita com sinais físicos, mordida de alto risco, risco a vulneráveis, sofrimento intenso, fuga/autoagressão, risco de contato e uso de aversivos.
- `BLOCK` prevalece sobre `REFER`, que prevalece sobre `CONTINUE`. Tag desconhecida em conteúdo publicado gera `REFER` e revisão manual.
- Decisão executada atomicamente no PostgreSQL durante `complete_anonymous_assessment`; não existe intervalo em que um plano ou resultado possa ser liberado antes do gate.
- `safety_events` versionados, idempotentes e sem PII/texto livre, com RLS forçada e zero acesso direto para `anon`/`authenticated`.
- Assessment persiste status, versão e instante da avaliação. Leitura anônima continua exigindo token assinado válido.
- Mensagens PT-BR fixas para os três desfechos, com redirecionamento explícito para métodos baseados em recompensa e sem diagnóstico, tratamento, prognóstico ou certeza clínica.
- Resultado P5 valida o token no servidor. `REFER`/`BLOCK` substituem o conteúdo do funil por ações de segurança; `CONTINUE` informa que a triagem não garante ausência de risco.

## Verificação

- Testes unitários do gate/mensagens e Route Handlers.
- Integração PostgreSQL/PGlite com versões do quiz, regras isoladas/combinadas, prioridade, evento idempotente, RLS e falha segura.
- Playwright em desktop e 360 px para REFER/BLOCK, acessibilidade, overflow e ausência de CTA comercial no conteúdo.
- As duas migrations P5 foram aplicadas no projeto Supabase dev por CLI, após dry run; o dry run posterior confirmou `upToDate: true`.
- O catálogo remoto tem 30 perguntas publicadas na versão 2 e nenhuma chave de opção fora do contrato. A correção de compatibilidade também migra respostas antigas de faixa etária sem invalidar retomadas da versão 1.
- O fluxo real pela aplicação local contra o Supabase hospedado concluiu dez respostas nos três desfechos: `CONTINUE` com `SAFETY_GATE_CLEAR`; `REFER` com suspeita de dor e mudança súbita com sinais físicos; `BLOCK` com mordida de alto risco e suspeita de dor. Todos persistiram `p5-v1`, eventos coerentes e página de resultado HTTP 200.
- Os quatro assessments técnicos, eventos em cascata e rate limits usados no aceite foram removidos. A conferência posterior retornou zero registros de aceite.
- `pnpm verify`: lint e TypeScript aprovados; 13 arquivos e 94 testes aprovados.
- `pnpm e2e:smoke`: 38 cenários aprovados em desktop e 360 px.
- `pnpm build`: bundle de produção Next.js 16.3.3 aprovado.
- O commit `946406e` gerou o deployment de produção `dpl_Axtt1ye8exZjL3ZcCPE3ZP1EppFH`, que ficou `READY` e associado a `https://coach.peth.com.br`.
- No domínio público, home e resultado retornaram HTTP 200, `robots.txt` manteve `Disallow: /`, a criação retornou 201 com dez perguntas e o caso de mordida com ferimento concluiu `BLOCK` com `HIGH_RISK_BITE` e `SUSPECTED_PAIN`. O evento `p5-v1` foi conferido no banco e o assessment/rate limits do teste foram removidos.

## Limites e próximo passo

As mensagens são aprovadas para validação técnica interna, mas ainda não passaram por revisão veterinária/comportamental qualificada. Isso bloqueia abertura ao público. A P6 deve gerar resultado útil somente para `CONTINUE`, manter `REFER/BLOCK` fora do funil comercial e implementar claim autenticado sem repetir o quiz. Nenhum assessment atual concede ownership ou entitlement.
