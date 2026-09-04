import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { dispatchTransactionalEmail, type DispatchEmailResult } from "./dispatcher";

export interface JobExecutionSummary {
  job: string;
  evaluated: number;
  dispatched: number;
  results: { userId: string; result: DispatchEmailResult }[];
}

async function getDogName(
  supabase: SupabaseClient<Database>,
  dogId: string | null,
): Promise<string> {
  if (!dogId) return "seu cão";
  const { data: dog } = await supabase
    .from("dogs")
    .select("name")
    .eq("id", dogId)
    .maybeSingle();
  return dog?.name || "seu cão";
}

export async function runDay1IncompleteJob(
  client?: SupabaseClient<Database> | null,
): Promise<JobExecutionSummary> {
  const supabase = client || createSupabaseAdminClient();
  const summary: JobExecutionSummary = {
    job: "day1_incomplete",
    evaluated: 0,
    dispatched: 0,
    results: [],
  };

  if (!supabase) return summary;

  // Find plans created > 24h ago where day 1 has not been checked in
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, user_id, dog_id, created_at")
    .lt("created_at", oneDayAgo)
    .gt("created_at", sevenDaysAgo);

  if (error || !plans) {
    return summary;
  }

  summary.evaluated = plans.length;

  for (const plan of plans) {
    // Check if user already submitted checkin for Day 1
    const { data: checkin } = await supabase
      .from("daily_checkins")
      .select("id")
      .eq("plan_id", plan.id)
      .eq("day_number", 1)
      .maybeSingle();

    if (checkin) {
      continue; // Day 1 completed
    }

    // Get user email
    const { data: userRecord } = await supabase.auth.admin.getUserById(plan.user_id);
    const email = userRecord.user?.email;
    if (!email) continue;

    const dogName = await getDogName(supabase, plan.dog_id);
    const idempotencyKey = `day1_incomplete:${plan.user_id}:${plan.id}`;

    const dispatchRes = await dispatchTransactionalEmail(
      {
        recipientEmail: email,
        userId: plan.user_id,
        templateKey: "day1_incomplete",
        idempotencyKey,
        templateData: { dogName },
      },
      { client: supabase },
    );

    summary.dispatched++;
    summary.results.push({ userId: plan.user_id, result: dispatchRes });
  }

  return summary;
}

export async function runCheckinReminderJob(
  client?: SupabaseClient<Database> | null,
): Promise<JobExecutionSummary> {
  const supabase = client || createSupabaseAdminClient();
  const summary: JobExecutionSummary = {
    job: "checkin_reminder",
    evaluated: 0,
    dispatched: 0,
    results: [],
  };

  if (!supabase) return summary;

  const todayStr = new Date().toISOString().split("T")[0];

  // Active plans
  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, user_id, dog_id");

  if (error || !plans) return summary;
  summary.evaluated = plans.length;

  for (const plan of plans) {
    // Check if there's already a checkin completed today
    const { data: todayCheckin } = await supabase
      .from("daily_checkins")
      .select("id")
      .eq("plan_id", plan.id)
      .gte("completed_at", `${todayStr}T00:00:00.000Z`)
      .maybeSingle();

    if (todayCheckin) continue;

    const { data: userRecord } = await supabase.auth.admin.getUserById(plan.user_id);
    const email = userRecord.user?.email;
    if (!email) continue;

    const dogName = await getDogName(supabase, plan.dog_id);
    const idempotencyKey = `checkin_reminder:${plan.user_id}:${plan.id}:${todayStr}`;

    const dispatchRes = await dispatchTransactionalEmail(
      {
        recipientEmail: email,
        userId: plan.user_id,
        templateKey: "checkin_reminder",
        idempotencyKey,
        templateData: { dogName },
      },
      { client: supabase },
    );

    summary.dispatched++;
    summary.results.push({ userId: plan.user_id, result: dispatchRes });
  }

  return summary;
}

export async function runReengagementJob(
  client?: SupabaseClient<Database> | null,
): Promise<JobExecutionSummary> {
  const supabase = client || createSupabaseAdminClient();
  const summary: JobExecutionSummary = {
    job: "re_engagement",
    evaluated: 0,
    dispatched: 0,
    results: [],
  };

  if (!supabase) return summary;

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

  // Find users with active plans whose latest checkin was between 3 and 20 days ago
  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, user_id, dog_id");

  if (error || !plans) return summary;
  summary.evaluated = plans.length;

  // Round to calendar week for idempotency key
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

  for (const plan of plans) {
    const { data: recentCheckin } = await supabase
      .from("daily_checkins")
      .select("completed_at")
      .eq("plan_id", plan.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentCheckin) continue;

    const lastDate = recentCheckin.completed_at;
    if (lastDate > threeDaysAgo || lastDate < twentyDaysAgo) {
      continue;
    }

    const { data: userRecord } = await supabase.auth.admin.getUserById(plan.user_id);
    const email = userRecord.user?.email;
    if (!email) continue;

    const dogName = await getDogName(supabase, plan.dog_id);
    const idempotencyKey = `re_engagement:${plan.user_id}:${plan.id}:w${weekNumber}`;

    const dispatchRes = await dispatchTransactionalEmail(
      {
        recipientEmail: email,
        userId: plan.user_id,
        templateKey: "re_engagement",
        idempotencyKey,
        templateData: { dogName },
      },
      { client: supabase },
    );

    summary.dispatched++;
    summary.results.push({ userId: plan.user_id, result: dispatchRes });
  }

  return summary;
}
