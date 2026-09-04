// src/lib/auth/signUpClient.ts
import { saveTokens, saveUser } from "@/utils/django/client";

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export async function signUpClient(
  email: string,
  password: string,
  username: string,
  role: "tenant" | "landlord" | "agent"
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/register/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, role }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const firstError =
        data.detail ||
        Object.values(data as Record<string, string[]>)
          .flat()
          .join(", ");
      return { error: firstError || "Registration failed" };
    }

    saveTokens(data.access, data.refresh);
    setCookie("access_token", data.access);
    saveUser({ email, username, role });

    return { user: data.user };
  } catch {
    return { error: "Network error — is your Django server running?" };
  }
}