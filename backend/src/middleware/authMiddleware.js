import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protectAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.adminToken;
  if (!token) throw new ApiError("Authentication required", 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) throw new ApiError("Authentication required", 401);
    req.admin = admin;
    next();
  } catch {
    throw new ApiError("Authentication required", 401);
  }
});
