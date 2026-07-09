import express from "express";
import {
  adminGetProduct,
  adminGetProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  updateProductInventory,
  updateProductStatus,
} from "../controllers/productController.js";

export const adminProductRoutes = express.Router();

adminProductRoutes.get("/", adminGetProducts);
adminProductRoutes.post("/", createProduct);
adminProductRoutes.get("/:id", adminGetProduct);
adminProductRoutes.put("/:id", updateProduct);
adminProductRoutes.delete("/:id", deleteProduct);
adminProductRoutes.patch("/:id/status", updateProductStatus);
adminProductRoutes.patch("/:id/inventory", updateProductInventory);
