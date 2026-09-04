// src/app/(auth)/layout.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // If logged in, don't redirect — let them log in again
  // The sign out clears the cookie so this won't trigger after sign out
  if (token) {
    redirect("/");
  }

  return <>{children}</>;
}