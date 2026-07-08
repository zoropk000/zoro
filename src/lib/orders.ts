import { siteConfig } from "@/config/siteConfig";

export type SavedOrder = {
  orderNumber: string;
  createdAt: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  landmark?: string;
  items: {
    productId: number;
    name: string;
    image: string;
    size: number;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  status: "Received" | "Confirmed" | "Packed" | "Shipped" | "Delivered";
};

const STORAGE_KEY = "stepstyle_orders_v1";

export function generateOrderNumber(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `SS${n}`;
}

export function calcDeliveryFee(subtotal: number): number {
  if (subtotal >= siteConfig.freeDeliveryThreshold) return 0;
  return siteConfig.deliveryFee;
}

export function saveOrder(order: SavedOrder) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: SavedOrder[] = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    // ignore
  }
}

export function getOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function findOrder(orderNumber: string, phone: string): SavedOrder | undefined {
  const cleanNum = orderNumber.trim().toUpperCase().replace(/^#/, "");
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  return getOrders().find(
    (o) =>
      o.orderNumber.toUpperCase() === cleanNum &&
      o.phone.replace(/\D/g, "").slice(-10) === cleanPhone,
  );
}
