// src/config/routes.ts
//
// Single source of truth for "where does this role go". Every place that
// used to hand-write if (role === "landlord") ... else if (role === "agent")
// ... chains (LoginForm, ProtectedRouteWithRole, MegaNavbar) should read
// from here instead. Add a role once, in one place, and every consumer
// picks it up automatically — that's the whole point.

export type Role = "tenant" | "landlord" | "agent" | "admin";

interface DashboardEntry {
  path: string;
  label: string;
}

// Where does each role land after login / when they click "My Dashboard"?
const DASHBOARD_BY_ROLE: Record<Role, DashboardEntry> = {
  admin: { path: "/control/overview", label: "Control Panel" },
  landlord: { path: "/dashboard/landlord", label: "My Listings" },
  agent: { path: "/dashboard/agent", label: "My Listings" },
  tenant: { path: "/dashboard/tenant", label: "My Dashboard" },
};

/**
 * Returns the correct dashboard route + label for a given role.
 * Falls back to /register for anyone logged out or with an
 * unrecognized/missing role — this is the ONE place that fallback
 * lives, instead of being silently duplicated (and silently wrong)
 * in three different components.
 */
export function getDashboardRoute(role?: string | null): DashboardEntry {
  if (role && role in DASHBOARD_BY_ROLE) {
    return DASHBOARD_BY_ROLE[role as Role];
  }
  return { path: "/register", label: "Get Started" };
}

// Real, existing public-facing routes only. Nothing here should ever
// point at a page that doesn't actually exist in src/app — that was
// the whole problem with the old MegaNavbar/MegaFooter boilerplate.
export const PUBLIC_NAV_ITEMS = [
  { path: "/properties", label: "Browse Properties" },
] as const;
