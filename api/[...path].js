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

function sendJson(res, statusCode, payload) {
  if (typeof res.status === "function") {
    return res.status(statusCode).json(payload);
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(payload));
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
    return sendJson(res, 500, {
      success: false,
      message: "Database connection failed",
    });
  }
}
