// lib/auth/signOutClient.ts
// Replaces: supabase.auth.signOut()
// Django uses stateless JWT — signing out just means clearing local tokens.

import { clearTokens } from "../../utils/django/client";

export function signOutClient() {
  clearTokens();
  window.location.href = "/login";
}
