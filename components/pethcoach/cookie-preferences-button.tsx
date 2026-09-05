"use client";
import { cn } from "@/lib/utils";

export function CookiePreferencesButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("peth:open_consent_preferences"));
      }}
      className={cn(
        "nav-link text-left transition-colors hover:text-primary-strong",
        className,
      )}
    >
      Preferências de cookies
    </button>
  );
}
