// src/app/properties/[id]/page.tsx
// Replaces Supabase client with Django API fetch

import { notFound } from 'next/navigation'
import { MapPin, BedDouble, Bath, Ruler, Home, Car, Calendar, Trees, DollarSign, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ListingSlider from '@/components/ListingSlider'
import ListingMap from '@/components/ListingMap'
import ReportListingButton from '@/components/ReportListingButton'
import HeartButton from '@/components/HeartButton'
import ContactOwnerButton from '@/components/ContactOwnerButton'


const formatPrice = (price: any) => {
  if (!price) return 'Price on request'
  return `₦${Number(price).toLocaleString()}`
}

async function getListing(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/listings/${id}/`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function ViewListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) return notFound()

  // Extract image URLs from Django's nested images array
  const allImages = (listing.images || []).map((img: any) => img.url).filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50/50 mt-20">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {listing.type && (
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  For {listing.type}
                </span>
              )}
              {listing.property_type && (
                <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {listing.property_type}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {listing.address || 'Property Listing'}
            </h1>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="h-4 w-4" />
              <span className="text-sm md:text-base font-medium">
                {listing.address || 'Address available upon request'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <Share2 className="h-4 w-4 text-slate-600" />
            </Button>
            <HeartButton listingId={listing.id} />
          </div>
        </div>

        {/* IMAGE SLIDER */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-white">
          <ListingSlider images={allImages} />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: BedDouble, value: listing.bedroom, label: 'Bedrooms' },
                { icon: Bath, value: listing.bathroom, label: 'Bathrooms' },
                { icon: Car, value: listing.parking, label: 'Parking' },
                { icon: Ruler, value: listing.area, label: 'Sq Ft' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                  <Icon className="h-6 w-6 text-indigo-500 mb-2" />
                  <span className="font-bold text-lg text-slate-800">{value || 'N/A'}</span>
                  <span className="text-xs text-slate-400 uppercase font-bold">{label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-900">About this property</h2>
                <p className="text-slate-600 leading-7 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Property Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-slate-900">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <DetailRow icon={Home} label="Property Type" value={listing.property_type} />
                <DetailRow icon={Calendar} label="Year Built" value={listing.built_in} />
                <DetailRow icon={Trees} label="Lot Size" value={listing.lot_size ? `${listing.lot_size} sqft` : null} />
                <DetailRow icon={DollarSign} label="HOA Fees" value={listing.hoa ? `₦${listing.hoa}/mo` : 'None'} />
              </div>
            </div>

            <ListingMap
              coordinates={listing.coordinates}
              address={listing.address}
              listing={listing}
            />

            <div className="flex justify-center pt-2">
              <ReportListingButton listingId={listing.id} />
            </div>

          </div>

          {/* RIGHT COLUMN — Sticky Price Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wide">Listing Price</p>
                  <h2 className="text-4xl font-extrabold text-slate-900">{formatPrice(listing.price)}</h2>
                </div>
                <div className="space-y-3">
                  <ContactOwnerButton listingId={listing.id} posterRole={listing.poster_role} />
                  <Button variant="outline" className="w-full h-12 text-base font-semibold border-slate-300 hover:bg-slate-50">
                    Schedule Viewing
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3 text-slate-500">
        <Icon className="h-5 w-5 text-indigo-500/80" />
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-semibold text-slate-800">{value || 'N/A'}</span>
    </div>
  )
}
