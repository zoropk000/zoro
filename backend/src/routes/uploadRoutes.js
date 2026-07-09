import express from "express";
import { deleteImage, uploadImages } from "../controllers/uploadController.js";
import { upload } from "../middleware/uploadMiddleware.js";

export const uploadRoutes = express.Router();

uploadRoutes.post("/", upload.array("images", 8), uploadImages);
uploadRoutes.delete("/", deleteImage);
