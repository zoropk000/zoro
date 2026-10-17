import express from "express";
import multer from "multer";
import {
  createOrder,
  trackOrder,
  uploadPaymentProof,
  authorizePaymentProof,
} from "../controllers/orderController.js";
import { ApiError } from "../utils/ApiError.js";
const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter(req, file, done) {
    done(
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
        ? null
        : new ApiError("Upload a JPG, PNG or WEBP screenshot.", 400),
      true,
    );
  },
});

export const orderRoutes = express.Router();

orderRoutes.post("/", createOrder);
orderRoutes.post("/track", trackOrder);
orderRoutes.post(
  "/:orderNumber/payment-proof",
  authorizePaymentProof,
  proofUpload.single("proof"),
  uploadPaymentProof,
);
