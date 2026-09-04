// src/app/auth/confirm/route.ts
// Supabase email OTP confirmation removed — Django JWT auth doesn't use OTP.
// This stub prevents 404 errors if anything still links here.

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}