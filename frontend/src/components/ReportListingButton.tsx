"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { djangoFetch } from "@/utils/django/client";

const REASONS = [
  { value: "wrong_status", label: "Marked as available but isn't" },
  { value: "fraud", label: "Suspected fraud or fake listing" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
] as const;

export default function ReportListingButton({ listingId }: { listingId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await djangoFetch(`/api/listings/${listingId}/report/`, {
        method: "POST",
        body: JSON.stringify({ reason, details }),
      });
      if (res.ok) {
        toast.success("Report submitted — thank you for flagging this.");
        setOpen(false);
        setDetails("");
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.detail ?? "Failed to submit report.");
      }
    } catch {
      toast.error("Network error — is Django running?");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-800">Report this listing</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Any extra details (optional)"
        rows={3}
        className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit report"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
