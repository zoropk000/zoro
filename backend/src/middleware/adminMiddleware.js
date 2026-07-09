import { ApiError } from "../utils/ApiError.js";

export function requireAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "admin") {
    return next(new ApiError("Admin access required", 403));
  }
  next();
}
