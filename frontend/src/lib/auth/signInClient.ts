// src/lib/auth/signInClient.ts
// Sets both localStorage (for client reads) and a cookie (for middleware SSR protection)

import { saveTokens, saveUser } from "@/utils/django/client";

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearAuthCookies() {
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

export async function signInClient(email: string, password: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/login/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { error: data.detail || "Login failed" };
    }

    // Save to localStorage (client-side reads)
    saveTokens(data.access, data.refresh);

    // Save to cookie (middleware SSR protection)
    setCookie("access_token", data.access);

    // Fetch profile
    const profileRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/me/`,
      {
        headers: { Authorization: `Bearer ${data.access}` },
      }
    );
    const profile = await profileRes.json();
    console.log('🔍 Profile from /me/:', profile);
    saveUser({ email, ...profile });

    return { user: { email }, role: profile.role };
  } catch {
    return { error: "Network error — is your Django server running?" };
  }
}