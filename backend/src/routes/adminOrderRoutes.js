import express from "express";
import {
  adminGetOrder,
  adminGetOrders,
  updateOrderStatus,
  updatePaymentStatus,
  confirmOrder,
  resendEmail,
} from "../controllers/orderController.js";

export const adminOrderRoutes = express.Router();

adminOrderRoutes.get("/", adminGetOrders);
adminOrderRoutes.get("/by-id", adminGetOrder);
adminOrderRoutes.patch("/status", updateOrderStatus);
adminOrderRoutes.patch("/payment-status", updatePaymentStatus);
adminOrderRoutes.get("/:id", adminGetOrder);
adminOrderRoutes.patch("/:id/status", updateOrderStatus);
adminOrderRoutes.patch("/:id/payment-status", updatePaymentStatus);
adminOrderRoutes.patch("/:id/confirm", confirmOrder);
adminOrderRoutes.post("/:id/resend-email", resendEmail);
