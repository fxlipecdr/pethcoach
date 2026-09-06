import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { problems } from "@/content/problems";
import { evaluateSafetyTags } from "@/features/safety/gate";

/**
 * Os quatro programas novos são conteúdo que orienta pessoas sobre o
 * comportamento de um animal. Um erro de digitação numa tag de segurança
 * desliga silenciosamente a regra que deveria encaminhar ao veterinário — e
 * nada no banco reclamaria. Estes testes fecham essa porta.
 */
describe("P16 — novos programas comportamentais", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
    `);

    for (const file of [
      "20260831000000_profiles_baseline.sql",
      "20260831010000_p2_auth_dogs_attribution.sql",
      "20260901010000_p4_quiz_assessments.sql",
      "20260901020000_p5_safety_gate.sql",
      "20260901021000_p5_quiz_option_contract_fix.sql",
      "20260902000000_p6_assessment_claim.sql",
      "20260903000000_p7_catalog_and_plans.sql",
      "20260912000000_p15_revisor_real_do_catalogo.sql",
      "20260913000000_p16_quatro_novos_programas.sql",
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }
  }, 60000);

  it("publica os sete problemas e cada landing tem problema no banco", async () => {
    const { rows } = await db.query<{ slug: string }>(
      "select slug from public.problems where status = 'published' order by slug",
    );
    const noBanco = rows.map((r) => r.slug).sort();

    expect(noBanco).toHaveLength(7);
    // Landing sem problema no banco gera quiz quebrado; problema sem landing
    // gera página 404 vinda do resultado. Os dois lados precisam casar.
    expect(noBanco).toEqual([...problems.map((p) => p.slug)].sort());
  });

  it("cada problema novo tem quiz e módulos suficientes para 14 dias", async () => {
    for (const slug of [
      "cachorro-late-muito",
      "cachorro-pula-nas-pessoas",
      "cachorro-nao-vem-quando-chamado",
      "cachorro-nao-fica-sozinho",
    ]) {
      const { rows: perguntas } = await db.query<{ total: number }>(
        `select count(*)::int as total from public.quiz_questions q
           join public.problems p on p.id = q.problem_id
          where p.slug = $1 and q.status = 'published'`,
        [slug],
      );
      expect(perguntas[0]?.total ?? 0).toBeGreaterThanOrEqual(4);

      const { rows: modulos } = await db.query<{
        total: number;
        dificuldades: string[];
      }>(
        `select count(*)::int as total,
                array_agg(distinct m.difficulty) as dificuldades
           from public.modules m
           join public.problems p on p.id = m.problem_id
          where p.slug = $1 and m.status = 'published'`,
        [slug],
      );
      expect(modulos[0]?.total ?? 0).toBeGreaterThanOrEqual(4);
      // A progressão de 14 dias precisa de exercícios em mais de um nível.
      expect(modulos[0]?.dificuldades.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it("nenhum módulo novo afirma revisão profissional que não houve", async () => {
    const { rows } = await db.query<{ total: number }>(
      "select count(*)::int as total from public.modules where reviewed_by is not null",
    );
    expect(rows[0]?.total).toBe(0);
  });

  it("as tags de segurança do quiz são reconhecidas pelo gate", async () => {
    const { rows } = await db.query<{ rules_json: unknown }>(
      "select rules_json from public.quiz_questions where status = 'published'",
    );

    const tags = new Set<string>();
    for (const { rules_json } of rows) {
      const regras = rules_json as {
        optionTags?: Record<string, string[]>;
      } | null;
      for (const lista of Object.values(regras?.optionTags ?? {})) {
        for (const tag of lista) tags.add(tag);
      }
    }

    expect(tags.size).toBeGreaterThan(0);

    /**
     * Uma tag que o gate não conhece é pior do que nenhuma: parece proteção e
     * não é. O gate tem um resguardo — sinal desconhecido vira encaminhamento
     * — então checar o desfecho não pegaria erro de digitação. O que pega é o
     * código: `UNRECOGNIZED_SAFETY_SIGNAL` só aparece com tag fora do
     * vocabulário.
     */
    for (const tag of tags) {
      const { codes } = evaluateSafetyTags([tag]);
      expect(
        codes,
        `a tag "${tag}" não é reconhecida pelo gate de segurança`,
      ).not.toContain("UNRECOGNIZED_SAFETY_SIGNAL");
    }
  });

  it("o programa de ficar sozinho encaminha sofrimento clínico em vez de treinar", async () => {
    const { rows } = await db.query<{ rules_json: unknown }>(
      `select q.rules_json from public.quiz_questions q
         join public.problems p on p.id = q.problem_id
        where p.slug = 'cachorro-nao-fica-sozinho' and q.status = 'published'`,
    );

    const tags = new Set<string>();
    for (const { rules_json } of rows) {
      const regras = rules_json as {
        optionTags?: Record<string, string[]>;
      } | null;
      for (const lista of Object.values(regras?.optionTags ?? {})) {
        for (const tag of lista) tags.add(tag);
      }
    }

    // Ansiedade de separação é diagnóstico veterinário, com tratamento de 8 a
    // 16 semanas. Um programa de 14 dias não trata isso, e o quiz precisa
    // reconhecer os sinais que exigem encaminhamento.
    expect(tags.has("severe_distress")).toBe(true);
    expect(tags.has("self_injury")).toBe(true);
    expect(tags.has("escape_risk")).toBe(true);

    expect(evaluateSafetyTags(["self_injury"]).status).toBe("block");
    expect(evaluateSafetyTags(["escape_risk"]).status).toBe("block");
    expect(evaluateSafetyTags(["severe_distress"]).status).toBe("refer");
  });
});
