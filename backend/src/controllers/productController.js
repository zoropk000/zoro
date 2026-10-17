import mongoose from "mongoose";
import { cloudinary } from "../config/cloudinary.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugify } from "../utils/slugify.js";
import { getStoreConfig } from "../models/StoreConfig.js";

function productResponse(product) {
  return product;
}

export function buildProductQuery(query, publicOnly = true) {
  const filter = {};
  if (publicOnly) filter.status = { $in: ["active", "out-of-stock"] };

  if (query.slug) filter.slug = slugify(query.slug);
  if (query.gender)
    filter.gender =
      query.gender === "unisex" ? "unisex" : { $in: [String(query.gender), "unisex"] };
  if (query.category) {
    if (query.category === "shoes")
      filter.$and = [{ $or: [{ category: "shoes" }, { category: { $exists: false } }] }];
    else filter.category = String(query.category);
  }
  if (query.subcategory) filter.subcategory = String(query.subcategory);
  if (query.brand) filter.brand = String(query.brand);
  if (query.color) filter.colors = String(query.color);
  if (query.fragranceType) filter.fragranceType = String(query.fragranceType);
  if (query.bottleSize) filter.sizes = { $elemMatch: { size: String(query.bottleSize) } };
  if (query.availability === "in-stock") filter.totalStock = { $gt: 0 };
  if (query.rating) filter.rating = { $gte: Math.min(5, Math.max(0, Number(query.rating) || 0)) };
  if (query.ids) {
    const ids = String(query.ids)
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.isValidObjectId(id));
    filter._id = { $in: ids };
  }
  ["featured", "bestSeller", "newArrival", "onSale"].forEach((key) => {
    if (query[key] !== undefined) filter[key] = query[key] === "true" || query[key] === true;
  });
  if (query.status && !publicOnly) filter.status = query.status;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.size) {
    filter.sizes = {
      $elemMatch: { size: { $in: String(query.size).split(",") }, stock: { $gt: 0 } },
    };
  }
  if (query.search) {
    const regex = new RegExp(
      String(query.search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [
      { name: regex },
      { nameUrdu: regex },
      { shortDescription: regex },
      { colors: regex },
      { sku: regex },
      { brand: regex },
      { category: regex },
      { subcategory: regex },
    ];
  }
  return filter;
}

function getProductId(req) {
  return req.params.id || req.query.id;
}

function buildSort(sort) {
  if (sort === "price-asc") return { price: 1 };
  if (sort === "price-desc") return { price: -1 };
  if (sort === "newest") return { createdAt: -1 };
  if (sort === "discount") return { discountPercent: -1, createdAt: -1 };
  return { bestSeller: -1, featured: -1, createdAt: -1 };
}

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
  const filter = buildProductQuery(req.query, true);
  // Aggregation sorts discounts before pagination, so the result is accurate across the catalog.
  if (filter._id) filter._id.$in = filter._id.$in.map((id) => new mongoose.Types.ObjectId(id));
  const [result] = await Product.aggregate([
    { $match: filter },
    {
      $addFields: {
        discountPercent: {
          $cond: [
            { $gt: ["$oldPrice", "$price"] },
            {
              $multiply: [{ $divide: [{ $subtract: ["$oldPrice", "$price"] }, "$oldPrice"] }, 100],
            },
            0,
          ],
        },
      },
    },
    { $sort: buildSort(req.query.sort) },
    {
      $facet: {
        products: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const products = result.products;
  const total = result.total[0]?.count || 0;

  res.json({
    success: true,
    products: products.map(productResponse),
    pagination: {
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
      limit,
    },
  });
});

export const getProductsByGender = (gender) =>
  asyncHandler(async (req, res) => {
    req.query.gender = gender;
    return getProducts(req, res);
  });

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    status: { $in: ["active", "out-of-stock"] },
  }).lean();
  if (!product) throw new ApiError("Product not found", 404);
  res.json({ success: true, product: productResponse(product) });
});

export const adminGetProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = buildProductQuery(req.query, false);

  if (req.query.stock === "low") {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);
    filter.totalStock = { $gt: 0, $lte: threshold };
  }
  if (req.query.stock === "out") filter.totalStock = 0;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: { page, pages: Math.ceil(total / limit) || 1, total, limit },
  });
});

export const adminGetProduct = asyncHandler(async (req, res) => {
  const id = getProductId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid product ID", 400);
  const product = await Product.findById(id).lean();
  if (!product) throw new ApiError("Product not found", 404);
  res.json({ success: true, product });
});

