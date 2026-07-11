import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeWhatsApp } from "./utils/whatsapp.js";

dotenv.config();

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`ZORO API listening on port ${port}`);
      initializeWhatsApp();
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
