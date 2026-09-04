'use client'
// src/components/ListingMap.tsx
// Wraps MapContainer in a client component so ssr:false works in a server page

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

const MapContainer = dynamic(() => import('@/components/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center text-slate-400 rounded-xl">
      <span className="animate-pulse">Loading map...</span>
    </div>
  )
})

interface ListingMapProps {
  coordinates?: { lat: number; lng: number }
  address?: string
  listing: any
}

export default function ListingMap({ coordinates, address, listing }: ListingMapProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Location</h2>
      </div>
      <div className="h-[400px] w-full relative z-0">
        <MapContainer
          listings={[listing]}
          center={coordinates}
        />
      </div>
      <div className="bg-slate-50 p-4 md:p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
          <MapPin className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Property Address</p>
          <p className="font-semibold text-slate-800 text-lg leading-tight">
            {address || 'Address details not available'}
          </p>
        </div>
      </div>
    </div>
  )
}