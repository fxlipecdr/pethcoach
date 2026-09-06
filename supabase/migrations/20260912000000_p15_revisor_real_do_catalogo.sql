-- P15 — remover afirmação de revisão que não aconteceu.
--
-- A migração de P7 semeou os 12 módulos com `reviewed_by = 'educador-supervisor'`,
-- um valor inventado: não existe pessoa, registro profissional ou data real por
-- trás dele. A trilha de auditoria afirmava uma revisão inexistente, o que
-- contraria `docs/safety.md` ("fluxo draft → reviewed → published com revisor e
-- timestamp") e a regra do `AGENTS.md` contra conteúdo fabricado.
--
-- O campo passa a dizer a verdade. O `status` **não** é alterado aqui: mudar
-- para 'draft' deixaria a geração de plano indisponível, porque o fallback
-- exige catálogo aprovado, e essa é uma decisão de produto, não de migração.
-- Enquanto `reviewed_by` estiver nulo, o catálogo está publicado sem revisão
-- profissional — e isso agora está visível em vez de mascarado.

update public.modules
   set reviewed_by = null,
       reviewed_at = null,
       updated_at = now()
 where reviewed_by = 'educador-supervisor';

comment on column public.modules.reviewed_by is
  'Nome e registro do profissional que revisou. Nulo significa sem revisão profissional: não lançar ao público assim.';
