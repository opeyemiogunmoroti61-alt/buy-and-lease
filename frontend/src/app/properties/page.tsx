import ListingMapview from '@/components/ListingMapview'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const first = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] ?? '' : v ?? ''

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">Property Listings</h1>
      <ListingMapview
        type={first(params.type)}
        initialBedroom={first(params.bedroom)}
        initialPropertyType={first(params.property_type)}
      />
    </div>
  )
}
