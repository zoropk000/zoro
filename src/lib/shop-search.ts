export type ShopSearch = {
  q?: string;
  category?: string;
  subcategory?: string;
  gender?: "men" | "women" | "unisex";
  collection?: string;
  sort?: string;
  size?: string;
  brand?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  availability?: string;
  fragranceType?: string;
  bottleSize?: string;
  page?: number;
};
export function validateShopSearch(search: Record<string, unknown>): ShopSearch {
  const result: ShopSearch = {};
  const strings = [
    "q",
    "category",
    "subcategory",
    "collection",
    "sort",
    "size",
    "brand",
    "color",
    "availability",
    "fragranceType",
    "bottleSize",
  ] as const;
  for (const key of strings)
    if (typeof search[key] === "string" && search[key])
      result[key] = String(search[key]).slice(0, 200);
  for (const key of ["minPrice", "maxPrice", "rating", "page"] as const)
    if (
      search[key] !== undefined &&
      Number.isFinite(Number(search[key])) &&
      Number(search[key]) >= 0
    )
      result[key] = Number(search[key]);
  if (["men", "women", "unisex"].includes(String(search.gender)))
    result.gender = search.gender as ShopSearch["gender"];
  return result;
}
