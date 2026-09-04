"use client";
import ProtectedRouteWithRole from "@/components/ProtectedRouteWithRole";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Search, Heart, Home, MapPin, BedDouble,
  Bath, Car, ArrowRight, SlidersHorizontal
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Listing {
  id: number;
  address: string;
  price: string;
  type: string;
  property_type: string;
  bedroom: string;
  bathroom: string;
  parking: string;
  area: string;
  active: boolean;
  images: { url: string }[];
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({
  listing,
  saved,
  onToggleSave,
}: {
  listing: Listing;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const image = listing.images?.[0]?.url;
  const price = listing.price
    ? `₦${Number(listing.price).toLocaleString()}`
    : "Price on request";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
      {/* Image */}
      <div className="relative h-48 bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={listing.address}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Home className="w-10 h-10 text-slate-300" />
          </div>
        )}
        {/* Type badge */}
        {listing.type && (
          <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full
            ${listing.type === "Rent" ? "bg-emerald-500" : "bg-indigo-600"}`}>
            {listing.type === "Rent" ? "For Rent" : "For Sale"}
          </span>
        )}
        {/* Save / Heart button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleSave(); }}
          className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform">
          <Heart className={`w-4 h-4 transition-colors
            ${saved ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="font-extrabold text-slate-900 text-lg">{price}</p>
        {listing.property_type && (
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {listing.property_type}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{listing.address}</span>
        </div>

        {/* Stats icons */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
          <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-2">
            <BedDouble className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700">{listing.bedroom ?? "—"}</span>
            <span className="text-[10px] text-slate-400">Beds</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-2">
            <Bath className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700">{listing.bathroom ?? "—"}</span>
            <span className="text-[10px] text-slate-400">Baths</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-2">
            <Car className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700">{listing.parking ?? "—"}</span>
            <span className="text-[10px] text-slate-400">Parking</span>
          </div>
        </div>

        <Link
          href={`/properties/${listing.id}`}
          className="block w-full text-center text-sm font-semibold bg-indigo-600 text-white rounded-xl py-2.5 mt-1 hover:bg-indigo-700 transition-colors">
          View Details
        </Link>
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 bg-slate-200 rounded-lg" />
          <div className="h-12 bg-slate-200 rounded-lg" />
          <div className="h-12 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-9 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const TenantDashboard = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "rent" | "sale" | "saved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load saved listings from localStorage
  const [saved, setSaved] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("saved_listings") || "[]");
    }
    return [];
  });

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/listings/`
        );
        const data = await res.json();
        setListings(Array.isArray(data) ? data : data.results || []);
      } catch {
        console.error("Failed to fetch listings");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const toggleSave = (id: number) => {
    const updated = saved.includes(id)
      ? saved.filter((s) => s !== id)
      : [...saved, id];
    setSaved(updated);
    localStorage.setItem("saved_listings", JSON.stringify(updated));
  };

  // Filter listings based on tab and search
  const filteredListings = listings.filter((l) => {
    const matchesTab =
      activeTab === "all" ? true :
      activeTab === "rent" ? l.type === "Rent" :
      activeTab === "sale" ? l.type === "Sell" :
      activeTab === "saved" ? saved.includes(l.id) :
      true;

    const matchesSearch = searchQuery
      ? l.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.property_type?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesTab && matchesSearch;
  });

  const rentCount = listings.filter(l => l.type === "Rent").length;
  const saleCount = listings.filter(l => l.type === "Sell").length;

  return (
    <ProtectedRouteWithRole>
      <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Welcome Header ──────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-8 text-white">
            <h1 className="text-3xl font-black mb-1">
              Welcome back, {user?.username || "there"} 👋
            </h1>
            <p className="text-indigo-200 mb-6">
              Find your perfect home from our verified listings
            </p>
            {/* Search bar */}
            <div className="flex gap-3 max-w-xl">
              <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by address or property type..."
                  className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
                />
              </div>
              <Link href="/properties">
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold flex items-center gap-2 h-full px-5">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stats Row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "All Properties", value: listings.length, color: "border-l-indigo-500", tab: "all" as const },
              { label: "For Rent", value: rentCount, color: "border-l-emerald-500", tab: "rent" as const },
              { label: "For Sale", value: saleCount, color: "border-l-violet-500", tab: "sale" as const },
              { label: "Saved", value: saved.length, color: "border-l-rose-500", tab: "saved" as const },
            ].map(({ label, value, color, tab }) => (
              <button
                key={label}
                onClick={() => setActiveTab(tab)}
                className={`bg-white rounded-2xl p-5 border border-slate-100 border-l-4 shadow-sm text-left
                  transition-all hover:shadow-md ${color}
                  ${activeTab === tab ? "ring-2 ring-indigo-200" : ""}`}
              >
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </button>
            ))}
          </div>

          {/* ── Browse by Type shortcuts ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("rent")}
              className="group bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between hover:bg-emerald-100 transition-colors">
              <div>
                <p className="font-bold text-emerald-800 text-lg">For Rent</p>
                <p className="text-emerald-600 text-sm">{rentCount} properties available</p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setActiveTab("sale")}
              className="group bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center justify-between hover:bg-indigo-100 transition-colors">
              <div>
                <p className="font-bold text-indigo-800 text-lg">For Sale</p>
                <p className="text-indigo-600 text-sm">{saleCount} properties available</p>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            {/* Tab headers */}
            <div className="flex border-b border-slate-100 px-6">
              {[
                { key: "all", label: "All Properties" },
                { key: "rent", label: "For Rent" },
                { key: "sale", label: "For Sale" },
                { key: "saved", label: `Saved (${saved.length})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`py-4 px-4 text-sm font-semibold border-b-2 transition-colors
                    ${activeTab === key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === "saved"
                      ? <Heart className="w-8 h-8 text-slate-300" />
                      : <Home className="w-8 h-8 text-slate-300" />
                    }
                  </div>
                  <h3 className="font-bold text-slate-700 mb-1">
                    {activeTab === "saved" ? "No saved properties yet" : "No properties found"}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {activeTab === "saved"
                      ? "Click the heart icon on any listing to save it here"
                      : searchQuery
                        ? "Try a different search term"
                        : "Check back later for new listings"
                    }
                  </p>
                  {activeTab === "saved" && (
                    <Button
                      onClick={() => setActiveTab("all")}
                      className="bg-indigo-600 hover:bg-indigo-700">
                      Browse Listings
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      saved={saved.includes(listing.id)}
                      onToggleSave={() => toggleSave(listing.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRouteWithRole>
  );
};

export default TenantDashboard;