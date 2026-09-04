// src/config/propertyCategories.ts
//
// Single source of truth for the browse categories shown in the
// navbar. Reused by MegaNavbar (as links) and could be reused by
// FilterSection later if you want the dropdown values to always
// match exactly instead of drifting apart over time.

export const TRANSACTION_TYPES = [
  { value: "Sell", label: "Buy" },
  { value: "Rent", label: "Rent" },
  { value: "Shortlet", label: "Shortlet" },
] as const;

export const BEDROOM_QUICK_FILTERS = [
  { value: "1", label: "1+ Bed" },
  { value: "2", label: "2+ Bed" },
  { value: "3", label: "3+ Bed" },
] as const;

// Matches FilterSection.tsx's Home Type options exactly — keep these
// in sync if you ever add a new property_type choice on the backend.
export const PROPERTY_TYPE_QUICK_FILTERS = [
  { value: "Single Family House", label: "Single Family" },
  { value: "Town House", label: "Town House" },
  { value: "Condo", label: "Condo" },
] as const;

/** Builds a /properties?... URL from a partial filter set. */
export function buildPropertiesUrl(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/properties?${qs}` : "/properties";
}
