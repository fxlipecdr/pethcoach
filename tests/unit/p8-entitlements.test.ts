import { describe, expect, it } from "vitest";
import {
  checkinMoodSchema,
  dailyCheckinSchema,
  entitlementSchema,
  submitDailyCheckinInputSchema,
} from "@/features/plans/contracts";
import { isDayUnlocked } from "@/features/plans/data";

describe("P8 Entitlements - Day Unlock Logic", () => {
  it("always unlocks Day 1 regardless of entitlement status (100% free Day 1)", () => {
    expect(isDayUnlocked(1, false)).toBe(true);
    expect(isDayUnlocked(1, true)).toBe(true);
  });

  it("handles edge cases (day 0 or negative) safely as unlocked", () => {
    expect(isDayUnlocked(0, false)).toBe(true);
    expect(isDayUnlocked(-1, false)).toBe(true);
  });

  it("locks Days 2-14 when user lacks an active entitlement", () => {
    for (let day = 2; day <= 14; day++) {
      expect(isDayUnlocked(day, false)).toBe(false);
    }
  });

  it("unlocks Days 2-14 when user has an active entitlement", () => {
    for (let day = 2; day <= 14; day++) {
      expect(isDayUnlocked(day, true)).toBe(true);
    }
  });
});

describe("P8 Contracts - Daily Check-in Schemas", () => {
  it("validates allowed check-in mood values (calm, moderate, needed_pause)", () => {
    expect(checkinMoodSchema.safeParse("calm").success).toBe(true);
    expect(checkinMoodSchema.safeParse("moderate").success).toBe(true);
    expect(checkinMoodSchema.safeParse("needed_pause").success).toBe(true);

    expect(checkinMoodSchema.safeParse("bad").success).toBe(false);
    expect(checkinMoodSchema.safeParse("frustrated").success).toBe(false);
    expect(checkinMoodSchema.safeParse("aggressive").success).toBe(false);
    expect(checkinMoodSchema.safeParse("").success).toBe(false);
  });

  it("accepts valid submitDailyCheckinInputSchema data", () => {
    const valid = {
      planId: "a0000000-0000-4000-8000-000000000001",
      dayNumber: 1,
      mood: "calm" as const,
      notes: "Rex respondeu super bem ao treino de hoje!",
    };

    const parsed = submitDailyCheckinInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.notes).toBe("Rex respondeu super bem ao treino de hoje!");
    }
  });

  it("accepts check-in without notes", () => {
    const valid = {
      planId: "a0000000-0000-4000-8000-000000000001",
      dayNumber: 3,
      mood: "needed_pause" as const,
    };

    const parsed = submitDailyCheckinInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects notes exceeding 500 characters", () => {
    const invalid = {
      planId: "a0000000-0000-4000-8000-000000000001",
      dayNumber: 1,
      mood: "calm" as const,
      notes: "a".repeat(501),
    };

    const parsed = submitDailyCheckinInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid planId or dayNumber out of bounds", () => {
    expect(
      submitDailyCheckinInputSchema.safeParse({
        planId: "not-a-uuid",
        dayNumber: 1,
        mood: "calm",
      }).success,
    ).toBe(false);

    expect(
      submitDailyCheckinInputSchema.safeParse({
        planId: "a0000000-0000-4000-8000-000000000001",
        dayNumber: 0,
        mood: "calm",
      }).success,
    ).toBe(false);

    expect(
      submitDailyCheckinInputSchema.safeParse({
        planId: "a0000000-0000-4000-8000-000000000001",
        dayNumber: 31,
        mood: "calm",
      }).success,
    ).toBe(false);
  });

  it("validates full dailyCheckinSchema", () => {
    const row = {
      id: "b0000000-0000-4000-8000-000000000001",
      planId: "a0000000-0000-4000-8000-000000000001",
      dayNumber: 1,
      userId: "11111111-1111-4111-8111-111111111111",
      mood: "moderate",
      notes: "Tudo certo",
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(dailyCheckinSchema.safeParse(row).success).toBe(true);
  });
});

describe("P8 Contracts - Entitlement Schema", () => {
  it("validates valid entitlement records", () => {
    const valid = {
      id: "c0000000-0000-4000-8000-000000000001",
      userId: "11111111-1111-4111-8111-111111111111",
      scope: "full_program" as const,
      status: "active" as const,
      startsAt: new Date().toISOString(),
      expiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(entitlementSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid entitlement scopes or statuses", () => {
    const base = {
      id: "c0000000-0000-4000-8000-000000000001",
      userId: "11111111-1111-4111-8111-111111111111",
      startsAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(
      entitlementSchema.safeParse({
        ...base,
        scope: "invalid_scope",
        status: "active",
      }).success,
    ).toBe(false);

    expect(
      entitlementSchema.safeParse({
        ...base,
        scope: "subscription",
        status: "refunded",
      }).success,
    ).toBe(false);
  });
});
