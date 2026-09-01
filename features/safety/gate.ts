import type {
  EvaluatedSafetyOutcome,
  SafetyCode,
} from "./contracts";

export const safetyRuleVersion = "p5-v1" as const;

const knownTags = new Set([
  "aversive_method",
  "bite_injury",
  "contact_risk",
  "escape_risk",
  "high_risk_bite",
  "physical_change",
  "self_injury",
  "severe_distress",
  "stiff_body",
  "sudden_change",
  "sudden_physical_change",
  "suspected_pain",
  "vulnerable_person_risk",
]);

type Rule = {
  code: SafetyCode;
  outcome: EvaluatedSafetyOutcome;
  matches: (tags: ReadonlySet<string>) => boolean;
};

const hasAny = (tags: ReadonlySet<string>, values: readonly string[]) =>
  values.some((value) => tags.has(value));

const rules: readonly Rule[] = [
  {
    code: "HIGH_RISK_BITE",
    outcome: "block",
    matches: (tags) => hasAny(tags, ["high_risk_bite", "bite_injury"]),
  },
  {
    code: "VULNERABLE_PERSON_RISK",
    outcome: "block",
    matches: (tags) => tags.has("vulnerable_person_risk"),
  },
  {
    code: "SELF_INJURY_OR_ESCAPE_RISK",
    outcome: "block",
    matches: (tags) => hasAny(tags, ["self_injury", "escape_risk"]),
  },
  {
    code: "SUSPECTED_PAIN",
    outcome: "refer",
    matches: (tags) => tags.has("suspected_pain"),
  },
  {
    code: "SUDDEN_CHANGE_WITH_PHYSICAL_SIGNS",
    outcome: "refer",
    matches: (tags) =>
      tags.has("sudden_physical_change") ||
      (tags.has("sudden_change") &&
        hasAny(tags, ["physical_change", "suspected_pain"])),
  },
  {
    code: "SEVERE_DISTRESS",
    outcome: "refer",
    matches: (tags) => tags.has("severe_distress"),
  },
  {
    code: "CONTACT_RISK",
    outcome: "refer",
    matches: (tags) => tags.has("contact_risk"),
  },
  {
    code: "AVERSIVE_METHOD_REPORTED",
    outcome: "continue",
    matches: (tags) => tags.has("aversive_method"),
  },
];

const priority: Record<EvaluatedSafetyOutcome, number> = {
  continue: 1,
  refer: 2,
  block: 3,
};

export function evaluateSafetyTags(input: readonly string[]) {
  const tags = new Set(input);
  const matches = rules.filter((rule) => rule.matches(tags));
  if ([...tags].some((tag) => !knownTags.has(tag)))
    matches.push({
      code: "UNRECOGNIZED_SAFETY_SIGNAL",
      outcome: "refer",
      matches: () => true,
    });
  if (matches.length === 0)
    return {
      status: "continue" as const,
      codes: ["SAFETY_GATE_CLEAR" as const],
      ruleVersion: safetyRuleVersion,
    };
  const status = matches.reduce<EvaluatedSafetyOutcome>(
    (current, rule) =>
      priority[rule.outcome] > priority[current] ? rule.outcome : current,
    "continue",
  );
  return {
    status,
    codes: matches.map(({ code }) => code),
    ruleVersion: safetyRuleVersion,
  };
}
