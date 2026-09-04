"use client";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("peth:open_consent_preferences"));
      }}
      className="nav-link hover:text-primary transition-colors text-left"
    >
      Preferências de cookies
    </button>
  );
}
