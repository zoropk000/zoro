import mongoose from "mongoose";
import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { makeOrderNumber } from "../utils/orderNumber.js";
import { sendOrderStatusEmail } from "../utils/email.js";

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

function getOrderId(req) {
  return req.params.id || req.query.id;
}

export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, paymentMethod, notes } = req.body;
  if (
    !customer?.name ||
    !customer?.phone ||
    !customer?.city ||
    !customer?.address ||
    !customer?.email
  ) {
    throw new ApiError("Customer name, phone, email, city, and address are required", 400);
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
      email: customer.email.trim().toLowerCase(),
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

  // Asynchronously send WhatsApp confirmation (skipped on Vercel)
  if (!order.whatsappConfirmationSent && !process.env.VERCEL) {
    const whatsappModulePath = "../utils/" + "whatsapp.js";
    import(/* @vite-ignore */ whatsappModulePath)
      .then((module) => {
        module
          .sendOrderConfirmationWhatsApp(order)
          .then(async () => {
            const ord = await Order.findById(order._id);
            if (ord) {
              ord.whatsappConfirmationSent = true;
              await ord.save();
            }
          })
          .catch((err) => {
            console.error("WhatsApp confirmation background failure:", err);
          });
      })
      .catch((err) => {
        console.error("Failed to dynamically load WhatsApp module:", err);
      });
  }

  // Asynchronously send "Order Received" email
  sendOrderStatusEmail(order, "orderReceived")
    .then(async (emailRes) => {
      const ord = await Order.findById(order._id);
      if (ord) {
        ord.emailStatus.orderReceived = {
          sent: emailRes.success,
          sentAt: emailRes.success ? new Date() : null,
          error: emailRes.success ? null : emailRes.error,
        };
        await ord.save();
      }
    })
    .catch(async (err) => {
      console.error("Order Received email background failure:", err);
      const ord = await Order.findById(order._id);
      if (ord) {
        ord.emailStatus.orderReceived = {
          sent: false,
          sentAt: null,
          error: err.message || "Failed to send email",
        };
        await ord.save();
      }
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
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
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

  if (isNaN(minDays) || isNaN(maxDays) || minDays <= 0 || maxDays <= 0) {
    throw new ApiError("Minimum and maximum delivery days must be positive numbers", 400);
  }
  if (maxDays < minDays) {
    throw new ApiError("Maximum delivery days cannot be less than minimum delivery days", 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError("Order not found", 404);
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

  // Asynchronously send "Order Confirmed" email
  sendOrderStatusEmail(order, "orderConfirmed")
    .then(async (emailRes) => {
      const ord = await Order.findById(order._id);
      if (ord) {
        ord.emailStatus.orderConfirmed = {
          sent: emailRes.success,
          sentAt: emailRes.success ? new Date() : null,
          error: emailRes.success ? null : emailRes.error,
        };
        await ord.save();
      }
    })
    .catch(async (err) => {
      console.error("Order Confirmed email background failure:", err);
      const ord = await Order.findById(order._id);
      if (ord) {
        ord.emailStatus.orderConfirmed = {
          sent: false,
          sentAt: null,
          error: err.message || "Failed to send email",
        };
        await ord.save();
      }
    });

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
  const { status } = req.body;
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

  if (order.orderStatus === status) {
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
      title: "Shoes Being Prepared",
      titleUrdu: "جوتے تیار کیے جا رہے ہیں",
      description: "Your shoes are being prepared for shipping.",
      descriptionUrdu: "آپ کے جوتے روانگی کے لیے تیار کیے جا رہے ہیں۔",
    },
    processing: {
      title: "Shoes Being Prepared",
      titleUrdu: "جوتے تیار کیے جا رہے ہیں",
      description: "Your shoes are being prepared for shipping.",
      descriptionUrdu: "آپ کے جوتے روانگی کے لیے تیار کیے جا رہے ہیں۔",
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
    description: details.description,
    descriptionUrdu: details.descriptionUrdu,
    timestamp: new Date(),
  });

  await order.save();

  if (["shipped", "out_for_delivery", "delivered"].includes(status)) {
    const emailType = status === "out_for_delivery" ? "out_for_delivery" : status;
    sendOrderStatusEmail(order, emailType)
      .then(async (emailRes) => {
        const ord = await Order.findById(order._id);
        if (ord) {
          ord.emailStatus[emailType] = {
            sent: emailRes.success,
            sentAt: emailRes.success ? new Date() : null,
            error: emailRes.success ? null : emailRes.error,
          };
          await ord.save();
        }
      })
      .catch((err) => {
        console.error(`Failed to send background email for status ${status}:`, err);
      });
  }

  res.json({ success: true, order });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const id = getOrderId(req);
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid order ID", 400);
  const { status } = req.body;
  const allowed = ["pending", "paid", "verification-needed", "failed"];
  if (!allowed.includes(status)) throw new ApiError("Invalid payment status", 400);
  const order = await Order.findByIdAndUpdate(id, { paymentStatus: status }, { new: true });
  if (!order) throw new ApiError("Order not found", 404);
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

  const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() });
  if (!order) throw new ApiError("Order not found", 404);

  const file = req.file;
  if (!file) throw new ApiError("Please upload an image file", 400);

  // Upload to Cloudinary under a dedicated folder
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "zoro-pakistan/payment-proofs",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(new ApiError("Image upload failed", 502, error.message));
        else resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });

  order.paymentProof = {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    uploadedAt: new Date(),
  };
  // Mark payment as needing verification
  order.paymentStatus = "verification-needed";
  await order.save();

  res.json({
    success: true,
    message: "Payment proof uploaded successfully",
    paymentProof: order.paymentProof,
  });
});
