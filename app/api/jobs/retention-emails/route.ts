import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import {
  runDay1IncompleteJob,
  runCheckinReminderJob,
  runReengagementJob,
} from "@/features/emails/jobs";

export async function POST(request: Request) {
  const env = getServerEnv();

  // If CRON_SECRET is configured, enforce authentication
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const customHeader = request.headers.get("x-cron-secret");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const provided = bearer || customHeader;

    if (!provided || provided !== env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Não autorizado." },
        { status: 401 },
      );
    }
  }

  try {
    const [day1Summary, checkinSummary, reengagementSummary] = await Promise.all([
      runDay1IncompleteJob(),
      runCheckinReminderJob(),
      runReengagementJob(),
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      jobs: [day1Summary, checkinSummary, reengagementSummary],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido ao executar jobs de retenção.";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 },
    );
  }
}
