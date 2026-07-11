import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ["men", "women"], required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true, index: true },
      email: { type: String, trim: true, default: "" },
      city: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      landmark: { type: String, trim: true, default: "" },
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cod", "easypaisa_jazzcash", "meezan_bank"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "verification-needed", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    notes: { type: String, trim: true, default: "" },
    paymentProof: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },
    inventoryReduced: { type: Boolean, default: true },
    deliveryEstimate: {
      minDays: { type: Number, default: null },
      maxDays: { type: Number, default: null },
      estimatedStartDate: { type: Date, default: null },
      estimatedEndDate: { type: Date, default: null },
    },
    confirmedAt: { type: Date, default: null },
    trackingStartedAt: { type: Date, default: null },
    trackingEvents: [
      {
        status: { type: String, required: true },
        title: { type: String, required: true },
        titleUrdu: { type: String, required: true },
        description: { type: String, required: true },
        descriptionUrdu: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    whatsappConfirmationSent: { type: Boolean, default: false },
    emailStatus: {
      orderReceived: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
      orderConfirmed: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
      shipped: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
      out_for_delivery: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
      delivered: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
    },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentMethod: 1 });

export const Order = mongoose.model("Order", orderSchema);
