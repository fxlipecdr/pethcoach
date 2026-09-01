import { describe, expect, it } from "vitest";
import { evaluateSafetyTags, safetyRuleVersion } from "@/features/safety/gate";
import { safetyPresentation } from "@/features/safety/presentation";

describe("P5 deterministic safety gate", () => {
  it("continues without claiming that risk is absent", () => {
    const result = evaluateSafetyTags([]);
    expect(result).toEqual({
      status: "continue",
      codes: ["SAFETY_GATE_CLEAR"],
      ruleVersion: safetyRuleVersion,
    });
    expect(safetyPresentation(result.status, result.codes).description).toMatch(
      /não garante ausência de risco/i,
    );
  });

  it.each([
    ["suspected_pain"],
    ["sudden_physical_change"],
    ["sudden_change", "physical_change"],
    ["severe_distress"],
    ["contact_risk"],
  ])("refers the supported non-blocking signal set %j", (...tags) => {
    expect(evaluateSafetyTags(tags).status).toBe("refer");
  });

  it.each([
    ["high_risk_bite"],
    ["bite_injury"],
    ["vulnerable_person_risk"],
    ["self_injury"],
    ["escape_risk"],
  ])("blocks the supported immediate-risk signal %s", (...tags) => {
    expect(evaluateSafetyTags(tags).status).toBe("block");
  });

  it("keeps BLOCK precedence when referral signals are also present", () => {
    const result = evaluateSafetyTags([
      "suspected_pain",
      "high_risk_bite",
      "aversive_method",
    ]);
    expect(result.status).toBe("block");
    expect(result.codes).toEqual(
      expect.arrayContaining([
        "HIGH_RISK_BITE",
        "SUSPECTED_PAIN",
        "AVERSIVE_METHOD_REPORTED",
      ]),
    );
  });

  it("records aversive methods but redirects without inventing a diagnosis", () => {
    const result = evaluateSafetyTags(["aversive_method"]);
    expect(result).toMatchObject({
      status: "continue",
      codes: ["AVERSIVE_METHOD_REPORTED"],
    });
    const presentation = safetyPresentation(result.status, result.codes);
    expect(presentation.actions.join(" ")).toMatch(/Suspenda trancos/i);
    expect(JSON.stringify(presentation)).not.toMatch(/diagnosticou|certeza|cura/i);
  });

  it("fails closed for an unrecognized signal", () => {
    expect(evaluateSafetyTags(["future_unreviewed_signal"])).toMatchObject({
      status: "refer",
      codes: ["UNRECOGNIZED_SAFETY_SIGNAL"],
    });
  });
});
