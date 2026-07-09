import express from "express";
import { login, logout, me } from "../controllers/authController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

export const authRoutes = express.Router();

authRoutes.post("/login", login);
authRoutes.post("/logout", protectAdmin, logout);
authRoutes.get("/me", protectAdmin, me);
