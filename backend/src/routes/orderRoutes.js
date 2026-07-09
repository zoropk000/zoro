import express from "express";
import { createOrder, trackOrder } from "../controllers/orderController.js";

export const orderRoutes = express.Router();

orderRoutes.post("/", createOrder);
orderRoutes.post("/track", trackOrder);
