// Explicit, disposable local QA environment. It never connects to the configured store database.
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { createRequire } from "node:module";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { Writable } from "node:stream";
const backendRequire = createRequire(new URL("../backend/package.json", import.meta.url));
const mongoose = backendRequire("mongoose");
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.GMAIL_USER = "";
process.env.GMAIL_APP_PASSWORD = "";
process.env.FRONTEND_URL = "http://127.0.0.1:3000,http://localhost:3000";
const { app } = await import("../backend/src/app.js");
const { Product } = await import("../backend/src/models/Product.js");
const { Admin } = await import("../backend/src/models/Admin.js");
const { StoreConfig, defaultCategories } = await import("../backend/src/models/StoreConfig.js");
const { cloudinary } = await import("../backend/src/config/cloudinary.js");
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri(), { dbName: "zoro_disposable_preview" });
await Admin.create({
  name: "Preview administrator",
  email: "qa-admin@example.invalid",
  password: await bcrypt.hash("Preview-Only-Admin-2026", 4),
});
await StoreConfig.create({
  categories: defaultCategories,
  brands: ["ZORO Studio"],
  coupons: [{ code: "PREVIEW10", type: "percent", value: 10, minSpend: 1000, active: true }],
  promotions: [
    {
      id: "qa-only",
      title: "Preview weekend edit",
      subtitle: "Disposable QA promotion. This is not a live store offer.",
      category: "",
      active: true,
      startsAt: new Date(Date.now() - 60000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
});
const fixtures = [
  [
    "QA Linen Blend Shirt",
    "clothing",
    "shirts",
    3290,
    4200,
    ["S", "M", "L", "XL"],
    ["Ivory", "Sage"],
    "men",
  ],
  [
    "QA Everyday Sneakers",
    "shoes",
    "sneakers",
    4990,
    6500,
    ["39", "40", "41", "42", "43"],
    ["Cream"],
    "unisex",
  ],
  [
    "QA Amber Signature",
    "perfumes",
    "unisex-perfumes",
    5490,
    7900,
    ["50ml", "100ml"],
    [],
    "unisex",
  ],
  ["QA Everyday Shoulder Bag", "accessories", "bags", 3990, 4900, ["One size"], ["Tan"], "women"],
  [
    "QA Relaxed Cotton Shirt",
    "clothing",
    "shirts",
    2790,
    3500,
    ["S", "M", "L"],
    ["White"],
    "unisex",
  ],
  [
    "QA Classic Low-Top Shoes",
    "shoes",
    "casual-shoes",
    4290,
    5500,
    ["40", "41", "42"],
    ["Ivory"],
    "men",
  ],
  [
    "QA Golden Hour Eau de Parfum",
    "perfumes",
    "womens-fragrances",
    6390,
    8200,
    ["30ml", "50ml", "100ml"],
    [],
    "women",
  ],
  [
    "QA Weekend Accessories Set",
    "accessories",
    "gift-sets",
    2990,
    3900,
    ["One size"],
    ["Tan"],
    "unisex",
  ],
];
await Product.create(
  fixtures.map(([name, category, subcategory, price, oldPrice, sizes, colors, gender]) => ({
    name,
    slug: name.toLowerCase().replace(/\W+/g, "-"),
    category,
    subcategory: category === "accessories" ? "bags" : subcategory,
    brand: "ZORO Studio",
    price,
    oldPrice,
    gender,
    images: [
      { url: `http://127.0.0.1:3000/images/category-${category}.webp`, publicId: `qa-${name}` },
    ],
    sizes: sizes.map((size) => ({ size, stock: 8 })),
    colors,
    status: "active",
    featured: true,
    bestSeller: true,
    newArrival: true,
    onSale: true,
    fragranceType: category === "perfumes" ? "Eau de Parfum" : "",
    shortDescription: "Disposable QA fixture for testing this storefront. Not a live catalog item.",
    description: "Disposable QA fixture. The real store data is not used by this preview.",
  })),
);

// Test-only image transport lets the UI verify receipt upload/review without sending a file externally.
const imageData = new Map();
cloudinary.uploader.upload_stream = (options, callback) => {
  const chunks = [];
  const id = `qa-proof-${randomBytes(8).toString("hex")}`;
  return new Writable({
    write(chunk, encoding, done) {
      chunks.push(chunk);
      done();
    },
    final(done) {
      imageData.set(id, `data:image/png;base64,${Buffer.concat(chunks).toString("base64")}`);
      callback(null, { public_id: id });
      done();
    },
  });
};
cloudinary.url = (id) => imageData.get(id) || "";
cloudinary.uploader.destroy = async (id) => {
  imageData.delete(id);
  return { result: "ok" };
};
const server = app.listen(Number(process.env.ZORO_QA_PORT || 0), "127.0.0.1", () =>
  console.log(
    `Disposable QA API ready at http://127.0.0.1:${server.address().port} — no live data or external uploads.`,
  ),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.stdin.on("data", stop);
