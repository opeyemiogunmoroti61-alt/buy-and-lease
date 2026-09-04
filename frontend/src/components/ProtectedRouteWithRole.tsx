"use client";
// components/ProtectedRouteWithRole.tsx
// Replaces: Supabase session + user_profiles role check
// Now uses useAuth() from AuthContext — no Supabase needed
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
export default function ProtectedRouteWithRole({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    // Not logged in at all
    if (!user) {
      router.replace("/login");
      return;
    }
    const role = user.role;
    // Wrong role for this dashboard
    if (
      (pathname.startsWith("/dashboard/landlord") && role !== "landlord") ||
      (pathname.startsWith("/dashboard/agent") && role !== "agent") ||
      (pathname.startsWith("/dashboard/tenant") && role !== "tenant") ||
      (pathname.startsWith("/control") && role !== "admin")
    ) {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router]);
  if (isLoading) {
    return <div className="text-center py-4">Checking access...</div>;
  }
  if (!user) return null;
  return <>{children}</>;
}
