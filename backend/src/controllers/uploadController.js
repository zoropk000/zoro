import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function uploadBuffer(file) {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      reject(new ApiError("Cloudinary is not configured", 500));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "zoro-pakistan/products",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(new ApiError("Image upload failed", 502, error.message));
        else resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw new ApiError("Please select at least one image", 400);
  if (files.length > 8) throw new ApiError("You can upload up to 8 images", 400);

  const uploaded = await Promise.all(files.map(uploadBuffer));
  res.status(201).json({
    success: true,
    images: uploaded.map((img) => ({ url: img.secure_url, publicId: img.public_id })),
  });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw new ApiError("publicId is required", 400);
  await cloudinary.uploader.destroy(publicId);
  res.json({ success: true, message: "Image deleted" });
});
