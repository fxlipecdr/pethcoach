import "server-only";

import type { NextRequest } from "next/server";
import { z } from "zod";
import type { AssessmentApiError } from "./contracts";

export function apiError(
  code: AssessmentApiError["code"],
  error: string,
  status: number,
) {
  return Response.json({ code, error } satisfies AssessmentApiError, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function isSameOriginMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = (
      request.headers.get("host") ??
      request.headers.get("x-forwarded-host") ??
      requestUrl.host
    )
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    const protocol = (
      request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.slice(0, -1)
    )
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    if (!host || (protocol !== "http" && protocol !== "https")) return false;
    return (
      originUrl.host.toLowerCase() === host &&
      originUrl.protocol.toLowerCase() === `${protocol}:`
    );
  } catch {
    return false;
  }
}

export function networkHint(request: NextRequest) {
  const candidate =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    "local";
  return candidate.split(",")[0]?.trim().slice(0, 80) || "unknown";
}

export async function parseJson<T>(request: NextRequest, schema: z.ZodType<T>) {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!contentType.toLowerCase().startsWith("application/json")) return null;
  if (Number.isFinite(contentLength) && contentLength > 4096) return null;
  try {
    return schema.parse(await request.json());
  } catch {
    return null;
  }
}
