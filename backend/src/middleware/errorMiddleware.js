import mongoose from "mongoose";

export function notFound(req, res, next) {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ success: false, message: "API route not found" });
  }
  next();
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";
  let details = err.details;
  if (err.name === "MulterError") {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? `The image is too large. Maximum upload size is ${err.field === "proof" ? "4" : "5"} MB.`
        : "Please upload one valid screenshot or the allowed product images.";
  }

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((item) => item.message);
  }

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid ID";
  }

  if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
