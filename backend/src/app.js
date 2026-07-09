import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { configureCloudinary } from "./config/cloudinary.js";
import { requireAdmin } from "./middleware/adminMiddleware.js";
import { protectAdmin } from "./middleware/authMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { adminOrderRoutes } from "./routes/adminOrderRoutes.js";
import { adminProductRoutes } from "./routes/adminProductRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { uploadRoutes } from "./routes/uploadRoutes.js";

dotenv.config();
configureCloudinary();

export const app = express();

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function normalizeOrigin(origin) {
  return String(origin || "")
    .trim()
    .replace(/\/$/, "");
}

const allowedOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGINS),
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:3000",
  "https://zoroecom.vercel.app",
].filter(Boolean);

const allowedOriginPatterns = [/^https:\/\/[a-z0-9-]+\.vercel\.app$/i];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    if (allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "StepStyle Pakistan API is running" });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/products", protectAdmin, requireAdmin, adminProductRoutes);
app.use("/api/admin/orders", protectAdmin, requireAdmin, adminOrderRoutes);
app.use("/api/admin/dashboard", protectAdmin, requireAdmin, dashboardRoutes);
app.use("/api/admin/upload", protectAdmin, requireAdmin, uploadRoutes);

app.use(notFound);
app.use(errorHandler);
