"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { djangoFetch } from "@/utils/django/client";

type Status = "available" | "rented" | "sold";

interface Listing {
  id: number;
  address: string | null;
  full_name: string | null;
  created_by_email: string | null;
  poster_role: string | null;
  active: boolean;
  status: Status;
  type: string | null;
  property_type: string | null;
  price: number | null;
  created_at: string;
}

const STATUSES: Status[] = ["available", "rented", "sold"];

const STATUS_STYLES: Record<Status, string> = {
  available: "bg-emerald-50 text-emerald-700",
  rented: "bg-blue-50 text-blue-700",
  sold: "bg-slate-100 text-slate-600",
};

export default function ControlListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "active") params.set("active", "true");
    if (filter === "inactive") params.set("active", "false");
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);

    try {
      const res = await djangoFetch(`/api/control/listings/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : data.results ?? []);
      } else {
        toast("Failed to load listings");
      }
    } catch {
      toast("Network error — is Django running?");
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(listing: Listing) {
    setBusyId(listing.id);
    try {
      const res = await djangoFetch(`/api/control/listings/${listing.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ active: !listing.active }),
      });
      if (res.ok) {
        setListings((prev) =>
          prev.map((l) => (l.id === listing.id ? { ...l, active: !l.active } : l))
        );
        toast(listing.active ? "Listing deactivated" : "Listing activated");
      } else {
        toast("Failed to update listing");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(listing: Listing, newStatus: Status) {
    setBusyId(listing.id);
    try {
      const res = await djangoFetch(`/api/control/listings/${listing.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setListings((prev) =>
          prev.map((l) => (l.id === listing.id ? { ...l, status: newStatus } : l))
        );
        toast(`Marked as ${newStatus}`);
      } else {
        toast("Failed to update status");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeListing(listing: Listing) {
    if (!confirm(`Delete listing #${listing.id} "${listing.address ?? ""}"? This can't be undone.`)) {
      return;
    }
    setBusyId(listing.id);
    try {
      const res = await djangoFetch(`/api/control/listings/${listing.id}/`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setListings((prev) => prev.filter((l) => l.id !== listing.id));
        toast("Listing deleted");
      } else {
        toast("Failed to delete listing");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Listings</h1>
        <span className="text-sm text-slate-500">{listings.length} results</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm capitalize outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Any market status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search address, description, name…"
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
              <th className="px-4 py-2.5 font-medium">Address</th>
              <th className="px-4 py-2.5 font-medium">Poster</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="px-4 py-2.5 font-medium">Approval</th>
              <th className="px-4 py-2.5 font-medium">Market Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && listings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No listings match this filter.
                </td>
              </tr>
            )}
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-400">#{listing.id}</td>
                <td className="px-4 py-2.5 text-slate-900">{listing.address ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  <div>{listing.created_by_email ?? "—"}</div>
                  {listing.poster_role && (
                    <div className="text-xs text-slate-400 capitalize">
                      {listing.poster_role}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{listing.type ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {listing.price != null ? `₦${Number(listing.price).toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {listing.active ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={listing.status}
                    disabled={busyId === listing.id}
                    onChange={(e) => changeStatus(listing, e.target.value as Status)}
                    className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium capitalize outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 ${STATUS_STYLES[listing.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toggleActive(listing)}
                      disabled={busyId === listing.id}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {listing.active ? "Unapprove" : "Approve"}
                    </button>
                    <button
                      onClick={() => removeListing(listing)}
                      disabled={busyId === listing.id}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
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
