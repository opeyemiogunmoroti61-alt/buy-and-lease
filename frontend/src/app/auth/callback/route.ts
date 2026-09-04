// src/app/auth/callback/route.ts
// Supabase OAuth callback removed — Django JWT auth doesn't use OAuth callbacks.
// This stub prevents 404 errors if anything still links here.

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}