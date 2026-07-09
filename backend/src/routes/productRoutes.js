import express from "express";
import {
  getProductBySlug,
  getProducts,
  getProductsByGender,
} from "../controllers/productController.js";

export const productRoutes = express.Router();

productRoutes.get("/", getProducts);
productRoutes.get("/men", getProductsByGender("men"));
productRoutes.get("/women", getProductsByGender("women"));
productRoutes.get("/:slug", getProductBySlug);
