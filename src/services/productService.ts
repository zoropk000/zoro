import { apiRequest } from "./api";

export type ProductImage = {
  url: string;
  publicId: string;
};

export type ProductSize = {
  size: string;
  stock: number;
};

export type Product = {
  id: string;
  _id: string;
  slug: string;
  name: string;
  nameUrdu?: string;
  gender: "men" | "women";
  price: number;
  oldPrice?: number;
  images: string[];
  imageObjects: ProductImage[];
  shortDescription: string;
  shortDescriptionUrdu?: string;
  description: string[];
  descriptionUrdu?: string[];
  sizes: ProductSize[];
  colors: string[];
  rating: number;
  reviewCount: number;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  totalStock: number;
  status: "active" | "draft" | "out-of-stock";
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
  onSale?: boolean;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductFilters = {
  page?: number;
  limit?: number;
  slug?: string;
  gender?: "men" | "women";
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  onSale?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  sort?: string;
  ids?: string[];
};

export type BackendProduct = Omit<
  Product,
  | "id"
  | "images"
  | "imageObjects"
  | "description"
  | "descriptionUrdu"
  | "rating"
  | "reviewCount"
  | "stockStatus"
> & {
  _id: string;
  images: ProductImage[];
  description?: string;
  descriptionUrdu?: string;
};

type ProductListResponse = {
  success: true;
  products: BackendProduct[];
  pagination: { page: number; pages: number; total: number; limit: number };
};

function splitLines(value?: string): string[] {
  return (value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function mapProduct(product: BackendProduct): Product {
  const totalStock = Number(product.totalStock || 0);
  const lowThreshold = 5;
  return {
    ...product,
    id: product._id,
    images: product.images?.map((image) => image.url).filter(Boolean) || [],
    imageObjects: product.images || [],
    description: splitLines(product.description),
    descriptionUrdu: splitLines(product.descriptionUrdu),
    rating: 4.8,
    reviewCount: 0,
    totalStock,
    stockStatus:
      product.status === "out-of-stock" || totalStock <= 0
        ? "Out of Stock"
        : totalStock <= lowThreshold
          ? "Low Stock"
          : "In Stock",
  };
}

function toQuery(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    )
      return;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getProducts(filters: ProductFilters = {}) {
  const data = await apiRequest<ProductListResponse>(`/products${toQuery(filters)}`);
  return { ...data, products: data.products.map(mapProduct) };
}

export async function getProduct(slug: string) {
  const data = await apiRequest<ProductListResponse>(
    `/products${toQuery({ slug, limit: 1 })}`,
  );
  const product = data.products[0];
  if (!product) throw new Error("Product not found");
  return mapProduct(product);
}

export function getDiscount(product: Product): number {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}
