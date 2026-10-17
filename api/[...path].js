import { app } from "../backend/src/app.js";
import { connectDB } from "../backend/src/config/db.js";

let connectionPromise;
let retryAfter = 0;

function getConnection() {
  if (Date.now() < retryAfter) {
    return Promise.reject(new Error("Database reconnect is waiting for a retry"));
  }
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = undefined;
      retryAfter = Date.now() + 5000;
      console.error("Database connection failed:", error.message);
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
    res.setHeader("Retry-After", "5");
    return sendJson(res, 503, {
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "The store database is temporarily unavailable. Please try again shortly."
          : "Store database unavailable. Check MONGODB_URI in backend/.env, Atlas cluster availability and network access, then restart npm run dev.",
    });
  }
}
