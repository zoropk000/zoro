import express from "express";
import multer from "multer";
import { createOrder, trackOrder, uploadPaymentProof } from "../controllers/orderController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const orderRoutes = express.Router();

orderRoutes.post("/", createOrder);
orderRoutes.post("/track", trackOrder);
orderRoutes.post("/:orderNumber/payment-proof", upload.single("proof"), uploadPaymentProof);
