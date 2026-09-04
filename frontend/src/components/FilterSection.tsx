import React from 'react'
//import { BedDouble, Bath, CarFront } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface FilterSectionProps {
    onBedChange: (value: string) => void;
    onBathChange: (value: string) => void;
    onParkingChange: (value: string) => void;
    onHomeTypeChange: (value: string) => void;
}

function FilterSection({
    onBedChange,
    onBathChange,
    onParkingChange,
    onHomeTypeChange
}: FilterSectionProps) {
    return (
        <div className='grid grid-cols-2 md:flex gap-2'>
            <Select onValueChange={onBedChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Bed" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={onBathChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Bath" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={onParkingChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Parking" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={onHomeTypeChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Home Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Single Family House">Single Family</SelectItem>
                    <SelectItem value="Town House">Town House</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export default FilterSection