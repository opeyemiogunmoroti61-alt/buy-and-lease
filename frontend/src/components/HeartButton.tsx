"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { djangoFetch } from "@/utils/django/client";

export default function HeartButton({ listingId }: { listingId: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // On mount, check whether this listing is already in the user's
  // saved list — only bother if they're logged in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await djangoFetch("/api/listings/favorites/mine/");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results ?? [];
        if (!cancelled) {
          setFavorited(list.some((f: any) => f.listing_id === listingId));
        }
      } catch {
        // fail silently — heart just starts unfilled
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, listingId]);

  async function handleClick() {
    if (!user) {
      toast("Sign in to save listings");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await djangoFetch(`/api/listings/${listingId}/favorite/`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
        toast(data.favorited ? "Saved to your listings" : "Removed from saved");
      } else {
        toast.error("Failed to update — try again");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="icon" className="rounded-full" onClick={handleClick} disabled={loading}>
      <Heart
        className={`h-4 w-4 transition-colors ${
          favorited ? "fill-red-500 text-red-500" : "text-slate-600"
        }`}
      />
    </Button>
  );
}
