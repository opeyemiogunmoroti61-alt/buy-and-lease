"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { djangoFetch } from "@/utils/django/client";
import { CheckCircle, RotateCcw } from "lucide-react";

interface Report {
  id: number;
  listing_id: number;
  listing_address: string | null;
  reporter_email: string | null;
  reason: string;
  reason_display: string;
  details: string | null;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by_email: string | null;
}

export default function ControlReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "open") params.set("resolved", "false");
    if (filter === "resolved") params.set("resolved", "true");

    try {
      const res = await djangoFetch(`/api/control/listings/reports/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.results ?? []);
      } else {
        toast("Failed to load reports");
      }
    } catch {
      toast("Network error — is Django running?");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setResolved(report: Report, resolved: boolean) {
    setBusyId(report.id);
    try {
      const res = await djangoFetch(`/api/control/listings/reports/${report.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ resolved }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) =>
          filter === "all"
            ? prev.map((r) => (r.id === report.id ? updated : r))
            : prev.filter((r) => r.id !== report.id)
        );
        toast(resolved ? "Marked resolved" : "Reopened");
      } else {
        toast("Failed to update report");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Reports</h1>
        <span className="text-sm text-slate-500">{reports.length} results</span>
      </div>

      <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-0.5 w-fit">
        {(["open", "resolved", "all"] as const).map((f) => (
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

      <div className="space-y-3">
        {loading && <p className="py-8 text-center text-slate-400">Loading…</p>}
        {!loading && reports.length === 0 && (
          <p className="py-8 text-center text-slate-400">
            {filter === "open" ? "No open reports — nice." : "No reports match this filter."}
          </p>
        )}
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    {report.reason_display}
                  </span>
                  <Link
                    href={`/properties/${report.listing_id}`}
                    target="_blank"
                    className="text-sm font-semibold text-slate-800 hover:underline"
                  >
                    {report.listing_address ?? `Listing #${report.listing_id}`}
                  </Link>
                  <span className="font-mono text-xs text-slate-400">
                    #{report.listing_id}
                  </span>
                </div>
                {report.details && (
                  <p className="mt-1.5 text-sm text-slate-600">{report.details}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-400">
                  Reported by {report.reporter_email ?? "unknown"} ·{" "}
                  {new Date(report.created_at).toLocaleString()}
                  {report.resolved && report.resolved_by_email && (
                    <> · Resolved by {report.resolved_by_email}</>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0">
                {report.resolved ? (
                  <button
                    onClick={() => setResolved(report, false)}
                    disabled={busyId === report.id}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => setResolved(report, true)}
                    disabled={busyId === report.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
