import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { test } from "node:test";

test("API stays available and returns actionable 503 JSON when MongoDB fails", async () => {
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = "mongodb://127.0.0.1:1/disposable_failure_fixture";
  const requireBackend = createRequire(new URL("../backend/package.json", import.meta.url));
  const mongoose = requireBackend("mongoose");
  const originalConnect = mongoose.connect;
  let attempts = 0;
  mongoose.connect = async () => {
    attempts++;
    throw new Error("Simulated database outage; no network connection attempted");
  };
  const { default: handler } = await import("../api/[...path].js");
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).success, true);
    assert.equal(attempts, 0);

    await Promise.all(
      ["/api/products", "/api/storefront", "/api/storefront/facets?"].map(async (path) => {
        const response = await fetch(base + path);
        assert.equal(response.status, 503);
        assert.equal(response.headers.get("retry-after"), "5");
        const payload = await response.json();
        assert.equal(payload.success, false);
        assert.match(payload.message, /MONGODB_URI in backend\/\.env/);
        assert.ok(!JSON.stringify(payload).includes(process.env.MONGODB_URI));
      }),
    );
    assert.equal(attempts, 1, "concurrent/repeated requests share one connection attempt");
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    mongoose.connect = originalConnect;
  }
});
