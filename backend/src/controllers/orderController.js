import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { makeOrderNumber } from "../utils/orderNumber.js";
import { sendOrderStatusEmail } from "../utils/email.js";
import { couponDiscount } from "../models/StoreConfig.js";
import { sessionCustomer } from "../routes/commerceRoutes.js";

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

function proofToken(order) {
  return jwt.sign(
    { id: order._id, orderNumber: order.orderNumber, purpose: "payment-proof" },
    process.env.JWT_SECRET,
    { audience: "zoro-payment-proof", expiresIn: "24h" },
  );
}
export const authorizePaymentProof = (req, res, next) => {
  try {
    const token = String(req.get("authorization") || "").replace(/^Bearer /i, "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { audience: "zoro-payment-proof" });
    if (
      decoded.purpose !== "payment-proof" ||
      decoded.orderNumber !== String(req.params.orderNumber).toUpperCase()
    )
      throw new Error();
    req.proofOrderId = decoded.id;
    next();
  } catch {
    next(
      new ApiError(
        "Verify your order number and phone in order tracking before uploading a screenshot.",
        401,
      ),
    );
  }
};
function requireApprovedPayment(order, nextStatus) {
  if (
    order.paymentMethod !== "cod" &&
    order.paymentStatus !== "paid" &&
    ["confirmed", "preparing", "processing", "shipped", "out_for_delivery", "delivered"].includes(
      nextStatus,
    )
  )
    throw new ApiError(
      "Review and approve the payment screenshot before confirming or shipping this prepaid order.",
      409,
    );
}
function respondWithOrder(res, order, emailSent = false) {
  return res.status(201).json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentProofToken: order.paymentMethod !== "cod" ? proofToken(order) : undefined,
      hasPaymentProof: Boolean(order.paymentProof?.url),
      emailSent,
    },
  });
}

