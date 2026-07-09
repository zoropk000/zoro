import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { makeOrderNumber } from "../utils/orderNumber.js";

function normalizePhone(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function deliveryFeeFor(subtotal) {
  const freeThreshold = Number(process.env.FREE_DELIVERY_THRESHOLD || 8000);
  const fee = Number(process.env.DELIVERY_FEE || 250);
  return subtotal >= freeThreshold ? 0 : fee;
}

async function recalculateProductStock(productId) {
  const product = await Product.findById(productId);
  if (!product) return;
  product.totalStock = product.sizes.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  if (product.totalStock === 0) product.status = "out-of-stock";
  await product.save();
}

async function restoreInventory(order) {
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product, "sizes.size": item.size },
      { $inc: { "sizes.$.stock": item.quantity } },
    );
    await recalculateProductStock(item.product);
  }
  order.inventoryReduced = false;
}

async function reduceInventory(items) {
  const reduced = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        {
          _id: item.product,
          sizes: { $elemMatch: { size: item.size, stock: { $gte: item.quantity } } },
        },
        { $inc: { "sizes.$.stock": -item.quantity } },
      );
      if (result.modifiedCount !== 1) {
        throw new ApiError(`Insufficient stock for ${item.name} size ${item.size}`, 409);
      }
      reduced.push(item);
      await recalculateProductStock(item.product);
    }
  } catch (error) {
    for (const item of reduced) {
      await Product.updateOne(
        { _id: item.product, "sizes.size": item.size },
        { $inc: { "sizes.$.stock": item.quantity } },
      );
      await recalculateProductStock(item.product);
    }
    throw error;
  }
}

export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, paymentMethod, notes } = req.body;
  if (!customer?.name || !customer?.phone || !customer?.city || !customer?.address) {
    throw new ApiError("Customer name, phone, city, and address are required", 400);
  }
  if (!Array.isArray(items) || items.length === 0)
    throw new ApiError("Order items are required", 400);

  const mappedItems = [];
  for (const row of items) {
    if (!mongoose.isValidObjectId(row.productId)) throw new ApiError("Invalid product ID", 400);
    const product = await Product.findOne({ _id: row.productId, status: "active" });
    if (!product) throw new ApiError("Product not found", 404);
    const size = String(row.size);
    const quantity = Math.max(Number(row.quantity) || 0, 0);
    if (quantity < 1) throw new ApiError("Quantity must be at least 1", 400);
    const sizeRow = product.sizes.find((entry) => entry.size === size);
    if (!sizeRow) throw new ApiError(`Size ${size} is not available for ${product.name}`, 400);
    if (sizeRow.stock < quantity)
      throw new ApiError(`Insufficient stock for ${product.name} size ${size}`, 409);

    mappedItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      size,
      quantity,
      price: product.price,
      gender: product.gender,
    });
  }

  const methodMap = {
    cod: "cod",
    easypaisa: "easypaisa_jazzcash",
    easypaisa_jazzcash: "easypaisa_jazzcash",
    meezan: "meezan_bank",
    meezan_bank: "meezan_bank",
  };
  const normalizedPayment = methodMap[paymentMethod] || "cod";
  const subtotal = mappedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal);

  await reduceInventory(mappedItems);

  const order = await Order.create({
    orderNumber: makeOrderNumber(),
    customer: {
      name: customer.name.trim(),
      phone: normalizePhone(customer.phone),
      city: customer.city.trim(),
      address: customer.address.trim(),
      landmark: customer.landmark?.trim() || "",
    },
    items: mappedItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    paymentMethod: normalizedPayment,
    paymentStatus: normalizedPayment === "cod" ? "pending" : "verification-needed",
    notes: notes || "",
  });

  res.status(201).json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
    },
  });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const orderNumber = String(req.body.orderNumber || "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "");
  const phone = normalizePhone(req.body.phone);
  if (!orderNumber || !phone)
    throw new ApiError("Order number and mobile number are required", 400);

  const order = await Order.findOne({ orderNumber, "customer.phone": phone }).lean();
  if (!order) throw new ApiError("Order not found", 404);

  res.json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    },
  });
});

export const adminGetOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    const search = String(req.query.search).trim();
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ orderNumber: regex }, { "customer.phone": regex }, { "customer.name": regex }];
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    orders,
    pagination: { page, pages: Math.ceil(total / limit) || 1, total, limit },
  });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError("Invalid order ID", 400);
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new ApiError("Order not found", 404);
  res.json({ success: true, order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError("Invalid order ID", 400);
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new ApiError("Invalid order status", 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError("Order not found", 404);
  if (status === "cancelled" && order.orderStatus !== "cancelled" && order.inventoryReduced) {
    await restoreInventory(order);
  }
  order.orderStatus = status;
  await order.save();
  res.json({ success: true, order });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError("Invalid order ID", 400);
  const { status } = req.body;
  const allowed = ["pending", "paid", "verification-needed", "failed"];
  if (!allowed.includes(status)) throw new ApiError("Invalid payment status", 400);
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: status },
    { new: true },
  );
  if (!order) throw new ApiError("Order not found", 404);
  res.json({ success: true, order });
});
