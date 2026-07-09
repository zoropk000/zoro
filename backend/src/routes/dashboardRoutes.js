import express from "express";
import {
  customers,
  genderSales,
  orderStatuses,
  ordersOverTime,
  paymentMethods,
  revenue,
  summary,
  topProducts,
} from "../controllers/dashboardController.js";

export const dashboardRoutes = express.Router();

dashboardRoutes.get("/summary", summary);
dashboardRoutes.get("/revenue", revenue);
dashboardRoutes.get("/orders", ordersOverTime);
dashboardRoutes.get("/payment-methods", paymentMethods);
dashboardRoutes.get("/order-statuses", orderStatuses);
dashboardRoutes.get("/gender-sales", genderSales);
dashboardRoutes.get("/top-products", topProducts);
dashboardRoutes.get("/customers", customers);
