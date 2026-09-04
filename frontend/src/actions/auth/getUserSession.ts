// src/actions/auth/getUserSession.ts
// Replaces: Supabase getUser() server-side check
// Reads the access_token cookie set on login for server-side auth checks

import { cookies } from "next/headers";

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  // Token exists — user is logged in
  // Returns a minimal user object so layout.tsx can check truthiness
  // (Full profile is in localStorage client-side via AuthContext)
  return { token };
}