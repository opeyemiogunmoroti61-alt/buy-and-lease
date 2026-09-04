"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { djangoFetch } from "@/utils/django/client";
import {
  Users, Building2, ShieldCheck, Home, TrendingUp,
  AlertTriangle, Crown, RefreshCw, CheckCircle,
} from "lucide-react";

interface Stats {
  total_users: number;
  landlords: number;
  agents: number;
  seekers: number;
  admins: number;
  total_listings: number;
  active_listings: number;
  pending_listings: number;
}

interface PendingListing {
  id: number;
  address: string | null;
  price: number | null;
  created_by_email: string | null;
}

export default function ControlOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        djangoFetch("/api/control/stats/"),
        djangoFetch("/api/control/listings/?active=false&ordering=-created_at"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        const list = Array.isArray(data) ? data : data.results ?? [];
        setPending(list.slice(0, 5));
      }
    } catch {
      toast("Failed to load overview — is Django running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: number) {
    setBusyId(id);
    try {
      const res = await djangoFetch(`/api/control/listings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ active: true }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((l) => l.id !== id));
        setStats((prev) =>
          prev
            ? { ...prev, active_listings: prev.active_listings + 1, pending_listings: prev.pending_listings - 1 }
            : prev
        );
        toast("Listing approved — now live");
      } else {
        toast("Failed to approve listing");
      }
    } finally {
      setBusyId(null);
    }
  }

  const cards = stats
    ? [
        { icon: Users, label: "Total Users", value: stats.total_users, color: "bg-blue-50 text-blue-600" },
        { icon: Building2, label: "Landlords", value: stats.landlords, color: "bg-indigo-50 text-indigo-600" },
        { icon: ShieldCheck, label: "Agents", value: stats.agents, color: "bg-violet-50 text-violet-600" },
        { icon: Home, label: "Seekers", value: stats.seekers, color: "bg-emerald-50 text-emerald-600" },
        { icon: TrendingUp, label: "Total Listings", value: stats.total_listings, color: "bg-slate-50 text-slate-600" },
        { icon: CheckCircle, label: "Active Listings", value: stats.active_listings, color: "bg-emerald-50 text-emerald-600" },
        { icon: AlertTriangle, label: "Pending Review", value: stats.pending_listings, color: "bg-amber-50 text-amber-600" },
        { icon: Crown, label: "Admins", value: stats.admins, color: "bg-red-50 text-red-600" },
      ]
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Overview</h1>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className="py-16 text-center text-slate-400">Loading…</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pending Review ({stats?.pending_listings ?? 0})
            </h2>

            {pending.length === 0 ? (
              <p className="text-sm text-slate-400">No listings pending review.</p>
            ) : (
              <div className="space-y-3">
                {pending.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {listing.address ?? `Listing #${listing.id}`}
                        <span className="ml-2 font-mono text-xs font-normal text-slate-400">
                          #{listing.id}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {listing.price != null ? `₦${Number(listing.price).toLocaleString()}` : "No price"}
                        {listing.created_by_email && <> · Posted by {listing.created_by_email}</>}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <Link
                        href={`/properties/${listing.id}`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => approve(listing.id)}
                        disabled={busyId === listing.id}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
                <Link
                  href="/control/listings"
                  className="block pt-1 text-right text-sm font-medium text-indigo-600 hover:underline"
                >
                  View all listings →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
