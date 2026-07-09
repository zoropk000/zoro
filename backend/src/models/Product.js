import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 140,
    },
    nameUrdu: { type: String, trim: true, maxlength: 180, default: "" },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    gender: { type: String, required: true, enum: ["men", "women"] },
    description: { type: String, trim: true, default: "" },
    descriptionUrdu: { type: String, trim: true, default: "" },
    shortDescription: { type: String, trim: true, default: "" },
    shortDescriptionUrdu: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: [1, "Price must be greater than zero"] },
    oldPrice: { type: Number, min: 0, default: undefined },
    images: {
      type: [imageSchema],
      validate: {
        validator(images) {
          return this.status !== "active" || images.length > 0;
        },
        message: "Upload at least one product image.",
      },
      default: [],
    },
    sizes: {
      type: [sizeSchema],
      validate: {
        validator(sizes) {
          const seen = new Set();
          return (
            sizes.length > 0 &&
            sizes.every((row) => {
              if (!row.size || seen.has(row.size)) return false;
              seen.add(row.size);
              return row.stock >= 0;
            })
          );
        },
        message: "Sizes must be unique and stock cannot be negative.",
      },
      default: [],
    },
    colors: { type: [String], default: [] },
    totalStock: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["active", "draft", "out-of-stock"], default: "draft" },
    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
      default: undefined,
    },
  },
  { timestamps: true },
);

productSchema.pre("validate", function calculateStock(next) {
  this.totalStock = this.sizes.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  if (this.totalStock === 0 && this.status === "active") {
    this.status = "out-of-stock";
  }
  if (!this.sku) this.sku = undefined;
  next();
});

productSchema.index({ gender: 1, status: 1, createdAt: -1 });
productSchema.index({ name: "text", shortDescription: "text", colors: "text", sku: "text" });

export const Product = mongoose.model("Product", productSchema);