function cleanPayload(body) {
  const payload = {
    name: body.name,
    nameUrdu: body.nameUrdu || "",
    gender: body.gender,
    category: body.category || "shoes",
    subcategory: body.subcategory || "",
    brand: String(body.brand || "").trim(),
    fragranceType: String(body.fragranceType || "").trim(),
    bottleSize: String(body.bottleSize || "").trim(),
    description: body.description || "",
    descriptionUrdu: body.descriptionUrdu || "",
    shortDescription: body.shortDescription || "",
    shortDescriptionUrdu: body.shortDescriptionUrdu || "",
    price: Number(body.price),
    oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
    images: Array.isArray(body.images) ? body.images : [],
    sizes: Array.isArray(body.sizes)
      ? body.sizes.map((row) => ({ size: String(row.size), stock: Number(row.stock || 0) }))
      : [],
    colors: Array.isArray(body.colors) ? body.colors.map(String).filter(Boolean) : [],
    status: body.status || "draft",
    featured: Boolean(body.featured),
    bestSeller: Boolean(body.bestSeller),
    newArrival: Boolean(body.newArrival),
    onSale: Boolean(body.onSale),
    sku: body.sku ? String(body.sku) : undefined,
  };

  payload.slug = body.slug ? slugify(body.slug) : slugify(body.name);
  if (!payload.slug) throw new ApiError("Product slug could not be generated", 400);
  if (payload.oldPrice !== undefined && payload.oldPrice <= 0) payload.oldPrice = undefined;
  if (payload.status === "active" && payload.images.length === 0) {
    throw new ApiError("Upload at least one product image.", 400);
  }
  return payload;
}

export const createProduct = asyncHandler(async (req, res) => {
  const payload = cleanPayload(req.body);
  await validateCategory(payload);
  const product = await Product.create(payload);
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const id = getProductId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid product ID", 400);
  const existing = await Product.findById(id);
  if (!existing) throw new ApiError("Product not found", 404);

  const oldPublicIds = new Set(existing.images.map((img) => img.publicId));
  const payload = cleanPayload(req.body);
  await validateCategory(payload);
  Object.assign(existing, payload);
  await existing.save();

  const nextPublicIds = new Set(existing.images.map((img) => img.publicId));
  const removed = [...oldPublicIds].filter((publicId) => !nextPublicIds.has(publicId));
  await Promise.all(
    removed.map((publicId) => cloudinary.uploader.destroy(publicId).catch(() => null)),
  );

  res.json({ success: true, product: existing });
});

async function validateCategory(payload) {
  const config = await getStoreConfig();
  if (!config.categories.some((c) => c.slug === payload.category && !c.parent))
    throw new ApiError("Choose an existing department.", 400);
  if (
    payload.subcategory &&
    !config.categories.some((c) => c.slug === payload.subcategory && c.parent === payload.category)
  )
    throw new ApiError("Choose a subcategory in this department.", 400);
  if (payload.brand && !config.brands.includes(payload.brand))
    throw new ApiError("Add this brand in Storefront settings first.", 400);
}

export const deleteProduct = asyncHandler(async (req, res) => {
  const id = getProductId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid product ID", 400);
  const product = await Product.findById(id);
  if (!product) throw new ApiError("Product not found", 404);

  await Promise.all(
    product.images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => null)),
  );
  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const id = getProductId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid product ID", 400);
  const { status } = req.body;
  if (!["active", "draft", "out-of-stock"].includes(status)) {
    throw new ApiError("Invalid product status", 400);
  }
  const product = await Product.findById(id);
  if (!product) throw new ApiError("Product not found", 404);
  product.status = status;
  await product.save();
  res.json({ success: true, product });
});

export const updateProductInventory = asyncHandler(async (req, res) => {
  const id = getProductId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid product ID", 400);
  const product = await Product.findById(id);
  if (!product) throw new ApiError("Product not found", 404);

  if (!Array.isArray(req.body.sizes) || req.body.sizes.length === 0) {
    throw new ApiError("At least one size is required", 400);
  }

  product.sizes = req.body.sizes.map((row) => ({
    size: String(row.size).trim(),
    stock: Number(row.stock || 0),
  }));

  if (product.sizes.some((row) => !row.size || row.stock < 0)) {
    throw new ApiError("Sizes are required and stock cannot be negative", 400);
  }

  const totalStock = product.sizes.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  if (req.body.status && ["active", "draft", "out-of-stock"].includes(req.body.status)) {
    product.status = req.body.status;
  } else if (totalStock > 0 && product.images.length > 0) {
    product.status = "active";
  } else if (totalStock === 0) {
    product.status = "out-of-stock";
  }

  await product.save();
  res.json({ success: true, product });
});
