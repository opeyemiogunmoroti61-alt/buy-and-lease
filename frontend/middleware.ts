// middleware.ts (root of your Next.js project)
// Replaces: Supabase SSR middleware
// Protects routes by checking for a JWT token in cookies.
// We store the access token in a cookie (set on login) for SSR route protection.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/profile", "/listings/create", "/listings/edit"];

// Routes only for guests (redirect to home if logged in)
const GUEST_ONLY_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for token in cookies (we'll set this on login)
  const token = request.cookies.get("access_token")?.value;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isGuestOnly = GUEST_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
