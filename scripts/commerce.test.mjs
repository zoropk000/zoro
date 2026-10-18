import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import bcrypt from "bcryptjs";
import { Writable } from "node:stream";
const backendRequire = createRequire(new URL("../backend/package.json", import.meta.url));
const mongoose = backendRequire("mongoose");

// Always creates a disposable MongoDB. Never reads or connects to MONGODB_URI.
const mongoPackage = process.env.ZORO_QA_MONGO_MODULE;
const { MongoMemoryServer } = mongoPackage
  ? await import(pathToFileURL(mongoPackage).href)
  : await import("mongodb-memory-server-core");
process.env.NODE_ENV = "test";
process.env.EMAIL_ENABLED = "false";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.GMAIL_USER = "";
process.env.GMAIL_APP_PASSWORD = "";
process.env.DELIVERY_FEE = "250";
process.env.FREE_DELIVERY_THRESHOLD = "8000";
const { app } = await import("../backend/src/app.js");
const { Product } = await import("../backend/src/models/Product.js");
const { Admin } = await import("../backend/src/models/Admin.js");
const { Customer } = await import("../backend/src/models/Customer.js");
const { Order } = await import("../backend/src/models/Order.js");
const { StoreConfig, defaultCategories } = await import("../backend/src/models/StoreConfig.js");
const { cloudinary } = await import("../backend/src/config/cloudinary.js");

let mongo,
  server,
  base,
  adminCookie,
  customerCookie,
  otherCookie,
  shirt,
  perfume,
  legacy,
  orderNumber;
