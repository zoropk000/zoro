import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter(req, file, cb) {
    if (!allowed.has(file.mimetype)) {
      cb(new ApiError("Only JPG, JPEG, PNG, and WEBP images are allowed.", 400));
      return;
    }
    cb(null, true);
  },
});
