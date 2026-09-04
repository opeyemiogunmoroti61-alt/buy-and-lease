"use client"
import React from 'react'
import { toast } from 'sonner'
import Image from 'next/image';

type ImageObject = {
    url: string
    path?: string
}

type FileUploadProps = {
    setImages: (files: File[]) => void
    existingImages?: ImageObject[]
    onDeleteImage?: (path: string) => Promise<void>
}

export default function FileUpload({ setImages, existingImages = [], onDeleteImage }: FileUploadProps) {
    const [imagePreviews, setImagePreviews] = React.useState<string[]>([])
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            toast.warning('No files selected')
            return
        }

        const files = Array.from(e.target.files)
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.warning(`Skipped ${file.name} - not an image`)
                return false
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.warning(`Skipped ${file.name} - file too large (max 5MB)`)
                return false
            }
            return true
        })

        const previews = validFiles.map(file => URL.createObjectURL(file))
        setImagePreviews(previews)
        setImages(validFiles)
    }

    const handleDelete = async (path: string) => {
        if (!onDeleteImage) return

        try {
            setIsDeleting(true)
            await onDeleteImage(path)
            toast.success('Image deleted successfully')
        } catch {
            toast.error('Failed to delete image')
        } finally {
            setIsDeleting(false)
        }
    }

    React.useEffect(() => {
        return () => {
            imagePreviews.forEach(preview => URL.revokeObjectURL(preview))
        }
    }, [imagePreviews])

    return (
        <div>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
                        id="dropzone-file"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {/* Existing images */}
                {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative group">
                        <Image
                            src={image.url}
                            className="w-full h-24 object-cover rounded-lg border"
                            alt={`Listing image ${index}`}
                            width={300} // Add appropriate width
                            height={200} // Add appropriate height
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.jpg'
                            }}
                        />
                        {onDeleteImage && image.path && (
                            <button
                                type="button"
                                onClick={() => handleDelete(image.path!)}
                                disabled={isDeleting}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}

                {/* New upload previews */}
                {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative">
                        <Image
                            src={preview}
                            className="w-full h-24 object-cover rounded-lg border"
                            alt={`New upload ${index}`}
                            width={300} // Add appropriate width
                            height={200} // Add appropriate height
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}