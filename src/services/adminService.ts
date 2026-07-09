import { apiRequest } from "./api";
import {
  mapProduct,
  type BackendProduct,
  type ProductImage,
  type ProductSize,
} from "./productService";

export type ProductPayload = {
  name: string;
  nameUrdu?: string;
  slug?: string;
  gender: "men" | "women";
  description?: string;
  descriptionUrdu?: string;
  shortDescription?: string;
  shortDescriptionUrdu?: string;
  price: number;
  oldPrice?: number;
  images: ProductImage[];
  sizes: ProductSize[];
  colors: string[];
  status: "active" | "draft" | "out-of-stock";
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  onSale: boolean;
  sku?: string;
};

export type AdminOrder = {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string; city: string; address: string; landmark?: string };
  items: {
    product: string;
    name: string;
    image: string;
    size: string;
    quantity: number;
    price: number;
    gender: "men" | "women";
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

type Pagination = { page: number; pages: number; total: number; limit: number };
type ProductListResponse = {
  success: true;
  products: BackendProduct[];
  pagination: Pagination;
};
type ProductResponse = { success: true; product: BackendProduct };
type MutationResponse = { success: true; product?: BackendProduct; message?: string };

function idQuery(id: string) {
  return `?id=${encodeURIComponent(id)}`;
}

export const adminApi = {
  login(email: string, password: string) {
    return apiRequest<{ success: true; admin: { id: string; name: string; email: string } }>(
      "/admin/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
  },
  logout() {
    return apiRequest<{ success: true }>("/admin/auth/logout", { method: "POST" });
  },
  me() {
    return apiRequest<{ success: true; admin: { id: string; name: string; email: string } }>(
      "/admin/auth/me",
    );
  },
  async products(params = "") {
    const data = await apiRequest<ProductListResponse>(`/admin/products${params}`);
    return { ...data, products: data.products.map(mapProduct) };
  },
  async product(id: string) {
    const data = await apiRequest<ProductResponse>(`/admin/products/by-id${idQuery(id)}`);
    return { ...data, product: mapProduct(data.product) };
  },
  createProduct(payload: ProductPayload) {
    return apiRequest<MutationResponse>("/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateProduct(id: string, payload: ProductPayload) {
    return apiRequest<MutationResponse>(`/admin/products/by-id${idQuery(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(id: string) {
    return apiRequest<MutationResponse>(`/admin/products/by-id${idQuery(id)}`, {
      method: "DELETE",
    });
  },
  updateInventory(
    id: string,
    payload: { sizes: ProductSize[]; status?: "active" | "draft" | "out-of-stock" },
  ) {
    return apiRequest<MutationResponse>(`/admin/products/inventory${idQuery(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return apiRequest<{ success: true; images: ProductImage[] }>("/admin/upload", {
      method: "POST",
      body: formData,
      skipJson: true,
    });
  },
  orders(params = "") {
    return apiRequest<{ success: true; orders: AdminOrder[]; pagination: Pagination }>(
      `/admin/orders${params}`,
    );
  },
  order(id: string) {
    return apiRequest<{ success: true; order: AdminOrder }>(`/admin/orders/by-id${idQuery(id)}`);
  },
  updateOrderStatus(id: string, status: string) {
    return apiRequest<{ success: true; order: AdminOrder }>(`/admin/orders/status${idQuery(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  updatePaymentStatus(id: string, status: string) {
    return apiRequest<{ success: true; order: AdminOrder }>(
      `/admin/orders/payment-status${idQuery(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
  },
  dashboard<T = unknown>(path: string) {
    return apiRequest<T>(`/admin/dashboard/${path}`);
  },
};
