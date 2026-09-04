'use client'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { BedDouble, Bath, Ruler } from 'lucide-react'

interface ListingImage {
    id: string;
    url: string;
    listing_id: string;
    created_at?: string;
}

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: 'new' | 'used' | 'refurbished';
    location: string;
    address?: string;
    bedroom?: number;
    bathroom?: number;
    area?: string;
    image_urls: string[];
    listingimages?: ListingImage[]; // This is optional
    user_id: string;
    created_at: string;
    updated_at: string;
    status: 'active' | 'inactive' | 'sold';
}

interface ListingComponentProps {
    listings: Listing[];
}

function Listing({ listings }: ListingComponentProps) {
    if (!listings || listings.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No listings found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Available Properties ({listings.length})</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listings.map((listing) => {
                    // Get the first available image URL
                    const firstImageUrl = listing.listingimages?.[0]?.url ||
                        listing.image_urls?.[0] ||
                        null;

                    return (
                        <div key={listing.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                            {/* Listing Image with proper null checks */}
                            <div className="relative h-48 w-full">
                                {firstImageUrl ? (
                                    <Image
                                        src={firstImageUrl}
                                        alt={listing.title || 'Property image'}
                                        fill
                                        className="object-cover"
                                        unoptimized={true}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = '/placeholder-property.jpg';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 text-sm">No Image Available</span>
                                    </div>
                                )}
                            </div>

                            {/* Listing Details */}
                            <div className="p-4 flex flex-col gap-2">
                                <h2 className="font-bold text-xl">
                                    {listing.price ? `$${listing.price.toLocaleString()}` : 'N/A'}
                                </h2>

                                <h2 className="flex gap-2 text-sm text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                    {listing.address || listing.location || 'Address not available'}
                                </h2>

                                <div className="flex gap-2 items-center">
                                    <h2 className="flex gap-2 text-sm bg-slate-200 rounded-md p-2 w-full text-gray-500 justify-center">
                                        <BedDouble className='h-4 w-4' />
                                        {listing?.bedroom ?? 'N/A'}
                                    </h2>
                                    <h2 className="flex gap-2 text-sm bg-slate-200 rounded-md p-2 w-full text-gray-500 justify-center">
                                        <Bath className='h-4 w-4' />
                                        {listing?.bathroom ?? 'N/A'}
                                    </h2>
                                    <h2 className="flex gap-2 text-sm bg-slate-200 rounded-md p-2 w-full text-gray-500 justify-center">
                                        <Ruler className='h-4 w-4' />
                                        {listing?.area ?? 'N/A'}
                                    </h2>
                                </div>

                                <h3 className="font-semibold text-lg mt-2">{listing.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2">{listing.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default Listing