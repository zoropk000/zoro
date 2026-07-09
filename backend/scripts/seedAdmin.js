import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";
import { Admin } from "../src/models/Admin.js";

dotenv.config();

async function seed() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required");
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  await connectDB();
  const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log("Admin already exists:", ADMIN_EMAIL);
    process.exit(0);
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await Admin.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    password,
  });
  console.log("Admin created:", ADMIN_EMAIL);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
