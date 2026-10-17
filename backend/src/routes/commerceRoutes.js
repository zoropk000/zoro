import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import {
  StoreConfig,
  getStoreConfig,
  activePromotion,
  couponDiscount,
} from "../models/StoreConfig.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { buildProductQuery } from "../controllers/productController.js";

export const commerceRoutes = express.Router();
const wrap = asyncHandler;
const customerView = (customer) => ({
  id: customer._id,
  name: customer.name,
  email: customer.email,
  wishlist: customer.wishlist,
});
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});
// JSON-only writes plus an explicit origin check protect cross-site cookie sessions.
commerceRoutes.use((req, res, next) => {
  if (!/^\/(account\/|admin\/storefront(?:\/|$)|coupons\/validate(?:\/|$))/.test(req.path))
    return next();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const allowed = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
    .join(",")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const ownOrigins = [`http://${req.get("host")}`, `https://${req.get("host")}`];
  if (process.env.NODE_ENV !== "production")
    allowed.push(
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    );
  if (origin && ![...allowed, ...ownOrigins].includes(origin))
    return res.status(403).json({ message: "This request origin is not allowed." });
  if (req.method !== "DELETE" && !req.is("application/json"))
    return res.status(415).json({ message: "Send requests as application/json." });
  next();
});
function setSession(res, customer) {
  const token = jwt.sign({ id: customer._id, role: "customer" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
    audience: "zoro-customer",
  });
  res.cookie("customerToken", token, { ...cookieOptions(), maxAge: 7 * 86400000 });
}
export async function sessionCustomer(req) {
  try {
    if (!req.cookies?.customerToken) return null;
    const decoded = jwt.verify(req.cookies.customerToken, process.env.JWT_SECRET, {
      audience: "zoro-customer",
    });
    if (decoded.role !== "customer") return null;
    return await Customer.findById(decoded.id);
  } catch {
    return null;
  }
}
const protectCustomer = wrap(async (req, res, next) => {
  req.customerAccount = await sessionCustomer(req);
  if (!req.customerAccount) throw new ApiError("Please sign in to your account.", 401);
  next();
});

// Bound repeated authentication attempts per address. Use a shared rate limiter at the edge for multi-instance hosting.
const attempts = new Map();
function authLimit(req, res, next) {
  const now = Date.now();
  for (const [key, value] of attempts) if (now > value.until) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60000 };
  entry.count += 1;
  attempts.set(key, entry);
  if (entry.count > 20)
    return res.status(429).json({ message: "Too many attempts. Try again in 15 minutes." });
  next();
}

commerceRoutes.get(
  "/storefront",
  wrap(async (req, res) => {
    const config = await getStoreConfig();
    res.json({
      categories: config.categories.filter(
        (c) =>
          c.active && (!c.parent || config.categories.some((p) => p.slug === c.parent && p.active)),
      ),
      brands: config.brands,
      promotions: config.promotions.filter((p) => activePromotion(p)),
      shipping: {
        fee: Number(process.env.DELIVERY_FEE || 250),
        freeThreshold: Number(process.env.FREE_DELIVERY_THRESHOLD || 8000),
      },
    });
  }),
);
commerceRoutes.get(
  "/storefront/facets",
  wrap(async (req, res) => {
    const query = buildProductQuery({ category: req.query.category, gender: req.query.gender });
    const [sizes, brands, colors, fragranceTypes] = await Promise.all(
      ["sizes.size", "brand", "colors", "fragranceType"].map((field) =>
        Product.distinct(field, query),
      ),
    );
    res.json({
      sizes: sizes.filter(Boolean),
      brands: brands.filter(Boolean),
      colors: colors.filter(Boolean),
      fragranceTypes: fragranceTypes.filter(Boolean),
    });
  }),
);

commerceRoutes.post(
  "/coupons/validate",
  wrap(async (req, res) => {
    try {
      const subtotal = Number(req.body.subtotal);
      if (!Number.isFinite(subtotal) || subtotal < 0) throw new Error("Invalid subtotal");
      res.json(await couponDiscount(req.body.code, subtotal));
    } catch (error) {
      throw new ApiError(error.message, 400);
    }
  }),
);

commerceRoutes.post(
  "/account/register",
  authLimit,
  wrap(async (req, res) => {
    const { name, email, password } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof password !== "string" ||
      password.length < 10 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new ApiError(
        "Enter your name, a valid email, and a password of at least 10 characters (maximum 72 bytes).",
        400,
      );
    }
    if (await Customer.exists({ email: email.trim().toLowerCase() }))
      throw new ApiError("An account with that email already exists. Please sign in.", 409);
    const customer = await Customer.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 12),
    });
    setSession(res, customer);
    res.status(201).json({ customer: customerView(customer) });
  }),
);
commerceRoutes.post(
  "/account/login",
  authLimit,
  wrap(async (req, res) => {
    if (
      typeof req.body.email !== "string" ||
      typeof req.body.password !== "string" ||
      req.body.password.length > 128
    )
      throw new ApiError("Invalid email or password.", 401);
    const customer = await Customer.findOne({ email: req.body.email.trim().toLowerCase() }).select(
      "+password",
    );
    if (!customer || !(await bcrypt.compare(req.body.password, customer.password)))
      throw new ApiError("Invalid email or password.", 401);
    setSession(res, customer);
    res.json({ customer: customerView(customer) });
  }),
);
commerceRoutes.post("/account/logout", (req, res) => {
  res.clearCookie("customerToken", cookieOptions());
  res.json({ success: true });
});
commerceRoutes.get("/account/me", protectCustomer, (req, res) =>
  res.json({ customer: customerView(req.customerAccount) }),
);
commerceRoutes.get(
  "/account/orders",
  protectCustomer,
  wrap(async (req, res) => {
    const orders = await Order.find({ customerAccount: req.customerAccount._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ orders });
  }),
);
commerceRoutes.put(
  "/account/wishlist",
  protectCustomer,
  wrap(async (req, res) => {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids
          .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
          .slice(0, 200)
      : [];
    req.customerAccount.wishlist = [...new Set(ids)];
    await req.customerAccount.save();
    res.json({ ids: req.customerAccount.wishlist });
  }),
);

