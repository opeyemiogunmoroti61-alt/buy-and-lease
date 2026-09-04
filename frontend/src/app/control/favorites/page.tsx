"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { djangoFetch } from "@/utils/django/client";

interface FavoriteEntry {
  id: number;
  listing_id: number;
  listing_address: string | null;
  listing_price: number | null;
  user_email: string;
  created_at: string;
}

export default function ControlFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await djangoFetch("/api/control/listings/favorites/");
        if (res.ok) {
          const data = await res.json();
          setFavorites(Array.isArray(data) ? data : data.results ?? []);
        } else {
          toast("Failed to load favorites");
        }
      } catch {
        toast("Network error — is Django running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Favorites</h1>
        <span className="text-sm text-slate-500">{favorites.length} results</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-2.5 font-medium">Listing</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="px-4 py-2.5 font-medium">Saved By</th>
              <th className="px-4 py-2.5 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && favorites.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No favorites yet.
                </td>
              </tr>
            )}
            {favorites.map((f) => (
              <tr key={f.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/properties/${f.listing_id}`}
                    target="_blank"
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {f.listing_address ?? `#${f.listing_id}`}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {f.listing_price != null ? `₦${Number(f.listing_price).toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{f.user_email}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {new Date(f.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
