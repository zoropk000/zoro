import mongoose from "mongoose";

// One additive configuration document; existing product and order collections stay intact.
const storeConfigSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "storefront" },
    categories: { type: [mongoose.Schema.Types.Mixed], default: [] },
    brands: { type: [String], default: [] },
    promotions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    coupons: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

export const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);

const departments = {
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
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const defaultCategories = Object.entries(departments).flatMap(([name, children], order) => [
  { name, slug: slug(name), parent: "", type: slug(name), active: true, order, image: "" },
  ...children.map((child, index) => ({
    name: child,
    slug: slug(child),
    parent: slug(name),
    type: slug(name),
    active: true,
    order: index,
    image: "",
  })),
]);

export async function getStoreConfig() {
  return (
    (await StoreConfig.findOne({ key: "storefront" }).lean()) || {
      categories: defaultCategories,
      brands: [],
      promotions: [],
      coupons: [],
    }
  );
}

export function activePromotion(promotion, now = Date.now()) {
  return (
    promotion.active &&
    (!promotion.startsAt || Date.parse(promotion.startsAt) <= now) &&
    (!promotion.endsAt || Date.parse(promotion.endsAt) > now)
  );
}

export async function couponDiscount(code, subtotal) {
  if (!code) return { discount: 0, code: "" };
  const config = await getStoreConfig();
  const coupon = config.coupons.find(
    (item) => item.code === String(code).trim().toUpperCase() && activePromotion(item),
  );
  if (!coupon || subtotal < Number(coupon.minSpend || 0)) {
    throw new Error("This code is invalid, expired, or its minimum spend has not been met.");
  }
  const value = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return { code: coupon.code, discount: Math.min(subtotal, Math.round(value)) };
}
