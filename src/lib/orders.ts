import { siteConfig } from "@/config/siteConfig";

export function calcDeliveryFee(subtotal: number): number {
  if (subtotal >= siteConfig.freeDeliveryThreshold) return 0;
  return siteConfig.deliveryFee;
}
