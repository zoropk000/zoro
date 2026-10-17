import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./api";

export type Category = {
  name: string;
  slug: string;
  parent: string;
  type: string;
  active: boolean;
  order: number;
  image: string;
};
export type Promotion = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
};
export type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSpend: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
};
export type Storefront = {
  categories: Category[];
  brands: string[];
  promotions: Promotion[];
  shipping?: { fee: number; freeThreshold: number };
  coupons?: Coupon[];
};

const departments: Record<string, string[]> = {
  Clothing: [
    "Men's Wear",
    "Women's Wear",
    "Shirts",
    "T-Shirts",
    "Jeans",
    "Trousers",
    "Dresses",
    "Eastern Wear",
    "Western Wear",
  ],
  Shoes: [
    "Sneakers",
    "Casual Shoes",
    "Formal Shoes",
    "Sports Shoes",
    "Sandals",
    "Heels",
    "Slippers",
  ],
  Perfumes: [
    "Men's Fragrances",
    "Women's Fragrances",
    "Unisex Perfumes",
    "Luxury Fragrances",
    "Gift Sets",
  ],
  Accessories: ["Watches", "Bags", "Wallets", "Belts", "Sunglasses", "Jewellery"],
};
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const defaultCategories: Category[] = Object.entries(departments).flatMap(
  ([name, children], order) => [
    { name, slug: slugify(name), parent: "", type: slugify(name), active: true, order, image: "" },
    ...children.map((child, index) => ({
      name: child,
      slug: slugify(child),
      parent: slugify(name),
      type: slugify(name),
      active: true,
      order: index,
      image: "",
    })),
  ],
);
export function useStorefront() {
  return useQuery({
    queryKey: ["storefront"],
    queryFn: () => apiRequest<Storefront>("/storefront"),
    staleTime: 60_000,
  });
}
export function categoryImage(category: string) {
  return (
    {
      clothing: "/images/category-clothing.webp",
      shoes: "/images/category-shoes.webp",
      perfumes: "/images/category-perfumes.webp",
      accessories: "/images/category-accessories.webp",
    }[category] || "/images/campaign.webp"
  );
}