async function recalculateProductStock(productId) {
  // Calculate from current database values; concurrent reservations must not overwrite each other.
  await Product.updateOne({ _id: productId }, [
    { $set: { totalStock: { $sum: "$sizes.stock" } } },
    {
      $set: {
        status: {
          $cond: [
            { $eq: ["$totalStock", 0] },
            "out-of-stock",
            { $cond: [{ $eq: ["$status", "out-of-stock"] }, "active", "$status"] },
          ],
        },
      },
    },
  ]);
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
          status: "active",
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

function getOrderId(req) {
  return req.params.id || req.query.id;
}

async function saveEmailStatus(orderId, emailType, emailRes) {
  const order = await Order.findById(orderId);
  if (!order) return;

  order.emailStatus[emailType] = {
    sent: emailRes.success,
    sentAt: emailRes.success ? new Date() : null,
    error: emailRes.success ? null : emailRes.error || "Failed to send email",
  };

  await order.save();
}

async function sendAndSaveEmailStatus(order, emailType) {
  try {
    const emailRes = await sendOrderStatusEmail(order, emailType);
    await saveEmailStatus(order._id, emailType, emailRes);
    return emailRes;
  } catch (error) {
    const message = error.message || "Failed to send email";
    console.error(`Email background failure (${emailType}):`, message);
    const emailRes = { success: false, error: message };
    await saveEmailStatus(order._id, emailType, emailRes);
    return emailRes;
  }
}

export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, paymentMethod, notes } = req.body;
  const checkoutKey =
    typeof req.body.checkoutKey === "string" && /^[a-f0-9-]{36}$/i.test(req.body.checkoutKey)
      ? req.body.checkoutKey
      : undefined;
  if (checkoutKey) {
    const existing = await Order.findOne({ checkoutKey });
    if (existing)
      return respondWithOrder(res, existing, Boolean(existing.emailStatus?.orderReceived?.sent));
  }
  if (
    !customer ||
    ["name", "phone", "email", "city", "address"].some(
      (key) => typeof customer[key] !== "string",
    ) ||
    customer.name.length > 100 ||
    customer.email.length > 254 ||
    customer.city.length > 100 ||
    customer.address.length > 1000
  )
    throw new ApiError("Enter valid customer contact and delivery details.", 400);
  if (
    !customer?.name ||
    !customer?.phone ||
    !customer?.city ||
    !customer?.address ||
    !customer?.email
  ) {
    throw new ApiError("Customer name, phone, email, city, and address are required", 400);
  }
  if (
    !/^\S+@\S+\.\S+$/.test(String(customer.email)) ||
    !/^3\d{9}$/.test(normalizePhone(customer.phone))
  )
    throw new ApiError("Enter a valid email and Pakistani mobile number.", 400);
  if (items?.length > 100) throw new ApiError("Too many order items.", 400);
  if (!Array.isArray(items) || items.length === 0)
    throw new ApiError("Order items are required", 400);

  const mappedItems = [];
  for (const row of items) {
    if (!mongoose.isValidObjectId(row.productId)) throw new ApiError("Invalid product ID", 400);
    const product = await Product.findOne({ _id: row.productId, status: "active" });
    if (!product) throw new ApiError("Product not found", 404);
    const size = String(row.size);
    const quantity = Math.max(Number(row.quantity) || 0, 0);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100)
      throw new ApiError("Quantity must be a whole number from 1 to 100", 400);
    const sizeRow = product.sizes.find((entry) => entry.size === size);
    if (!sizeRow) throw new ApiError(`Size ${size} is not available for ${product.name}`, 400);
    if (sizeRow.stock < quantity)
      throw new ApiError(`Insufficient stock for ${product.name} size ${size}`, 409);
    const color = String(row.color || "");
    if (color && !product.colors.includes(color))
      throw new ApiError(`Choose an available colour for ${product.name}`, 400);

    mappedItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      size,
      color,
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
  let coupon;
  try {
    coupon = await couponDiscount(req.body.couponCode, subtotal);
  } catch (error) {
    throw new ApiError(error.message, 400);
  }
  const account = await sessionCustomer(req);

  await reduceInventory(mappedItems);

  let order;
  try {
    order = await Order.create({
      orderNumber: makeOrderNumber(),
      checkoutKey,
      customerAccount: account?._id,
      couponCode: coupon.code,
      discount: coupon.discount,
      customer: {
        name: customer.name.trim(),
        phone: normalizePhone(customer.phone),
        email: customer.email.trim().toLowerCase(),
        city: customer.city.trim(),
        province: String(customer.province || "").trim(),
        address: customer.address.trim(),
        landmark: customer.landmark?.trim() || "",
      },
      items: mappedItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee - coupon.discount,
      paymentMethod: normalizedPayment,
      paymentStatus: normalizedPayment === "cod" ? "pending" : "verification-needed",
      notes: notes || "",
      trackingEvents: [
        {
          status: "pending",
          title: "Order Received",
          titleUrdu: "آرڈر موصول ہو گیا",
          description: "We received your order.",
          descriptionUrdu: "ہمیں آپ کا آرڈر موصول ہو گیا ہے۔",
          timestamp: new Date(),
        },
      ],
    });
  } catch (error) {
    // Restore stock when order persistence fails after inventory reservation.
    for (const item of mappedItems) {
      await Product.updateOne(
        { _id: item.product, "sizes.size": item.size },
        { $inc: { "sizes.$.stock": item.quantity } },
      );
      await recalculateProductStock(item.product);
    }
    if (checkoutKey && error.code === 11000 && error.keyPattern?.checkoutKey) {
      const existing = await Order.findOne({ checkoutKey });
      if (existing)
        return respondWithOrder(res, existing, Boolean(existing.emailStatus?.orderReceived?.sent));
    }
    throw error;
  }

  const emailResult = await sendAndSaveEmailStatus(order, "orderReceived").catch(() => ({
    success: false,
  }));

  res.status(201).json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentProofToken: normalizedPayment !== "cod" ? proofToken(order) : undefined,
      emailSent: Boolean(emailResult.success),
    },
  });
});

function addWorkingDays(startDate, days) {
  let date = new Date(startDate);
  let remainingDays = days;
  while (remainingDays > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      remainingDays--;
    }
  }
  return date;
}

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
      customer: {
        name: order.customer.name,
        city: order.customer.city,
        address: order.customer.address,
        landmark: order.customer.landmark,
        phone: order.customer.phone,
        email: order.customer.email,
      },
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount || 0,
      couponCode: order.couponCode || "",
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      hasPaymentProof: Boolean(order.paymentProof?.url),
      paymentProofUploadedAt: order.paymentProof?.uploadedAt,
      paymentReviewNote: order.paymentReview?.note || "",
      paymentProofToken:
        order.paymentMethod !== "cod" &&
        order.paymentStatus !== "paid" &&
        order.orderStatus !== "cancelled"
          ? proofToken(order)
          : undefined,
      orderStatus: order.orderStatus,
      deliveryEstimate: order.deliveryEstimate,
      trackingEvents: order.trackingEvents,
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
  const id = getOrderId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid order ID", 400);
  const order = await Order.findById(id).lean();
  if (!order) throw new ApiError("Order not found", 404);
  res.json({ success: true, order });
});

