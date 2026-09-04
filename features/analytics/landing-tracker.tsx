"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/posthog/client";
import { parseAttributionParams } from "./attribution";
import { getStoredConsent, onConsentChange } from "./consent";

export function LandingTracker({ slug }: { slug: string }) {
  useEffect(() => {
    function track() {
      if (getStoredConsent() !== "granted") return;

      const parsed = parseAttributionParams(
        window.location.href,
        document.referrer,
      );

      void analytics.capture("landing_view", {
        slug,
        utm_source: parsed.source,
        utm_medium: parsed.medium,
        utm_campaign: parsed.campaign,
        referrer: parsed.referrer,
      });
    }

    track();

    // If user grants consent later while on the page, track it
    const unsubscribe = onConsentChange((status) => {
      if (status === "granted") {
        track();
      }
    });

    return unsubscribe;
  }, [slug]);

  return null;
}
