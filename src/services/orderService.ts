import { apiRequest } from "./api";

export type CreateOrderPayload = {
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
    landmark?: string;
  };
  items: {
    productId: string;
    size: string;
    quantity: number;
  }[];
  paymentMethod: "cod" | "easypaisa" | "easypaisa_jazzcash" | "meezan" | "meezan_bank";
  notes?: string;
};

export type TrackedOrder = {
  orderNumber: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
    landmark?: string;
  };
  items: {
    product: string;
    name: string;
    image: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "cod" | "easypaisa_jazzcash" | "meezan_bank";
  paymentStatus: string;
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
};

export async function createOrder(payload: CreateOrderPayload) {
  return apiRequest<{
    success: true;
    order: { orderNumber: string; total: number; paymentMethod: string };
  }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackOrder(orderNumber: string, phone: string) {
  return apiRequest<{ success: true; order: TrackedOrder }>("/orders/track", {
    method: "POST",
    body: JSON.stringify({ orderNumber, phone }),
  });
}