export const confirmOrder = asyncHandler(async (req, res) => {
  const id = getOrderId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid order ID", 400);
  const { minDeliveryDays, maxDeliveryDays } = req.body;

  const minDays = Number(minDeliveryDays);
  const maxDays = Number(maxDeliveryDays);

  if (
    !Number.isSafeInteger(minDays) ||
    !Number.isSafeInteger(maxDays) ||
    minDays <= 0 ||
    maxDays > 120
  ) {
    throw new ApiError("Minimum and maximum delivery days must be positive numbers", 400);
  }
  if (maxDays < minDays) {
    throw new ApiError("Maximum delivery days cannot be less than minimum delivery days", 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError("Order not found", 404);
  requireApprovedPayment(order, "confirmed");
  if (order.orderStatus === "cancelled") {
    throw new ApiError("Cannot confirm a cancelled order", 400);
  }

  const now = new Date();
  const estimatedStartDate = addWorkingDays(now, minDays);
  const estimatedEndDate = addWorkingDays(now, maxDays);

  order.orderStatus = "confirmed";
  order.confirmedAt = now;
  order.trackingStartedAt = now;
  order.deliveryEstimate = {
    minDays,
    maxDays,
    estimatedStartDate,
    estimatedEndDate,
  };

  // Push confirmation event
  const hasConfirmedEvent = order.trackingEvents.some((e) => e.status === "confirmed");
  if (!hasConfirmedEvent) {
    order.trackingEvents.push({
      status: "confirmed",
      title: "Order Confirmed",
      titleUrdu: "آرڈر کی تصدیق ہو گئی",
      description: "Your order has been confirmed.",
      descriptionUrdu: "آپ کے آرڈر کی تصدیق ہو گئی ہے۔",
      timestamp: now,
    });
  } else {
    order.trackingEvents.push({
      status: "confirmed",
      title: "Order Confirmed",
      titleUrdu: "آرڈر کی تصدیق ہو گئی",
      description: `Your order has been confirmed (Delivery estimated in ${minDays}-${maxDays} working days).`,
      descriptionUrdu: `آپ کے آرڈر کی تصدیق ہو گئی ہے (ڈیلیوری کا وقت ${minDays} تا ${maxDays} کام کے دن)۔`,
      timestamp: now,
    });
  }

  await order.save();

  await sendAndSaveEmailStatus(order, "orderConfirmed");

  res.json({
    success: true,
    message: "Order confirmed successfully",
    order: {
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      deliveryEstimate: order.deliveryEstimate,
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const id = getOrderId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid order ID", 400);
  const { status, minDeliveryDays, maxDeliveryDays } = req.body;
  const allowed = [
    "pending",
    "confirmed",
    "preparing",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  if (!allowed.includes(status)) throw new ApiError("Invalid order status", 400);

  const order = await Order.findById(id);
  if (!order) throw new ApiError("Order not found", 404);
  requireApprovedPayment(order, status);
  if (order.orderStatus === "cancelled" && status !== "cancelled")
    throw new ApiError("Cancelled orders cannot be reopened. Create a new order instead.", 409);

  if (status === "confirmed" && order.orderStatus === "cancelled") {
    throw new ApiError("Cannot confirm a cancelled order", 400);
  }

  const hasDeliveryEstimate = minDeliveryDays !== undefined || maxDeliveryDays !== undefined;
  let minDays;
  let maxDays;
  let now;

  if (status === "confirmed") {
    now = new Date();
    order.confirmedAt = order.confirmedAt || now;
    order.trackingStartedAt = order.trackingStartedAt || now;

    if (hasDeliveryEstimate) {
      minDays = Number(minDeliveryDays);
      maxDays = Number(maxDeliveryDays);

      if (
        !Number.isSafeInteger(minDays) ||
        !Number.isSafeInteger(maxDays) ||
        minDays <= 0 ||
        maxDays > 120
      ) {
        throw new ApiError("Minimum and maximum delivery days must be positive numbers", 400);
      }
      if (maxDays < minDays) {
        throw new ApiError("Maximum delivery days cannot be less than minimum delivery days", 400);
      }

      order.deliveryEstimate = {
        minDays,
        maxDays,
        estimatedStartDate: addWorkingDays(now, minDays),
        estimatedEndDate: addWorkingDays(now, maxDays),
      };
    }
  }

  if (order.orderStatus === status) {
    if (status === "confirmed") {
      await order.save();
    }
    return res.json({ success: true, order });
  }

  if (status === "cancelled" && order.orderStatus !== "cancelled" && order.inventoryReduced) {
    await restoreInventory(order);
  }
  order.orderStatus = status;

  const eventDetails = {
    pending: {
      title: "Order Received",
      titleUrdu: "آرڈر موصول ہو گیا",
      description: "We received your order.",
      descriptionUrdu: "ہمیں آپ کا آرڈر موصول ہو گیا ہے۔",
    },
    confirmed: {
      title: "Order Confirmed",
      titleUrdu: "آرڈر کی تصدیق ہو گئی",
      description: "Your order has been confirmed.",
      descriptionUrdu: "آپ کے آرڈر کی تصدیق ہو گئی ہے۔",
    },
    preparing: {
      title: "Order Being Prepared",
      titleUrdu: "آرڈر تیار کیا جا رہا ہے",
      description: "Your order is being prepared for shipping.",
      descriptionUrdu: "آپ کا آرڈر روانگی کے لیے تیار کیا جا رہا ہے۔",
    },
    processing: {
      title: "Order Being Prepared",
      titleUrdu: "آرڈر تیار کیا جا رہا ہے",
      description: "Your order is being prepared for shipping.",
      descriptionUrdu: "آپ کا آرڈر روانگی کے لیے تیار کیا جا رہا ہے۔",
    },
    shipped: {
      title: "Shipped",
      titleUrdu: "پارسل روانہ کر دیا گیا",
      description: "Your order has been shipped.",
      descriptionUrdu: "آپ کا پارسل روانہ کر دیا گیا ہے۔",
    },
    out_for_delivery: {
      title: "Out for Delivery",
      titleUrdu: "پارسل ڈیلیوری کے لیے روانہ ہے",
      description: "Your order is out for delivery.",
      descriptionUrdu: "آپ کا آرڈر ڈیلیوری کے لیے روانہ ہے۔",
    },
    delivered: {
      title: "Delivered",
      titleUrdu: "پارسل پہنچا دیا گیا",
      description: "Your order has been delivered.",
      descriptionUrdu: "آپ کا آرڈر پہنچا دیا گیا ہے۔",
    },
    cancelled: {
      title: "Cancelled",
      titleUrdu: "منسوخ کر دیا گیا",
      description: "Your order has been cancelled.",
      descriptionUrdu: "آپ کا آرڈر منسوخ کر دیا گیا ہے۔",
    },
  };

  const details = eventDetails[status] || {
    title: status.charAt(0).toUpperCase() + status.slice(1),
    titleUrdu: status,
    description: `Order status updated to ${status}.`,
    descriptionUrdu: `آرڈر کی صورتحال تبدیل ہو گئی ہے۔`,
  };

  order.trackingEvents.push({
    status,
    title: details.title,
    titleUrdu: details.titleUrdu,
    description:
      status === "confirmed" && minDays && maxDays
        ? `Your order has been confirmed (Delivery estimated in ${minDays}-${maxDays} working days).`
        : details.description,
    descriptionUrdu: details.descriptionUrdu,
    timestamp: now || new Date(),
  });

  await order.save();

  if (["confirmed", "shipped", "out_for_delivery", "delivered"].includes(status)) {
    const emailType = status === "confirmed" ? "orderConfirmed" : status;
    await sendAndSaveEmailStatus(order, emailType);
  }

  res.json({ success: true, order });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const id = getOrderId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid order ID", 400);
  const { status, note } = req.body;
  const allowed = ["pending", "paid", "verification-needed", "failed"];
  if (!allowed.includes(status)) throw new ApiError("Invalid payment status", 400);
  const order = await Order.findById(id);
  if (!order) throw new ApiError("Order not found", 404);
  if (order.paymentMethod !== "cod" && status === "paid" && !order.paymentProof?.url)
    throw new ApiError("A customer payment screenshot is required before approval.", 409);
  if (order.paymentStatus === "paid" && order.paymentMethod !== "cod" && status !== "paid")
    throw new ApiError("This payment has already been approved.", 409);
  order.paymentStatus = status;
  order.paymentReview = {
    reviewedAt: new Date(),
    reviewedBy: req.admin._id,
    note: String(note || "")
      .trim()
      .slice(0, 500),
  };
  if (order.orderStatus === "cancelled") throw new ApiError("This order was cancelled.", 409);
  let confirmed = false;
  if (status === "paid" && req.body.confirmOrder && order.orderStatus === "pending") {
    const minDays = Number(req.body.minDeliveryDays);
    const maxDays = Number(req.body.maxDeliveryDays);
    if (
      !Number.isSafeInteger(minDays) ||
      !Number.isSafeInteger(maxDays) ||
      minDays < 1 ||
      maxDays < minDays ||
      maxDays > 120
    )
      throw new ApiError("Set a delivery estimate between 1 and 120 working days.", 400);
    const now = new Date();
    order.orderStatus = "confirmed";
    order.confirmedAt = now;
    order.trackingStartedAt = now;
    order.deliveryEstimate = {
      minDays,
      maxDays,
      estimatedStartDate: addWorkingDays(now, minDays),
      estimatedEndDate: addWorkingDays(now, maxDays),
    };
    order.trackingEvents.push({
      status: "confirmed",
      title: "Payment Approved & Order Confirmed",
      titleUrdu: "ادائیگی منظور اور آرڈر کی تصدیق ہو گئی",
      description: `Your payment was approved. Delivery is estimated in ${minDays}–${maxDays} working days.`,
      descriptionUrdu: "آپ کی ادائیگی منظور ہو گئی ہے اور آرڈر کی تصدیق کر دی گئی ہے۔",
      timestamp: now,
    });
    confirmed = true;
  }
  await order.save();
  if (confirmed) await sendAndSaveEmailStatus(order, "orderConfirmed").catch(() => null);
  res.json({ success: true, order });
});

export const resendEmail = asyncHandler(async (req, res) => {
  const id = getOrderId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid order ID", 400);
  const { emailType } = req.body;

  const allowedTypes = [
    "orderReceived",
    "orderConfirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];
  if (!allowedTypes.includes(emailType)) {
    throw new ApiError("Invalid email type", 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError("Order not found", 404);

  const emailRes = await sendOrderStatusEmail(order, emailType);

  order.emailStatus[emailType] = {
    sent: emailRes.success,
    sentAt: emailRes.success ? new Date() : null,
    error: emailRes.success ? null : emailRes.error,
  };

  await order.save();

  if (!emailRes.success) {
    throw new ApiError(`Email failed: ${emailRes.error}`, 500);
  }

  res.json({
    success: true,
    message: `Email '${emailType}' resent successfully`,
    order,
  });
});

/**
 * POST /api/orders/:orderNumber/payment-proof
 * Public endpoint — customer uploads Easypaisa/JazzCash/Meezan screenshot.
 * Accepts multipart/form-data with field "proof".
 */
export const uploadPaymentProof = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  if (!orderNumber) throw new ApiError("Order number is required", 400);

  const order = await Order.findOne({
    _id: req.proofOrderId,
    orderNumber: orderNumber.toUpperCase(),
  });
  if (!order) throw new ApiError("Order not found", 404);
  if (order.paymentMethod === "cod")
    throw new ApiError("Cash on delivery does not require a screenshot.", 400);
  if (order.paymentStatus === "paid" || order.orderStatus === "cancelled")
    throw new ApiError("This order is no longer accepting payment screenshots.", 409);
  if (order.paymentProof?.url && order.paymentStatus === "verification-needed")
    throw new ApiError(
      "Your screenshot is already under review. Please wait for the admin’s response.",
      409,
    );

  const file = req.file;
  if (!file) throw new ApiError("Please upload an image file", 400);
  const bytes = file.buffer;
  const isImage =
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP");
  if (!isImage) throw new ApiError("Upload a valid JPG, PNG or WEBP screenshot.", 400);

  // Upload to Cloudinary under a dedicated folder
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "zoro-pakistan/payment-proofs",
        resource_type: "image",
        type: "authenticated",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) reject(new ApiError("Image upload failed", 502, error.message));
        else resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });

  const nextProof = {
    url: cloudinary.url(uploadResult.public_id, {
      type: "authenticated",
      resource_type: "image",
      secure: true,
      sign_url: true,
    }),
    publicId: uploadResult.public_id,
    uploadedAt: new Date(),
    deliveryType: "authenticated",
  };
  const updated = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: order.paymentStatus,
      "paymentProof.uploadedAt": order.paymentProof?.uploadedAt || null,
    },
    {
      $set: {
        paymentProof: nextProof,
        paymentStatus: "verification-needed",
        paymentReview: { note: "", reviewedAt: null },
      },
    },
    { new: true },
  );
  if (!updated) {
    await cloudinary.uploader
      .destroy(uploadResult.public_id, { type: "authenticated" })
      .catch(() => null);
    throw new ApiError("The payment was updated while uploading. Refresh order tracking.", 409);
  }
  if (order.paymentProof?.publicId)
    await cloudinary.uploader
      .destroy(order.paymentProof.publicId, { type: order.paymentProof.deliveryType || "upload" })
      .catch(() => null);

  res.json({
    success: true,
    message: "Payment proof uploaded successfully",
    uploadedAt: nextProof.uploadedAt,
  });
});
