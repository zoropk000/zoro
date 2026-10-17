import { apiRequest } from "./api";

export type CreateOrderPayload = {
  checkoutKey?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    province?: string;
    address: string;
    landmark?: string;
  };
  items: {
    productId: string;
    size: string;
    quantity: number;
    color?: string;
  }[];
  paymentMethod: "cod" | "easypaisa" | "easypaisa_jazzcash" | "meezan" | "meezan_bank";
  notes?: string;
  couponCode?: string;
};

export type TrackedOrder = {
  orderNumber: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
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
  discount?: number;
  couponCode?: string;
  paymentMethod: "cod" | "easypaisa_jazzcash" | "meezan_bank";
  paymentStatus: string;
  hasPaymentProof?: boolean;
  paymentProofUploadedAt?: string;
  paymentReviewNote?: string;
  paymentProofToken?: string;
  orderStatus:
    | "pending"
    | "confirmed"
    | "preparing"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  deliveryEstimate?: {
    minDays: number;
    maxDays: number;
    estimatedStartDate: string;
    estimatedEndDate: string;
  };
  trackingEvents?: {
    status: string;
    title: string;
    titleUrdu: string;
    description: string;
    descriptionUrdu: string;
    timestamp: string;
  }[];
};

export async function createOrder(payload: CreateOrderPayload) {
  return apiRequest<{
    success: true;
    order: {
      orderNumber: string;
      total: number;
      paymentMethod: string;
      paymentProofToken?: string;
      emailSent?: boolean;
      hasPaymentProof?: boolean;
    };
  }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadPaymentProof(orderNumber: string, token: string, file: File) {
  const body = new FormData();
  body.append("proof", file);
  return apiRequest<{ success: true; uploadedAt: string }>(
    `/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, skipJson: true },
  );
}

export async function trackOrder(orderNumber: string, phone: string) {
  return apiRequest<{ success: true; order: TrackedOrder }>("/orders/track", {
    method: "POST",
    body: JSON.stringify({ orderNumber, phone }),
  });
}
