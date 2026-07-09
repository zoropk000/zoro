import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function signToken(adminId) {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError("Email and password are required", 400);

  const admin = await Admin.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!admin) throw new ApiError("Invalid email or password", 401);

  const matches = await bcrypt.compare(password, admin.password);
  if (!matches) throw new ApiError("Invalid email or password", 401);

  setAuthCookie(res, signToken(admin._id));
  res.json({
    success: true,
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("adminToken");
  res.json({ success: true, message: "Logged out" });
});
