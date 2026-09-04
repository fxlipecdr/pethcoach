import { ALLOWED_CLICK_IDS } from "./contracts";

export const ANONYMOUS_ID_STORAGE_KEY = "peth_anonymous_id";

export interface ParsedAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  landing?: string;
  clickIds: Record<string, string>;
}

/**
 * Sanitizes a referrer URL: keeps protocol + host + path, removes query strings and hashes.
 */
export function sanitizeReferrer(referrer: string | null | undefined): string | undefined {
  if (!referrer || typeof referrer !== "string") return undefined;
  try {
    const url = new URL(referrer.trim());
    // Only accept http and https
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const sanitized = `${url.origin}${url.pathname}`.slice(0, 500);
    return sanitized;
  } catch {
    return undefined;
  }
}

/**
 * Parses and sanitizes URL parameters for attribution (UTMs and allowed click IDs).
 */
export function parseAttributionParams(
  urlStr: string,
  rawReferrer?: string,
): ParsedAttribution {
  const result: ParsedAttribution = {
    clickIds: {},
  };

  try {
    const url = new URL(urlStr);
    const params = url.searchParams;

    const source = params.get("utm_source")?.trim();
    if (source) result.source = source.slice(0, 120);

    const medium = params.get("utm_medium")?.trim();
    if (medium) result.medium = medium.slice(0, 120);

    const campaign = params.get("utm_campaign")?.trim();
    if (campaign) result.campaign = campaign.slice(0, 200);

    result.landing = `${url.origin}${url.pathname}`.slice(0, 500);

    // Extract allowed click IDs
    for (const clickKey of ALLOWED_CLICK_IDS) {
      const clickVal = params.get(clickKey)?.trim();
      if (clickVal && /^[a-zA-Z0-9._-]+$/.test(clickVal)) {
        result.clickIds[clickKey] = clickVal.slice(0, 200);
      }
    }
  } catch {
    // If URL parsing fails, return empty result
  }

  const sanitizedRef = sanitizeReferrer(rawReferrer);
  if (sanitizedRef) {
    result.referrer = sanitizedRef;
  }

  return result;
}

/**
 * Retrieves or generates an anonymous ID (UUID v4) stored in localStorage.
 * Note: An anonymous_id is a correlation identifier, NEVER a credential or claim token.
 */
export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-0000-0000-000000000000";
  }

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
    if (existing && UUID_REGEX.test(existing)) {
      return existing;
    }

    const newId = crypto.randomUUID();
    window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, newId);
    return newId;
  } catch {
    // Fallback if localStorage is unavailable
    return crypto.randomUUID();
  }
}
