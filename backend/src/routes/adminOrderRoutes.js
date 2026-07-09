import express from "express";
import {
  adminGetOrder,
  adminGetOrders,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controllers/orderController.js";

export const adminOrderRoutes = express.Router();

adminOrderRoutes.get("/", adminGetOrders);
adminOrderRoutes.get("/:id", adminGetOrder);
adminOrderRoutes.patch("/:id/status", updateOrderStatus);
adminOrderRoutes.patch("/:id/payment-status", updatePaymentStatus);
