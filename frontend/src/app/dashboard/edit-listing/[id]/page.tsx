"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { use } from 'react'
import FileUpload from '@/components/FileUpload'
import { Formik } from 'formik'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader, Save, Eye, ArrowLeft, CheckCircle } from "lucide-react"
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { djangoFetch } from '@/utils/django/client'
import { useAuth } from '@/context/AuthContext'

type ListingImage = {
    id?: number
    url: string
    path: string
    created_at?: string
}

interface Listing {
    id: string
    type: string
    property_type: string
    bedroom: string
    bathroom: string
    built_in: string
    parking: string
    lot_size: string
    area: string
    price: string
    hoa: string
    description: string
    active: boolean
    address: string
    coordinates: { lat: number; lng: number }
    images: ListingImage[]
    created_by_email: string
    full_name?: string
    profile_image?: string
    [key: string]: unknown
}

interface ListingFormValues {
    type: string
    propertyType: string
    bedroom: string
    bathroom: string
    builtIn: string
    parking: string
    lotSize: string
    area: string
    price: string
    hoa: string
    description: string
}

function EditListing({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const { user, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [listing, setListing] = useState<Listing | null>(null)
    const [images, setImages] = useState<File[]>([])

    // ── Fetch listing ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return
        if (!user) { router.replace('/login'); return }
        if (!id) return

        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await djangoFetch(`/api/listings/${id}/`)
                if (!res.ok) { router.replace('/dashboard/landlord'); return }
                const data = await res.json()

                if (data.created_by_email !== user.email) {
                    toast.error('Unauthorized — this is not your listing')
                    router.replace('/dashboard/landlord')
                    return
                }
                setListing(data)
            } catch {
                toast.error('Failed to load listing')
                router.replace('/dashboard/landlord')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, router, user, authLoading])

    // ── Upload images ─────────────────────────────────────────────────────────
    const uploadImages = async (): Promise<boolean> => {
        if (!images.length) return true
        let allOk = true

        for (const image of images) {
            try {
                const formData = new FormData()
                formData.append('image', image)
                formData.append('listing_id', id)
                const token = localStorage.getItem('access_token')
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/listings/${id}/images/`,
                    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
                )
                if (!res.ok) {
                    const err = await res.json()
                    toast.error(`Failed to upload ${image.name}: ${err.detail || ''}`)
                    allOk = false
                }
            } catch {
                toast.error(`Failed to upload ${image.name}`)
                allOk = false
            }
        }
        return allOk
    }

    // ── Delete image ──────────────────────────────────────────────────────────
    const handleDeleteImage = async (path: string) => {
        const res = await djangoFetch(`/api/listings/images/${encodeURIComponent(path)}/`, {
            method: 'DELETE',
        })
        if (res.ok) {
            setListing(prev => prev ? {
                ...prev,
                images: prev.images.filter(img => img.path !== path)
            } : null)
        } else {
            throw new Error('Delete failed')
        }
    }

    // ── SAVE AS DRAFT (active stays false) ────────────────────────────────────
    const onSubmitHandler = async (formValue: ListingFormValues) => {
        setSaving(true)
        try {
            // 1. Upload images first
            await uploadImages()

            // 2. Save form fields — does NOT change active status
            const payload = {
                type: formValue.type,
                property_type: formValue.propertyType,
                bedroom: formValue.bedroom || null,
                bathroom: formValue.bathroom || null,
                built_in: formValue.builtIn || null,
                parking: formValue.parking || null,
                lot_size: formValue.lotSize || null,
                area: formValue.area || null,
                price: formValue.price || null,
                hoa: formValue.hoa || null,
                description: formValue.description || null,
            }

            const res = await djangoFetch(`/api/listings/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const err = await res.json()
                const errMsg = err.detail ||
                    Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(', ')
                toast.error(errMsg || 'Failed to save listing')
                return
            }

            const updated = await res.json()
            setListing(updated)
            setImages([]) // Clear pending uploads
            toast.success('Draft saved! Tenants cannot see this yet.')
            // Stay on page — landlord may want to continue editing
        } catch {
            toast.error('Failed to save listing')
        } finally {
            setSaving(false)
        }
    }

    // ── SAVE & PUBLISH (sets active=true) ────────────────────────────────────
    const publishBtnHandler = async (formValues: ListingFormValues) => {
        setPublishing(true)
        try {
            // 1. Upload images
            await uploadImages()

            // 2. Save all fields AND set active=true in one request
            const payload = {
                type: formValues.type,
                property_type: formValues.propertyType,
                bedroom: formValues.bedroom || null,
                bathroom: formValues.bathroom || null,
                built_in: formValues.builtIn || null,
                parking: formValues.parking || null,
                lot_size: formValues.lotSize || null,
                area: formValues.area || null,
                price: formValues.price || null,
                hoa: formValues.hoa || null,
                description: formValues.description || null,
                active: true, // ← publish
            }

            const res = await djangoFetch(`/api/listings/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const err = await res.json()
                const errMsg = err.detail ||
                    Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(', ')
                toast.error(errMsg || 'Failed to publish listing')
                return
            }

            toast.success('🎉 Listing published! Tenants can now see it.')
            // Route back to dashboard overview after publish
            setTimeout(() => {
                window.location.replace('/dashboard/landlord')
            }, 1500)
        } catch {
            toast.error('Failed to publish listing')
        } finally {
            setPublishing(false)
        }
    }

    if (authLoading || loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
    )
    if (!listing) return null

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-16">
            <div className="max-w-4xl mx-auto px-4 md:px-8">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-8 pt-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.replace('/dashboard/landlord')}
                            className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Edit Listing</h1>
                            <p className="text-sm text-slate-500 truncate max-w-sm">{listing.address}</p>
                        </div>
                    </div>
                    {/* Status badge */}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full
                        ${listing.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'}`}>
                        {listing.active ? '● Published' : '● Draft'}
                    </span>
                </div>

                <Formik
                    initialValues={{
                        type: listing.type || 'Sell',
                        propertyType: listing.property_type || '',
                        bedroom: String(listing.bedroom || ''),
                        bathroom: String(listing.bathroom || ''),
                        builtIn: String(listing.built_in || ''),
                        parking: String(listing.parking || ''),
                        lotSize: String(listing.lot_size || ''),
                        area: String(listing.area || ''),
                        price: String(listing.price || ''),
                        hoa: String(listing.hoa || ''),
                        description: listing.description || '',
                    }}
                    onSubmit={onSubmitHandler}
                    enableReinitialize
                >
                    {({ values, handleChange, handleSubmit, setFieldValue }) => (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ── Listing Type ──────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Listing Type</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-slate-500 text-sm">Rent or Sell?</Label>
                                        <RadioGroup
                                            name="type"
                                            value={values.type}
                                            onValueChange={(value) => setFieldValue("type", value)}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Rent" id="rent" />
                                                <Label htmlFor="rent">For Rent</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Sell" id="sell" />
                                                <Label htmlFor="sell">For Sale</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-slate-500 text-sm">Property Type</Label>
                                        <Select
                                            value={values.propertyType}
                                            onValueChange={(value) => setFieldValue('propertyType', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Property Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Single Family House">Single Family House</SelectItem>
                                                <SelectItem value="Town House">Town House</SelectItem>
                                                <SelectItem value="Condo">Condo</SelectItem>
                                                <SelectItem value="Apartment">Apartment</SelectItem>
                                                <SelectItem value="Commercial">Commercial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* ── Property Details ──────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Property Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[
                                        { name: 'bedroom', label: 'Bedrooms', placeholder: 'e.g. 3' },
                                        { name: 'bathroom', label: 'Bathrooms', placeholder: 'e.g. 2' },
                                        { name: 'parking', label: 'Parking Spaces', placeholder: 'e.g. 2' },
                                        { name: 'builtIn', label: 'Year Built', placeholder: 'e.g. 2010' },
                                        { name: 'lotSize', label: 'Lot Size (Sq.Ft)', placeholder: 'e.g. 2000' },
                                        { name: 'area', label: 'Floor Area (Sq.Ft)', placeholder: 'e.g. 1500' },
                                    ].map((field) => (
                                        <div key={field.name} className="flex flex-col gap-1.5">
                                            <Label className="text-slate-500 text-sm">{field.label}</Label>
                                            <Input
                                                type="text"
                                                placeholder={field.placeholder}
                                                name={field.name}
                                                value={values[field.name as keyof typeof values] ?? ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Pricing ───────────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-slate-500 text-sm">
                                            {values.type === 'Rent' ? 'Monthly Rent (₦)' : 'Selling Price (₦)'}
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 5000000"
                                            name="price"
                                            value={values.price ?? ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-slate-500 text-sm">HOA Fees (₦/month)</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 50000 or 0"
                                            name="hoa"
                                            value={values.hoa ?? ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Description ───────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Description</h3>
                                <Textarea
                                    placeholder="Describe the property — location highlights, nearby amenities, special features..."
                                    name="description"
                                    value={values.description || ''}
                                    onChange={handleChange}
                                    rows={6}
                                    className="resize-none"
                                />
                            </div>

                            {/* ── Images ────────────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Property Images</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Upload high quality photos. First image will be the cover.
                                </p>
                                <FileUpload
                                    setImages={setImages}
                                    existingImages={listing.images || []}
                                    onDeleteImage={handleDeleteImage}
                                />
                            </div>

                            {/* ── Action Buttons ────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    {/* Left: info */}
                                    <div className="text-sm text-slate-500">
                                        {listing.active ? (
                                            <span className="flex items-center gap-1.5 text-emerald-600">
                                                <CheckCircle className="w-4 h-4" />
                                                This listing is live — tenants can see it
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-amber-600">
                                                <Eye className="w-4 h-4" />
                                                Draft — only you can see this listing
                                            </span>
                                        )}
                                    </div>

                                    {/* Right: buttons */}
<div className="flex gap-3 flex-wrap">
    {/* SAVE AS DRAFT */}
    <Button
        type="submit"
        disabled={saving || publishing}
        variant="outline"
        className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
    >
        {saving
            ? <><Loader className="animate-spin w-4 h-4" /> Saving...</>
            : <><Save className="w-4 h-4" /> Save Draft</>
        }
    </Button>

    {/* UNPUBLISH — only show if listing is already active */}
    {listing.active && (
        <Button
            type="button"
            disabled={saving || publishing}
            variant="outline"
            className="flex items-center gap-2 border-amber-200 text-amber-600 hover:bg-amber-50"
            onClick={async () => {
                const res = await djangoFetch(`/api/listings/${id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({ active: false }),
                })
                if (res.ok) {
                    setListing(prev => prev ? { ...prev, active: false } : null)
                    toast.success('Listing unpublished — tenants can no longer see it')
                } else {
                    toast.error('Failed to unpublish listing')
                }
            }}
        >
            Unpublish
        </Button>
    )}

    {/* SAVE & PUBLISH */}
    <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    disabled={saving || publishing}
                                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                                                >
                                                    {publishing
                                                        ? <><Loader className="animate-spin w-4 h-4" /> Publishing...</>
                                                        : <><CheckCircle className="w-4 h-4" />
                                                            {listing.active ? 'Save Changes' : 'Save & Publish'}</>
                                                    }
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {listing.active ? 'Save Changes?' : 'Ready to Publish?'}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {listing.active
                                                            ? 'Your changes will be saved and the listing will remain live.'
                                                            : 'This will make your listing visible to all tenants and buyers on the platform.'}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => publishBtnHandler(values)}
                                                        className="bg-indigo-600 hover:bg-indigo-700"
                                                    >
                                                        {listing.active ? 'Save Changes' : 'Publish Now'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>

                        </form>
                    )}
                </Formik>
            </div>
        </div>
    )
}

export default EditListing