async function request(path, { method = "GET", body, cookie, origin } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json();
  return {
    status: response.status,
    json,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
function product(name, category, overrides = {}) {
  return {
    name,
    slug: name.toLowerCase().replace(/\W+/g, "-"),
    category,
    gender: "unisex",
    brand: "ZORO Studio",
    price: 3000,
    oldPrice: 4000,
    shortDescription: "Disposable test product",
    images: [
      { url: "http://127.0.0.1:3000/images/category-clothing.webp", publicId: `qa-${name}` },
    ],
    sizes: [
      { size: "M", stock: 5 },
      { size: "L", stock: 3 },
    ],
    colors: ["Ivory", "Black"],
    status: "active",
    featured: true,
    newArrival: true,
    bestSeller: true,
    onSale: true,
    ...overrides,
  };
}
const customerDetails = {
  name: "QA Shopper",
  email: "shopper@example.invalid",
  phone: "03001234567",
  province: "Sindh",
  city: "Karachi",
  address: "Disposable test address",
};
before(
  async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: `zoro_qa_${Date.now()}` });
    await Promise.all([
      Product.init(),
      Customer.init(),
      Admin.init(),
      Order.init(),
      StoreConfig.init(),
    ]);
    await Admin.create({
      name: "QA Admin",
      email: "admin@example.invalid",
      password: await bcrypt.hash("qa-only-password", 4),
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  },
  { timeout: 600000 },
);
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("default catalog exposes all requested departments without writing a config", async () => {
  const response = await request("/storefront");
  assert.equal(response.status, 200);
  assert.equal(response.json.categories.filter((c) => !c.parent).length, 4);
  assert.equal(response.json.categories.length, 31);
  assert.equal(await StoreConfig.countDocuments(), 0);
  assert.equal(response.json.shipping.fee, 250);
});
test("anonymous users cannot edit catalog settings or products", async () => {
  assert.equal((await request("/admin/storefront", { method: "PUT", body: {} })).status, 401);
  assert.equal((await request("/admin/products", { method: "POST", body: {} })).status, 401);
});
test("admin can create a scalable department, brand, genuine promotion and coupon", async () => {
  const login = await request("/admin/auth/login", {
    method: "POST",
    body: { email: "admin@example.invalid", password: "qa-only-password" },
  });
  assert.equal(login.status, 200);
  adminCookie = login.cookie;
  const config = {
    categories: [
      ...defaultCategories,
      {
        name: "Home & Living",
        slug: "home-living",
        parent: "",
        type: "general",
        active: true,
        order: 4,
        image: "",
      },
    ],
    brands: ["ZORO Studio"],
    promotions: [
      {
        id: "qa-active",
        title: "QA timed deal",
        active: true,
        endsAt: new Date(Date.now() + 3600000).toISOString(),
      },
      {
        id: "qa-expired",
        title: "Expired",
        active: true,
        endsAt: new Date(Date.now() - 1000).toISOString(),
      },
    ],
    coupons: [
      { code: "QA10", type: "percent", value: 10, minSpend: 1000, active: true },
      {
        code: "OLD",
        type: "fixed",
        value: 200,
        active: true,
        endsAt: new Date(Date.now() - 1000).toISOString(),
      },
    ],
  };
  const saved = await request("/admin/storefront", {
    method: "PUT",
    cookie: adminCookie,
    body: config,
  });
  assert.equal(saved.status, 200, saved.json.message);
  const publicConfig = (await request("/storefront")).json;
  assert.equal(publicConfig.promotions.length, 1);
  assert.equal(publicConfig.categories.filter((c) => !c.parent).length, 5);
  assert.equal(publicConfig.coupons, undefined);
});
test("admin can create clothing and perfume products with category-specific stock", async () => {
  const created = await request("/admin/products", {
    method: "POST",
    cookie: adminCookie,
    body: product("QA linen shirt", "clothing", { subcategory: "shirts" }),
  });
  assert.equal(created.status, 201, created.json.message);
  shirt = created.json.product;
  assert.equal(shirt.totalStock, 8);
  assert.equal(shirt.category, "clothing");
  const fragrance = await request("/admin/products", {
    method: "POST",
    cookie: adminCookie,
    body: product("QA amber perfume", "perfumes", {
      price: 5000,
      oldPrice: 10000,
      subcategory: "unisex-perfumes",
      fragranceType: "Eau de Parfum",
      sizes: [
        { size: "50ml", stock: 2 },
        { size: "100ml", stock: 3 },
      ],
      colors: [],
    }),
  });
  assert.equal(fragrance.status, 201, fragrance.json.message);
  perfume = fragrance.json.product;
  const raw = product("QA legacy sneaker", undefined, {
    gender: "men",
    sizes: [{ size: "42", stock: 3 }],
    colors: [],
  });
  delete raw.category;
  legacy = (
    await Product.collection.insertOne({
      ...raw,
      totalStock: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  ).insertedId;
});
test("legacy shoes remain visible while categories, facets, literal search and global discount sorting work", async () => {
  const shoes = await request("/products?category=shoes");
  assert.equal(shoes.json.products.length, 1);
  assert.equal(String(shoes.json.products[0]._id), String(legacy));
  const clothes = await request(
    "/products?category=clothing&size=M&brand=ZORO%20Studio&color=Ivory",
  );
  assert.equal(clothes.json.products.length, 1);
  const fragrances = await request(
    "/products?category=perfumes&bottleSize=100ml&fragranceType=Eau%20de%20Parfum",
  );
  assert.equal(fragrances.json.products.length, 1);
  const facets = await request("/storefront/facets?category=perfumes");
  assert.deepEqual(facets.json.sizes.sort(), ["100ml", "50ml"]);
  const sorted = await request("/products?sort=discount&limit=1");
  assert.equal(sorted.json.products[0]._id, perfume._id);
  assert.equal((await request("/products?search=%5B")).json.products.length, 0);
  assert.equal((await request("/products?ids=invalid")).json.products.length, 0);
  assert.equal((await request("/products?rating=4")).json.products.length, 0);
});
test("invalid categories and destructive category removal are rejected", async () => {
  const invalid = await request("/admin/products", {
    method: "POST",
    cookie: adminCookie,
    body: product("QA invalid product", "does-not-exist"),
  });
  assert.equal(invalid.status, 400);
  const config = (await request("/admin/storefront", { cookie: adminCookie })).json;
  config.categories = config.categories.filter((c) => c.slug !== "shirts");
  assert.equal(
    (await request("/admin/storefront", { method: "PUT", cookie: adminCookie, body: config }))
      .status,
    409,
  );
});
test("customer registration, password hashing, duplicate protection and separate auth work", async () => {
  const result = await request("/account/register", {
    method: "POST",
    body: { name: "QA Shopper", email: customerDetails.email, password: "qa-customer-password" },
  });
  assert.equal(result.status, 201);
  customerCookie = result.cookie;
  const stored = await Customer.findOne({ email: customerDetails.email }).select("+password");
  assert.notEqual(stored.password, "qa-customer-password");
  assert.equal(result.json.customer.password, undefined);
  assert.equal(
    (
      await request("/account/register", {
        method: "POST",
        body: { name: "QA", email: customerDetails.email, password: "qa-customer-password" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/account/login", {
        method: "POST",
        body: { email: customerDetails.email, password: "wrong" },
      })
    ).status,
    401,
  );
  assert.equal((await request("/admin/storefront", { cookie: customerCookie })).status, 401);
  assert.equal((await request("/account/me", { cookie: adminCookie })).status, 401);
});
test("wishlists persist per account and foreign origins cannot mutate sessions", async () => {
  assert.equal(
    (
      await request("/account/wishlist", {
        method: "PUT",
        cookie: customerCookie,
        body: { ids: [shirt._id, perfume._id] },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/account/me", { cookie: customerCookie })).json.customer.wishlist.length,
    2,
  );
  assert.equal(
    (
      await request("/account/wishlist", {
        method: "PUT",
        cookie: customerCookie,
        origin: "https://untrusted.invalid",
        body: { ids: [] },
      })
    ).status,
    403,
  );
  const other = await request("/account/register", {
    method: "POST",
    body: { name: "Other QA", email: "other@example.invalid", password: "other-qa-password" },
  });
  otherCookie = other.cookie;
  assert.equal(other.json.customer.wishlist.length, 0);
});
test("coupons enforce expiry, minimum spend and server-side totals", async () => {
  assert.equal(
    (await request("/coupons/validate", { method: "POST", body: { code: "OLD", subtotal: 3000 } }))
      .status,
    400,
  );
  assert.equal(
    (await request("/coupons/validate", { method: "POST", body: { code: "QA10", subtotal: 500 } }))
      .status,
    400,
  );
  const order = await request("/orders", {
    method: "POST",
    cookie: customerCookie,
    body: {
      customer: customerDetails,
      items: [{ productId: shirt._id, size: "M", color: "Ivory", quantity: 1, price: 1 }],
      paymentMethod: "cod",
      couponCode: "QA10",
      subtotal: 1,
      total: 1,
    },
  });
  assert.equal(order.status, 201, order.json.message);
  assert.equal(order.json.order.total, 2950);
  orderNumber = order.json.order.orderNumber;
  assert.equal((await Product.findById(shirt._id)).sizes.find((s) => s.size === "M").stock, 4);
  const stored = await Order.findOne({ orderNumber });
  assert.equal(stored.items[0].color, "Ivory");
  assert.equal(stored.customer.province, "Sindh");
  assert.equal(stored.discount, 300);
});
test("order history is account-scoped and guest tracking remains protected by phone", async () => {
  assert.equal(
    (await request("/account/orders", { cookie: customerCookie })).json.orders.length,
    1,
  );
  assert.equal((await request("/account/orders", { cookie: otherCookie })).json.orders.length, 0);
  assert.equal(
    (
      await request("/orders/track", {
        method: "POST",
        body: { orderNumber, phone: "03009999999" },
      })
    ).status,
    404,
  );
  const tracked = await request("/orders/track", {
    method: "POST",
    body: { orderNumber, phone: customerDetails.phone },
  });
  assert.equal(tracked.status, 200);
  assert.equal(tracked.json.order.discount, 300);
});
test("guest COD, stock exhaustion and concurrent oversell protection work", async () => {
  const requestBody = {
    customer: customerDetails,
    items: [{ productId: perfume._id, size: "50ml", quantity: 2 }],
    paymentMethod: "cod",
  };
  const outcomes = await Promise.all([
    request("/orders", { method: "POST", body: requestBody }),
    request("/orders", { method: "POST", body: requestBody }),
  ]);
  assert.equal(outcomes.filter((r) => r.status === 201).length, 1);
  assert.equal(outcomes.filter((r) => r.status === 409).length, 1);
  const remaining = await Product.findById(perfume._id);
  assert.equal(remaining.sizes.find((s) => s.size === "50ml").stock, 0);
  assert.equal(remaining.totalStock, 3);
  assert.equal(
    (await request("/account/orders", { cookie: customerCookie })).json.orders.length,
    1,
  );
});
test("a failed multi-line reservation restores previously reserved stock", async () => {
  const beforeStock = (await Product.findById(shirt._id)).totalStock;
  const result = await request("/orders", {
    method: "POST",
    body: {
      customer: customerDetails,
      items: [
        { productId: shirt._id, size: "M", color: "Black", quantity: 3 },
        { productId: shirt._id, size: "M", color: "Ivory", quantity: 3 },
      ],
      paymentMethod: "cod",
    },
  });
  assert.equal(result.status, 409);
  assert.equal((await Product.findById(shirt._id)).totalStock, beforeStock);
});
test("admin product edits preserve unrelated data and new departments need no code changes", async () => {
  const created = await request("/admin/products", {
    method: "POST",
    cookie: adminCookie,
    body: product("QA home tray", "home-living", {
      sizes: [{ size: "One size", stock: 1 }],
      colors: [],
    }),
  });
  assert.equal(created.status, 201);
  const edited = await request(`/admin/products/by-id?id=${shirt._id}`, {
    method: "PUT",
    cookie: adminCookie,
    body: { ...shirt, price: 3200 },
  });
  assert.equal(edited.status, 200);
  assert.equal(await Order.countDocuments(), 2);
  assert.equal((await request("/products?category=home-living")).json.products.length, 1);
  const customers = await request("/admin/dashboard/customers", { cookie: adminCookie });
  assert.equal(customers.status, 200);
  assert.equal(customers.json.accounts.length, 2);
});

test("prepaid screenshots require order authorization and admin approval starts customer tracking", async () => {
  // Exercise the complete HTTP upload/controller flow while replacing only the external storage transport.
  // No screenshots or messages are sent to a real Cloudinary or email account.
  cloudinary.config({
    cloud_name: "qa-only",
    api_key: "qa-only",
    api_secret: randomBytes(32).toString("hex"),
  });
  const originalUpload = cloudinary.uploader.upload_stream;
  const originalDestroy = cloudinary.uploader.destroy;
  cloudinary.uploader.upload_stream = (options, callback) =>
    new Writable({
      write(chunk, encoding, done) {
        done();
      },
      final(done) {
        callback(null, {
          public_id: `qa-proof-${Date.now()}`,
          secure_url: "https://example.invalid/proof.png",
        });
        done();
      },
    });
  cloudinary.uploader.destroy = async () => ({ result: "ok" });
  try {
    const created = await request("/orders", {
      method: "POST",
      body: {
        customer: customerDetails,
        items: [{ productId: perfume._id, size: "100ml", quantity: 1 }],
        paymentMethod: "easypaisa",
      },
    });
    assert.equal(created.status, 201, created.json.message);
    const { orderNumber: number, paymentProofToken: token } = created.json.order;
    assert.ok(token);
    const stored = await Order.findOne({ orderNumber: number });
    assert.equal(
      (
        await request(`/admin/orders/status?id=${stored._id}`, {
          method: "PATCH",
          cookie: adminCookie,
          body: { status: "confirmed" },
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request(`/admin/orders/payment-status?id=${stored._id}`, {
          method: "PATCH",
          cookie: adminCookie,
          body: { status: "paid" },
        })
      ).status,
      409,
    );
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WQAAAABJRU5ErkJggg==",
      "base64",
    );
    const sendProof = async (tokenValue, content = png, type = "image/png") => {
      const form = new FormData();
      form.append("proof", new Blob([content], { type }), "qa-proof.png");
      const response = await fetch(`${base}/api/orders/${number}/payment-proof`, {
        method: "POST",
        headers: tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {},
        body: form,
      });
      return { status: response.status, json: await response.json() };
    };
    assert.equal((await sendProof()).status, 401);
    const tooLarge = await sendProof(token, Buffer.alloc(4 * 1024 * 1024 + 1));
    assert.equal(tooLarge.status, 400);
    assert.match(tooLarge.json.message, /4 MB/);
    assert.equal((await sendProof(token, Buffer.from("not an image"))).status, 400);
    assert.equal((await sendProof(token)).status, 200);
    assert.equal((await sendProof(token)).status, 409);
    const adminOrder = (
      await request(`/admin/orders/by-id?id=${stored._id}`, { cookie: adminCookie })
    ).json.order;
    assert.ok(adminOrder.paymentProof.url.includes("authenticated"));
    assert.ok(adminOrder.paymentProof.uploadedAt);
    const tracked = (
      await request("/orders/track", {
        method: "POST",
        body: { orderNumber: number, phone: customerDetails.phone },
      })
    ).json.order;
    assert.equal(tracked.hasPaymentProof, true);
    assert.equal(tracked.paymentStatus, "verification-needed");
    assert.equal(tracked.paymentProof, undefined);
    assert.equal(
      (
        await request(`/admin/orders/payment-status?id=${stored._id}`, {
          method: "PATCH",
          cookie: adminCookie,
          body: { status: "failed", note: "Please send a clearer transaction reference." },
        })
      ).status,
      200,
    );
    assert.equal((await sendProof(token)).status, 200);
    const approved = await request(`/admin/orders/payment-status?id=${stored._id}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "paid", confirmOrder: true, minDeliveryDays: 3, maxDeliveryDays: 5 },
    });
    assert.equal(approved.status, 200, approved.json.message);
    assert.equal(approved.json.order.orderStatus, "confirmed");
    assert.ok(approved.json.order.trackingStartedAt);
    assert.equal(approved.json.order.deliveryEstimate.maxDays, 5);
    assert.equal((await sendProof(token)).status, 409);
    assert.equal(
      (
        await request(`/admin/orders/status?id=${stored._id}`, {
          method: "PATCH",
          cookie: adminCookie,
          body: { status: "shipped" },
        })
      ).status,
      200,
    );
    const afterApproval = (
      await request("/orders/track", {
        method: "POST",
        body: { orderNumber: number, phone: customerDetails.phone },
      })
    ).json.order;
    assert.equal(afterApproval.paymentStatus, "paid");
    assert.equal(afterApproval.orderStatus, "shipped");
    assert.equal(afterApproval.paymentProofToken, undefined);
  } finally {
    cloudinary.uploader.upload_stream = originalUpload;
    cloudinary.uploader.destroy = originalDestroy;
  }
});

test("retrying the same checkout does not create a second order or reduce stock again", async () => {
  const checkoutKey = randomUUID();
  const body = {
    checkoutKey,
    customer: customerDetails,
    items: [{ productId: shirt._id, size: "M", color: "Ivory", quantity: 1 }],
    paymentMethod: "cod",
  };
  const count = await Order.countDocuments();
  const first = await request("/orders", { method: "POST", body });
  const stock = (await Product.findById(shirt._id)).totalStock;
  const retry = await request("/orders", { method: "POST", body });
  assert.equal(first.status, 201);
  assert.equal(retry.status, 201);
  assert.equal(first.json.order.orderNumber, retry.json.order.orderNumber);
  assert.equal(await Order.countDocuments(), count + 1);
  assert.equal((await Product.findById(shirt._id)).totalStock, stock);
});

test("customer and admin email failures are retained independently without failing checkout", async () => {
  const order = await Order.findOne().sort({ createdAt: -1 });
  assert.ok(order);
  for (const type of ["orderReceived", "adminOrderReceived"]) {
    assert.equal(order.emailStatus[type].sent, false);
    assert.equal(order.emailStatus[type].sentAt, null);
    assert.equal(order.emailStatus[type].messageId, null);
    assert.match(order.emailStatus[type].error, /disabled or not configured/);
  }
  assert.equal(
    (
      await request(`/admin/orders/${order._id}/resend-email`, {
        method: "POST",
        body: { emailType: "adminOrderReceived" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request(`/admin/orders/${order._id}/resend-email`, {
        method: "POST",
        cookie: adminCookie,
        body: { emailType: "arbitrary-recipient" },
      })
    ).status,
    400,
  );
});
