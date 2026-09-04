"use client";
import ProtectedRouteWithRole from "@/components/ProtectedRouteWithRole";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader, Plus, Home, Eye, Edit, Edit2,
  TrendingUp, Building2, CheckCircle, Clock
} from "lucide-react";
import { djangoFetch } from "@/utils/django/client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ── Nominatim Address Search ──────────────────────────────────────────────────
interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

function AddressSearch({
  onSelect,
}: {
  onSelect: (address: string, coords: { lat: number; lng: number }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setResults(data);
    } catch {
      toast("Address search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search address..."
          className="flex-1 p-2 border rounded-md text-sm"
        />
        <Button onClick={search} disabled={searching} type="button">
          {searching ? <Loader className="animate-spin w-4 h-4" /> : "Search"}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="border rounded-md shadow-sm bg-white max-h-52 overflow-y-auto z-10 relative">
          {results.map((r) => (
            <li
              key={r.place_id}
              className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer border-b last:border-0"
              onClick={() => {
                onSelect(r.display_name, {
                  lat: parseFloat(r.lat),
                  lng: parseFloat(r.lon),
                });
                setResults([]);
                setQuery(r.display_name);
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Listing interface ─────────────────────────────────────────────────────────
interface Listing {
  id: number;
  address: string;
  price: string;
  type: string;
  property_type: string;
  bedroom: string;
  bathroom: string;
  parking: string;
  active: boolean;
  images: { url: string }[];
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const LandlordDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"overview" | "add">("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loader, setLoader] = useState(false);

  // Fetch landlord's own listings
  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const res = await djangoFetch("/api/listings/mine/");
        if (res.ok) {
          const data = await res.json();
          setListings(Array.isArray(data) ? data : data.results || []);
        }
      } catch {
        toast("Failed to load listings");
      } finally {
        setLoadingListings(false);
      }
    };
    fetchMyListings();
  }, []);

  const nextHandler = async () => {
    if (!selectedAddress || !coordinates) return;
    setLoader(true);
    try {
      const res = await djangoFetch("/api/listings/", {
        method: "POST",
        body: JSON.stringify({ address: selectedAddress, coordinates }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Listing created!");
        router.push(`/dashboard/edit-listing/${data.id}`);
      } else {
        toast(data?.detail || "Error creating listing");
      }
    } catch {
      toast("Network error — is Django running?");
    } finally {
      setLoader(false);
    }
  };

  const activeListings = listings.filter((l) => l.active).length;
  const draftListings = listings.filter((l) => !l.active).length;

  return (
    <ProtectedRouteWithRole>
      <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Welcome back, {user?.username || "Landlord"} 👋
              </h1>
              <p className="text-slate-500 mt-1">Manage your property listings</p>
            </div>
            <Button
              onClick={() => setView(view === "add" ? "overview" : "add")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {view === "add" ? (
                <><Building2 className="w-4 h-4" /> View My Listings</>
              ) : (
                <><Plus className="w-4 h-4" /> Add New Property</>
              )}
            </Button>
          </div>

          {/* ── Stats Row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Building2, label: "Total Listings", value: listings.length, color: "bg-indigo-50 text-indigo-600" },
              { icon: CheckCircle, label: "Active", value: activeListings, color: "bg-emerald-50 text-emerald-600" },
              { icon: Clock, label: "Drafts", value: draftListings, color: "bg-amber-50 text-amber-600" },
              { icon: TrendingUp, label: "Views", value: "—", color: "bg-violet-50 text-violet-600" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Add Property Form ─────────────────────────────────────────── */}
          {view === "add" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Add New Listing</h2>
              <p className="text-slate-500 text-sm mb-6">
                Search and select the address of the property you want to list
              </p>
              <div className="max-w-lg space-y-4">
                <AddressSearch
                  onSelect={(address, coords) => {
                    setSelectedAddress(address);
                    setCoordinates(coords);
                  }}
                />
                {selectedAddress && (
                  <p className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {selectedAddress}
                  </p>
                )}
                <Button
                  disabled={!selectedAddress || !coordinates || loader}
                  onClick={nextHandler}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loader ? <Loader className="animate-spin" /> : "Next — Fill in Property Details"}
                </Button>
              </div>
            </div>
          )}

          {/* ── My Listings Grid ──────────────────────────────────────────── */}
          {view === "overview" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">My Listings</h2>
                <Link
                  href="/properties"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View public listings →
                </Link>
              </div>

              {loadingListings ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h3 className="font-bold text-slate-700 mb-2">No listings yet</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Add your first property to get started
                  </p>
                  <Button
                    onClick={() => setView("add")}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Property
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group"
                    >
                      {/* Image */}
                      <div className="relative h-44 bg-slate-100">
                        {listing.images?.[0]?.url ? (
                          <Image
                            src={listing.images[0].url}
                            alt={listing.address}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-10 h-10 text-slate-300" />
                          </div>
                        )}
                        {/* Status badge */}
                        <span
                          className={`absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full text-white
                            ${listing.active ? "bg-emerald-500" : "bg-amber-500"}`}
                        >
                          {listing.active ? "Active" : "Draft"}
                        </span>
                        {/* Type badge */}
                        {listing.type && (
                          <span className="absolute top-2 right-2 text-xs font-bold px-2.5 py-1 rounded-full text-white bg-indigo-600">
                            {listing.type === "Rent" ? "For Rent" : "For Sale"}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <p className="font-bold text-indigo-600 text-lg">
                          {listing.price
                            ? `₦${Number(listing.price).toLocaleString()}`
                            : "Price not set"}
                        </p>
                        {listing.property_type && (
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            {listing.property_type}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 truncate">{listing.address}</p>

                        {/* Stats */}
                        <div className="flex gap-3 text-xs text-slate-500">
                          {listing.bedroom && <span>🛏 {listing.bedroom} bd</span>}
                          {listing.bathroom && <span>🚿 {listing.bathroom} ba</span>}
                          {listing.parking && <span>🚗 {listing.parking} pk</span>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <Link
                            href={`/properties/${listing.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-slate-200 rounded-xl py-2 hover:bg-slate-50 transition-colors font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <Link
                            href={`/dashboard/edit-listing/${listing.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-indigo-600 text-white rounded-xl py-2 hover:bg-indigo-700 transition-colors font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </ProtectedRouteWithRole>
  );
};

export default LandlordDashboard;