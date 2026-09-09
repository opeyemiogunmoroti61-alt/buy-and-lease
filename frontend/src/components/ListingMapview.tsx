'use client'
import { useEffect, useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Search, MapPin, X } from 'lucide-react'
import FilterSection from './FilterSection'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'

// Dynamic import — Leaflet needs browser APIs
const MapContainer = dynamic(() => import('./MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-50 rounded-xl flex items-center justify-center border">
      <p className="text-gray-400 animate-pulse">Loading map...</p>
    </div>
  )
})

interface ListingImage { url: string; path: string }
interface Listing {
  id: number
  address: string
  coordinates?: { lat: number; lng: number }
  price: string
  price_per_night?: string | null
  min_nights?: number | null
  type: string
  property_type: string
  bedroom: string
  bathroom: string
  parking: string
  area: string
  images: ListingImage[]
  active: boolean
}

interface ListingMapviewProps {
  type: string
  initialBedroom?: string
  initialPropertyType?: string
}

// ── Listing card (left panel) ────────────────────────────────────────
function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images?.[0]?.url
  const isShortlet = listing.type === 'Shortlet'
  const price = isShortlet
    ? listing.price_per_night
      ? `₦${Number(listing.price_per_night).toLocaleString()}/night`
      : 'Rate on request'
    : listing.price
      ? `₦${Number(listing.price).toLocaleString()}`
      : 'Price on request'

  const badge =
    listing.type === 'Rent' ? { text: 'For Rent', color: 'bg-emerald-500' } :
    listing.type === 'Shortlet' ? { text: 'Shortlet', color: 'bg-amber-500' } :
    { text: 'For Sale', color: 'bg-indigo-600' }

  return (
    <Link href={`/properties/${listing.id}`}
      className="flex flex-col bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group border border-slate-100">

      {/* Image */}
      <div className="relative w-full h-48 bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={listing.address}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-slate-300 text-xs">No photo</span>
          </div>
        )}
        {/* Heart button */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:scale-110 transition-transform">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {/* Type badge */}
        {listing.type && (
          <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="font-extrabold text-slate-900 text-base leading-tight">{price}</p>
        {isShortlet && listing.min_nights && (
          <p className="text-xs text-amber-600 font-medium">{listing.min_nights} night minimum</p>
        )}
        {listing.property_type && (
          <p className="text-xs text-slate-400 font-medium">{listing.property_type}</p>
        )}
        <p className="text-xs text-slate-500 truncate">{listing.address}</p>

        {/* Icons row */}
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 mt-1">

          {/* Bedrooms */}
          <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-1.5">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V8a1 1 0 011-1h16a1 1 0 011 1v4M3 12h18M3 12v4m18-4v4M3 16h18M8 12V9h8v3"/>
            </svg>
            <span className="text-xs font-bold text-slate-700">{listing.bedroom ?? '—'}</span>
            <span className="text-[10px] text-slate-400">Beds</span>
          </div>

          {/* Bathrooms */}
          <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-1.5">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12V7a2 2 0 012-2h1V4"/>
            </svg>
            <span className="text-xs font-bold text-slate-700">{listing.bathroom ?? '—'}</span>
            <span className="text-[10px] text-slate-400">Baths</span>
          </div>

          {/* Parking */}
          <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-1.5">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17H5a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-3"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17v2m8-2v2M3 11h18"/>
              <circle cx="8" cy="17" r="1" fill="currentColor"/>
              <circle cx="16" cy="17" r="1" fill="currentColor"/>
            </svg>
            <span className="text-xs font-bold text-slate-700">{(listing as any).parking ?? '—'}</span>
            <span className="text-[10px] text-slate-400">Parking</span>
          </div>

        </div>
      </div>
    </Link>
  )
}

// ── Address search (replaces GoogleAddressSearch) ──────────────────────
interface NominatimResult { place_id: string; display_name: string; lat: string; lon: string }

function AddressSearchBar({
  onSearch,
  onCoordinates,
}: {
  onSearch: (query: string) => void
  onCoordinates: (coords: { lat: number; lng: number }) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setResults(data)
    } finally { setSearching(false) }
  }

  return (
    <div className="relative flex-1 max-w-md">
      <div className="flex items-center border rounded-lg overflow-hidden bg-white">
        <MapPin className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResults([]) }}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search by address or area..."
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); onSearch('') }}
            className="px-2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <li key={r.place_id}
              onClick={() => {
                setQuery(r.display_name)
                setResults([])
                onSearch(r.display_name)
                onCoordinates({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
              }}
              className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer border-b last:border-0 text-slate-700">
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────
function ListingMapview({ type, initialBedroom, initialPropertyType }: ListingMapviewProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 }) // Lagos default

  const [filters, setFilters] = useState({
    bedCount: initialBedroom || '',
    bathCount: '',
    parkingCount: '',
    homeType: initialPropertyType || 'All'
  })

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (type) params.set('type', type)
      if (filters.bedCount) params.set('bedroom', filters.bedCount)
      if (filters.bathCount) params.set('bathroom', filters.bathCount)
      if (filters.parkingCount) params.set('parking', filters.parkingCount)
      if (filters.homeType !== 'All') params.set('property_type', filters.homeType)

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/listings/?${params}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const results: Listing[] = Array.isArray(data) ? data : data.results || []

      // Filtering now happens server-side (Django applies type/bedroom/
      // bathroom/parking/property_type) — no client-side filtering needed.
      setListings(results)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery, type])

  useEffect(() => { fetchListings() }, [fetchListings])

  return (
    <div className="min-h-screen bg-white">
      {/* Search + Filter bar */}
      <div className="p-4 border-b sticky top-0 bg-white z-20 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap items-center">
          <AddressSearchBar
            onSearch={setSearchQuery}
            onCoordinates={setMapCenter}
          />
          <FilterSection
            onBedChange={(v) => setFilters(f => ({ ...f, bedCount: v }))}
            onBathChange={(v) => setFilters(f => ({ ...f, bathCount: v }))}
            onParkingChange={(v) => setFilters(f => ({ ...f, parkingCount: v }))}
            onHomeTypeChange={(v) => setFilters(f => ({ ...f, homeType: v }))}
          />
          <Button className="flex gap-2" onClick={fetchListings}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="container mx-auto px-4 pt-4">
          <p className="text-sm text-slate-500">
            {listings.length} {listings.length === 1 ? 'property' : 'properties'} found
            {type && <span> for <span className="font-semibold text-slate-700">{type === 'Sell' ? 'Buy' : type}</span></span>}
            {searchQuery && <span> matching <span className="font-semibold text-slate-700">{searchQuery}</span></span>}
          </p>
        </div>
      )}

      {/* Split view: listings + map */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: Listing cards */}
          <div className="w-full lg:w-1/2 overflow-y-auto h-[calc(100vh-200px)] no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                <p className="text-slate-400 text-sm">Finding properties...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="font-medium">No properties found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
            </div>
          </div>

          {/* Right: Map */}
          <div className="hidden lg:block lg:w-1/2">
            <div className="sticky top-24 h-[calc(100vh-150px)]">
              <MapContainer center={mapCenter} listings={listings} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ListingMapview
