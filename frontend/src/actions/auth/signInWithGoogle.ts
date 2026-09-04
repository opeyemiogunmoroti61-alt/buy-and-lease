"use server";

// Google OAuth via Supabase has been removed.
// This stub keeps any existing imports working without breaking the build.
// To add Google login later, use django-allauth on the backend.

export async function signInWithGoogle() {
  // No-op for now — redirect to standard login
  const { redirect } = await import("next/navigation");
  redirect("/login");
}