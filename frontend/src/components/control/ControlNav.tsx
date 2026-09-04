"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { href: "/control/overview", label: "Overview" },
  { href: "/control/listings", label: "Listings" },
  { href: "/control/users", label: "Users" },
  { href: "/control/reports", label: "Reports" },
  { href: "/control/inquiries", label: "Inquiries" },
  { href: "/control/favorites", label: "Favorites" },
];

export default function ControlNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Control Panel
          </span>
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const active = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user?.email && <span className="text-sm text-slate-500">{user.email}</span>}
          <button
            onClick={logout}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
