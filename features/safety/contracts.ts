import { z } from "zod";

export const safetyOutcomeSchema = z.enum([
  "pending",
  "continue",
  "refer",
  "block",
]);

export const evaluatedSafetyOutcomeSchema = safetyOutcomeSchema.exclude([
  "pending",
]);

export const safetyCodeSchema = z.enum([
  "SAFETY_GATE_CLEAR",
  "HIGH_RISK_BITE",
  "VULNERABLE_PERSON_RISK",
  "SELF_INJURY_OR_ESCAPE_RISK",
  "SUSPECTED_PAIN",
  "SUDDEN_CHANGE_WITH_PHYSICAL_SIGNS",
  "SEVERE_DISTRESS",
  "CONTACT_RISK",
  "AVERSIVE_METHOD_REPORTED",
  "UNRECOGNIZED_SAFETY_SIGNAL",
]);

export const safetyEvaluationSchema = z
  .object({
    status: evaluatedSafetyOutcomeSchema,
    codes: z.array(safetyCodeSchema).min(1).max(10),
    ruleVersion: z.literal("p5-v1"),
    evaluatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type SafetyOutcome = z.infer<typeof safetyOutcomeSchema>;
export type EvaluatedSafetyOutcome = z.infer<
  typeof evaluatedSafetyOutcomeSchema
>;
export type SafetyCode = z.infer<typeof safetyCodeSchema>;
export type SafetyEvaluation = z.infer<typeof safetyEvaluationSchema>;
