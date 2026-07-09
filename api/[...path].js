import { app } from "../backend/src/app.js";
import { connectDB } from "../backend/src/config/db.js";

let connectionPromise;

function getConnection() {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

export default async function handler(req, res) {
  try {
    if (req.method === "OPTIONS" || req.url?.startsWith("/api/health")) {
      return app(req, res);
    }

    await getConnection();
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
}
