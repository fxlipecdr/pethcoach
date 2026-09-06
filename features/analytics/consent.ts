import { setAnalyticsConsent } from "@/lib/posthog/client";
import { loadMetaPixel } from "@/lib/meta/client";
import type { ConsentStatus } from "./contracts";

export const CONSENT_COOKIE_NAME = "peth_consent";
export const CONSENT_STORAGE_KEY = "peth_analytics_consent";

/**
 * Retrieves the current consent status from cookie or localStorage.
 * Defaults to "pending" if neither is set.
 */
export function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") {
    return "pending";
  }

  // Check localStorage first
  try {
    const local = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (local === "granted" || local === "denied") {
      return local;
    }
  } catch {
    // Ignore storage errors (private mode)
  }

  // Check cookie
  try {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const match = cookies.find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
    if (match) {
      const val = match.split("=")[1];
      if (val === "granted" || val === "denied") {
        return val;
      }
    }
  } catch {
    // Ignore cookie errors
  }

  return "pending";
}

/**
 * Persists the user's consent choice and syncs with PostHog client.
 */
export function setConsent(status: "granted" | "denied"): void {
  if (typeof window === "undefined") return;

  // Persist to cookie (365 days validity, SameSite=Lax)
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE_NAME}=${status}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Persist to localStorage
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // Ignore storage errors
  }

  // Sync with PostHog client
  void setAnalyticsConsent(status === "granted");

  // O pixel da Meta só entra na página depois do aceite, nunca antes.
  if (status === "granted") loadMetaPixel();

  // Notify active listeners
  if (typeof window.dispatchEvent === "function") {
    if (typeof CustomEvent !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("peth:consent_change", { detail: status }),
      );
    } else {
      window.dispatchEvent(
        new Event("peth:consent_change") as unknown as CustomEvent<ConsentStatus>,
      );
    }
  }
}

/**
 * Subscribes to consent changes in the browser.
 */
export function onConsentChange(
  callback: (status: ConsentStatus) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<ConsentStatus>).detail;
    if (detail) callback(detail);
  };

  window.addEventListener("peth:consent_change", handler);
  return () => window.removeEventListener("peth:consent_change", handler);
}
