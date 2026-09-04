"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { djangoFetch } from "@/utils/django/client";

export default function ContactOwnerButton({
  listingId,
  posterRole,
}: {
  listingId: number;
  posterRole?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: user?.username ?? "",
    email: user?.email ?? "",
    phone: "",
    message: "",
  });

  const label = posterRole === "agent" ? "Contact Agent" : "Contact Landlord";

  async function submit() {
    if (!form.name || !form.email || !form.message) {
      toast.error("Name, email, and a message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await djangoFetch(`/api/listings/${listingId}/inquire/`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Message sent!");
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.detail ?? "Failed to send. Try again.");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button
        className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
    );
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-medium text-emerald-800">
          Message sent — the {posterRole === "agent" ? "agent" : "landlord"} will reach out to you directly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <input
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="Your name"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <input
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="Your email"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <input
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        placeholder="Phone (optional)"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <textarea
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        placeholder="I'm interested in this property..."
        rows={3}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <div className="flex gap-2">
        <Button
          onClick={submit}
          disabled={submitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {submitting ? "Sending…" : "Send Message"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