commerceRoutes.get(
  "/admin/storefront",
  protectAdmin,
  requireAdmin,
  wrap(async (req, res) => res.json(await getStoreConfig())),
);
commerceRoutes.put(
  "/admin/storefront",
  protectAdmin,
  requireAdmin,
  wrap(async (req, res) => {
    const { categories, brands, promotions, coupons } = req.body;
    if (
      !Array.isArray(categories) ||
      categories.length > 300 ||
      !Array.isArray(brands) ||
      brands.length > 500 ||
      !Array.isArray(promotions) ||
      promotions.length > 50 ||
      !Array.isArray(coupons) ||
      coupons.length > 200
    )
      throw new ApiError("Invalid storefront configuration.", 400);
    const cleanCategories = categories.map((c, order) => ({
      name: String(c.name || "")
        .trim()
        .slice(0, 80),
      slug: String(c.slug || ""),
      parent: String(c.parent || ""),
      type: ["clothing", "shoes", "perfumes", "accessories", "general"].includes(c.type)
        ? c.type
        : "general",
      active: Boolean(c.active),
      order,
      image: safeImage(c.image),
    }));
    const slugs = new Set(cleanCategories.map((c) => c.slug));
    if (
      slugs.size !== categories.length ||
      cleanCategories.some(
        (c) =>
          !c.name ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug) ||
          (c.parent &&
            (!slugs.has(c.parent) ||
              c.parent === c.slug ||
              cleanCategories.find((p) => p.slug === c.parent)?.parent)),
      )
    )
      throw new ApiError("Categories need unique slugs and a valid top-level parent.", 400);
    const current = await getStoreConfig();
    const removed = current.categories.filter((c) => !slugs.has(c.slug)).map((c) => c.slug);
    if (
      removed.length &&
      (await Product.exists({
        $or: [
          { category: { $in: removed } },
          { subcategory: { $in: removed } },
          ...(removed.includes("shoes") ? [{ category: { $exists: false } }] : []),
        ],
      }))
    )
      throw new ApiError(
        "Reassign products before removing their categories. You can hide a category instead.",
        409,
      );
    const cleanPromotions = promotions.map((p) => ({
      id: String(p.id || ""),
      title: String(p.title || "").slice(0, 100),
      subtitle: String(p.subtitle || "").slice(0, 200),
      category: slugs.has(p.category) ? p.category : "",
      image: safeImage(p.image),
      active: Boolean(p.active),
      startsAt: validDate(p.startsAt),
      endsAt: validDate(p.endsAt),
    }));
    const cleanCoupons = coupons.map((c) => ({
      code: String(c.code || "")
        .trim()
        .toUpperCase(),
      type: c.type === "percent" ? "percent" : "fixed",
      value: Number(c.value),
      minSpend: Number(c.minSpend || 0),
      active: Boolean(c.active),
      startsAt: validDate(c.startsAt),
      endsAt: validDate(c.endsAt),
    }));
    if (
      cleanCoupons.some(
        (c) =>
          !/^[A-Z0-9_-]{2,30}$/.test(c.code) ||
          !Number.isFinite(c.value) ||
          c.value <= 0 ||
          (c.type === "percent" && c.value > 100) ||
          !Number.isFinite(c.minSpend) ||
          c.minSpend < 0,
      ) ||
      new Set(cleanCoupons.map((c) => c.code)).size !== cleanCoupons.length
    )
      throw new ApiError("Enter unique coupon codes and valid discount values.", 400);
    if (
      [...cleanPromotions, ...cleanCoupons].some(
        (p) => p.startsAt && p.endsAt && Date.parse(p.endsAt) <= Date.parse(p.startsAt),
      )
    )
      throw new ApiError("End dates must be after start dates.", 400);
    const config = await StoreConfig.findOneAndUpdate(
      { key: "storefront" },
      {
        $set: {
          categories: cleanCategories,
          brands: [
            ...new Set(
              brands
                .map(String)
                .map((s) => s.trim().slice(0, 80))
                .filter(Boolean),
            ),
          ],
          promotions: cleanPromotions,
          coupons: cleanCoupons,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    res.json(config);
  }),
);

function safeImage(value) {
  return typeof value === "string" && (/^https:\/\//.test(value) || /^\/(?!\/)/.test(value))
    ? value.slice(0, 2000)
    : "";
}
function validDate(value) {
  if (!value) return "";
  if (!Number.isFinite(Date.parse(value))) throw new ApiError("Invalid promotion date.", 400);
  return new Date(value).toISOString();
}
