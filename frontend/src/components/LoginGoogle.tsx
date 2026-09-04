"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
import { getDashboardRoute } from "@/config/routes";
import { saveTokens, saveUser } from "@/utils/django/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Mirrors the cookie-setting helper already used in signInClient.ts —
// duplicated here (rather than imported) so this component has no
// dependency on that file's internals, only on the shared token helpers.
function setAccessTokenCookie(value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `access_token=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

declare global {
  interface Window {
    google?: any;
  }
}

const LoginGoogle = () => {
  const buttonRef = useRef<HTMLDivElement>(null);

  async function handleCredentialResponse(response: { credential: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Google sign-in failed.");
        return;
      }

      // Same token-handling as the normal email/password flow.
      saveTokens(data.access, data.refresh);
      setAccessTokenCookie(data.access);

      const profileRes = await fetch(`${API_BASE_URL}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      const profile = await profileRes.json();
      saveUser({ email: data.user.email, ...profile });

      window.location.replace(getDashboardRoute(profile.role).path);
    } catch {
      alert("Network error — is your Django server running?");
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function renderButton() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    }

    // The GIS script may already be loaded (e.g. from a previous
    // client-side navigation) — render immediately if so, otherwise
    // the onLoad handler on the <Script> tag below will do it.
    if (window.google) renderButton();
    else {
      const interval = setInterval(() => {
        if (window.google) {
          renderButton();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    // Fails loudly in dev so a missing env var doesn't silently
    // produce a blank spot with no explanation.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google sign-in button hidden."
      );
    }
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center gap-3 mt-3">
      <div className="w-full flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div ref={buttonRef} />
    </div>
  );
};

export default LoginGoogle;
