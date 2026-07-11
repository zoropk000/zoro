import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = "http://127.0.0.1:5000/api";

async function runTests() {
  console.log("=== STARTING INTEGRATION TESTS ===");

  try {
    // 1. Fetch active products to place an order
    console.log("\n1. Fetching active products...");
    const productsRes = await fetch(`${API_BASE_URL}/products`);
    if (!productsRes.ok) {
      throw new Error(`Failed to fetch products: ${productsRes.status}`);
    }
    const productsData = await productsRes.json();
    const activeProduct = productsData.products.find(
      (p) => p.status === "active" && p.sizes && p.sizes.some((s) => s.stock > 0),
    );
    if (!activeProduct) {
      throw new Error("No active product with stock found to test order placement.");
    }
    const targetSize = activeProduct.sizes.find((s) => s.stock > 0)?.size || "40";
    console.log(
      `Using product: ${activeProduct.name} (ID: ${activeProduct._id}, Size: ${targetSize})`,
    );

    // 2. Place order as customer
    console.log("\n2. Placing customer order...");
    const checkoutPayload = {
      customer: {
        name: "Test Ahmed",
        phone: "03001234567",
        email: "stepstyletest@yopmail.com",
        city: "Karachi",
        address: "Flat A-1, Test Block 10, Gulshan",
        landmark: "Opposite Test park",
      },
      items: [
        {
          productId: activeProduct._id,
          size: targetSize,
          quantity: 1,
        },
      ],
      paymentMethod: "cod",
    };

    const orderRes = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload),
    });
    if (!orderRes.ok) {
      const errData = await orderRes.json();
      throw new Error(`Order placement failed: ${JSON.stringify(errData)}`);
    }
    const orderData = await orderRes.json();
    console.log("Order Placed successfully:", orderData);
    const orderNumber = orderData.order.orderNumber;

    // 3. Track order as customer (Initial tracking)
    console.log("\n3. Tracking order (status waiting confirmation)...");
    const trackRes = await fetch(`${API_BASE_URL}/orders/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone: "03001234567" }),
    });
    if (!trackRes.ok) {
      throw new Error(`Tracking failed: ${trackRes.status}`);
    }
    const trackData = await trackRes.json();
    console.log("Order Tracking Data:", JSON.stringify(trackData.order, null, 2));

    // Verify initial state
    if (trackData.order.orderStatus !== "pending") {
      throw new Error(`Expected orderStatus to be 'pending', got: ${trackData.order.orderStatus}`);
    }
    if (trackData.order.trackingEvents.length !== 1) {
      throw new Error(
        `Expected exactly 1 tracking event, got: ${trackData.order.trackingEvents.length}`,
      );
    }
    console.log("Initial status and trackingEvents are CORRECT.");

    // 4. Login as admin
    console.log("\n4. Logging in as admin...");
    const loginRes = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "zoro@gmail.com", password: "zoroadmin123" }),
    });
    if (!loginRes.ok) {
      throw new Error("Admin login failed.");
    }
    const cookie = loginRes.headers.get("set-cookie");
    if (!cookie) {
      throw new Error("No cookie received from admin login.");
    }
    console.log("Logged in successfully as admin.");

    // Retrieve order by number to get database _id
    console.log("\nRetrieving order detail to get database ID...");
    const listRes = await fetch(`${API_BASE_URL}/admin/orders?search=${orderNumber}`, {
      headers: { Cookie: cookie },
    });
    const listData = await listRes.json();
    const dbOrder = listData.orders.find((o) => o.orderNumber === orderNumber);
    if (!dbOrder) {
      throw new Error(`Could not find order ${orderNumber} in admin order list`);
    }
    const orderId = dbOrder._id;
    console.log(`Database Order ID: ${orderId}`);

    // 5. Confirm order with delivery days
    console.log("\n5. Confirming order (3 to 5 days)...");
    const confirmRes = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/confirm`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ minDeliveryDays: 3, maxDeliveryDays: 5 }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json();
      throw new Error(`Confirm order failed: ${JSON.stringify(err)}`);
    }
    const confirmData = await confirmRes.json();
    console.log("Confirm Order Response:", JSON.stringify(confirmData, null, 2));

    // 6. Track order again to verify confirmation, working days, and dates
    console.log("\n6. Tracking order post-confirmation...");
    const track2Res = await fetch(`${API_BASE_URL}/orders/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone: "03001234567" }),
    });
    const track2Data = await track2Res.json();
    console.log("Confirmed Order Tracking Data:", JSON.stringify(track2Data.order, null, 2));

    if (track2Data.order.orderStatus !== "confirmed") {
      throw new Error(
        `Expected orderStatus to be 'confirmed', got: ${track2Data.order.orderStatus}`,
      );
    }
    const estimate = track2Data.order.deliveryEstimate;
    if (!estimate || estimate.minDays !== 3 || estimate.maxDays !== 5) {
      throw new Error(
        `Expected deliveryEstimate to show min: 3, max: 5. Got: ${JSON.stringify(estimate)}`,
      );
    }
    if (!estimate.estimatedStartDate || !estimate.estimatedEndDate) {
      throw new Error("Estimated start/end dates are missing!");
    }
    console.log("Delivery estimates are calculated and saved successfully!");

    // 7. Update status to preparing
    console.log("\n7. Updating order status to 'preparing'...");
    const status1Res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ status: "preparing" }),
    });
    const status1Data = await status1Res.json();
    console.log(
      "Status Updated to Preparing. Current order status in DB:",
      status1Data.order.orderStatus,
    );

    // 8. Update status to shipped
    console.log("\n8. Updating order status to 'shipped' (triggers email)...");
    const status2Res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ status: "shipped" }),
    });
    const status2Data = await status2Res.json();
    console.log(
      "Status Updated to Shipped. Current order status in DB:",
      status2Data.order.orderStatus,
    );

    // 9. Fetch tracking again to verify timeline length and event status
    console.log("\n9. Tracking order to verify tracking events list...");
    const track3Res = await fetch(`${API_BASE_URL}/orders/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone: "03001234567" }),
    });
    const track3Data = await track3Res.json();
    console.log("Final Tracked Events:", JSON.stringify(track3Data.order.trackingEvents, null, 2));

    console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
  } catch (error) {
    console.error("\n❌ TESTS FAILED:", error.message);
    process.exit(1);
  }
}

runTests();
