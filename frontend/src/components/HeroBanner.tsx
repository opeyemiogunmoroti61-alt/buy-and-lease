'use client';

import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export default function HeroBanner() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setResults(data);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (result: NominatimResult) => {
    setSelected(result.display_name);
    setQuery(result.display_name);
    setResults([]);
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/listings?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600 rounded-full blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          Nigeria&apos;s Fastest Growing Property Platform
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
          Find Your
          <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Perfect Home
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Browse thousands of verified listings. Buy, rent, or sell properties across Nigeria with confidence.
        </p>

        {/* Search box */}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 gap-2 shadow-2xl">
            <MapPin className="ml-3 w-5 h-5 text-indigo-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Search by city, neighbourhood or address..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base py-3 px-2"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setSelected(null); }}
                className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={selected ? handleSearch : search}
              disabled={searching}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Dropdown results */}
          {results.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {results.map((r) => (
                <li
                  key={r.place_id}
                  onClick={() => handleSelect(r)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-indigo-600/20 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  {r.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-10 mt-14 text-slate-400 text-sm">
          {[
            { value: '10K+', label: 'Active Listings' },
            { value: '5K+', label: 'Happy Tenants' },
            { value: '2K+', label: 'Verified Landlords' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}