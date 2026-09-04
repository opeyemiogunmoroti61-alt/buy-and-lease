'use client'
import { useEffect, useRef } from 'react'

interface ListingLocation {
  id: string | number
  coordinates?: { lat: number; lng: number }
  address?: string
  price?: string | number
}

interface MapContainerProps {
  center?: { lat: number; lng: number }
  listings: ListingLocation[]
}

const MapContainer = ({ center, listings }: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  const defaultCenter = { lat: 6.5244, lng: 3.3792 } // Lagos, Nigeria
  const mapCenter = center?.lat ? center : defaultCenter

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamically import Leaflet (SSR-safe)
    import('leaflet').then((L) => {
      // Fix Leaflet default marker icon path issue in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Destroy existing map instance before creating a new one
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapRef.current!).setView(
        [mapCenter.lat, mapCenter.lng], 14
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add markers for each listing with coordinates
      listings.forEach((listing) => {
        if (listing.coordinates?.lat && listing.coordinates?.lng) {
          const price = listing.price
            ? `₦${Number(listing.price).toLocaleString()}`
            : ''

          const popup = L.popup().setContent(`
            <div style="min-width:160px">
              ${price ? `<p style="font-weight:700;font-size:15px;color:#4f46e5;margin:0 0 4px">${price}</p>` : ''}
              <p style="font-size:12px;color:#64748b;margin:0">${listing.address || 'View property'}</p>
            </div>
          `)

          L.marker([listing.coordinates.lat, listing.coordinates.lng])
            .bindPopup(popup)
            .addTo(map)
        }
      })

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapCenter.lat, mapCenter.lng, listings])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden z-0" />
    </>
  )
}

export default MapContainer