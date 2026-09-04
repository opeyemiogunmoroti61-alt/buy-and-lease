"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { djangoFetch } from "@/utils/django/client";
import { ShieldCheck, ShieldOff, XCircle, CheckCircle } from "lucide-react";

type Role = "tenant" | "landlord" | "agent" | "admin";

interface UserProfile {
  id: string; // UUID
  email: string;
  username: string;
  full_name: string | null;
  role: Role;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

const ROLES: Role[] = ["tenant", "landlord", "agent", "admin"];

export default function ControlUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);

    try {
      const res = await djangoFetch(`/api/control/users/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.results ?? []);
      } else {
        toast("Failed to load users");
      }
    } catch {
      toast("Network error — is Django running?");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(user: UserProfile, newRole: Role) {
    setBusyId(user.id);
    try {
      const res = await djangoFetch(`/api/control/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
        toast(`${user.email} is now ${newRole}`);
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.detail ?? "Failed to update role");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(user: UserProfile) {
    setBusyId(user.id);
    try {
      const res = await djangoFetch(`/api/control/users/${user.id}/toggle/`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: data.is_active } : u))
        );
        toast(data.is_active ? "User reactivated" : "User suspended");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.detail ?? "Failed to update user");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVerified(user: UserProfile) {
    setBusyId(user.id);
    try {
      const res = await djangoFetch(`/api/control/users/${user.id}/verify/`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_verified: data.is_verified } : u))
        );
        toast(data.is_verified ? "User verified" : "Verification removed");
      } else {
        toast("Failed to update verification");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Users</h1>
        <span className="text-sm text-slate-500">{users.length} results</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search email or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Username</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No users match this filter.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-50 last:border-0">
                <td
                  className="px-4 py-2.5 font-mono text-xs text-slate-400"
                  title={user.id}
                >
                  {user.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-2.5 text-slate-900">
                  <div className="flex items-center gap-1.5">
                    {user.email}
                    {user.is_verified && (
                      <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    )}
                  </div>
                  {!user.is_active && (
                    <span className="mt-0.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                      Suspended
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{user.username}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={user.role}
                    disabled={busyId === user.id}
                    onChange={(e) => changeRole(user, e.target.value as Role)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium capitalize outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toggleVerified(user)}
                      disabled={busyId === user.id}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                        user.is_verified
                          ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {user.is_verified ? (
                        <><ShieldCheck className="h-3.5 w-3.5" /> Verified</>
                      ) : (
                        <><ShieldOff className="h-3.5 w-3.5" /> Verify</>
                      )}
                    </button>
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={busyId === user.id}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                        user.is_active
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {user.is_active ? (
                        <><XCircle className="h-3.5 w-3.5" /> Suspend</>
                      ) : (
                        <><CheckCircle className="h-3.5 w-3.5" /> Reactivate</>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
