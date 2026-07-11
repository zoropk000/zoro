import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import fs from "fs";

function getBrowserExecutablePath() {
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

let client;
let isReady = false;

/**
 * Format currency to PKR (e.g. Rs. 4,500)
 */
function formatPKR(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

export function initializeWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: ".wwebjs_auth",
    }),
    puppeteer: {
      executablePath: getBrowserExecutablePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.log("📱 WhatsApp QR Code received. Scan with your WhatsApp app to link.");
    QRCode.toString(qr, { type: "terminal", small: true }, (err, url) => {
      if (err) {
        console.error("Error generating QR code:", err);
      } else {
        console.log(url);
      }
    });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp Client is ready!");
    isReady = true;
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ WhatsApp Authentication failure:", msg);
  });

  client.on("disconnected", (reason) => {
    console.log("❌ WhatsApp Client was disconnected:", reason);
    isReady = false;
  });

  client.initialize().catch((err) => {
    console.error("Failed to initialize WhatsApp client:", err);
  });
}

function formatPakistaniNumber(phone) {
  // Removes any non-digit character
  let cleaned = String(phone || "").replace(/\D/g, "");
  
  if (cleaned.startsWith("03") && cleaned.length === 11) {
    return "92" + cleaned.substring(1) + "@c.us";
  } else if (cleaned.startsWith("92") && cleaned.length === 12) {
    return cleaned + "@c.us";
  } else if (cleaned.startsWith("3") && cleaned.length === 10) {
    return "92" + cleaned + "@c.us";
  }
  
  // Fallback
  return cleaned + "@c.us";
}

function getPaymentMethodLabel(method) {
  const map = {
    cod: "Cash on Delivery",
    easypaisa_jazzcash: "Easypaisa / JazzCash",
    meezan_bank: "Meezan Bank Transfer"
  };
  return map[method] || "Cash on Delivery";
}

export async function sendOrderConfirmationWhatsApp(order) {
  if (!client || !isReady) {
    console.warn("⚠️ WhatsApp client not ready. Message not sent.");
    return;
  }

  try {
    // Build the international number (e.g. 923XXXXXXXXX)
    const cleaned = String(order.customer.phone || "").replace(/\D/g, "");
    let internationalNumber;
    if (cleaned.startsWith("03") && cleaned.length === 11) {
      internationalNumber = "92" + cleaned.substring(1);
    } else if (cleaned.startsWith("92") && cleaned.length === 12) {
      internationalNumber = cleaned;
    } else if (cleaned.startsWith("3") && cleaned.length === 10) {
      internationalNumber = "92" + cleaned;
    } else {
      internationalNumber = cleaned;
    }

    console.log(`📱 Resolving WhatsApp ID for number: +${internationalNumber}`);

    // Ask WhatsApp servers to resolve the real chat ID
    const numberId = await client.getNumberId(internationalNumber);
    if (!numberId) {
      console.warn(`⚠️ Number +${internationalNumber} is not registered on WhatsApp. Message not sent.`);
      return;
    }

    console.log(`📱 Resolved WhatsApp ID: ${numberId._serialized}`);

    let itemsText = "";
    order.items.forEach((item) => {
      itemsText += `- ${item.name} (Size: ${item.size}) x${item.quantity} = ${formatPKR(item.price * item.quantity)}\n`;
    });

    const message =
`Assalamualaikum ${order.customer.name} 👋

Thank you for shopping with ZORO! We have successfully received your order.

*Order Number:* #${order.orderNumber}

*Order Summary:*
${itemsText}
Subtotal: ${formatPKR(order.subtotal)}
Delivery Fee: ${order.deliveryFee === 0 ? "FREE" : formatPKR(order.deliveryFee)}
*Total Amount:* ${formatPKR(order.total)}

*Delivery Details:*
Name: ${order.customer.name}
Phone: ${order.customer.phone}
Address: ${order.customer.address}, ${order.customer.city}
${order.customer.landmark ? `Landmark: ${order.customer.landmark}\n` : ""}
*Payment Method:* ${getPaymentMethodLabel(order.paymentMethod)}

You can use your order number to track your order on our website.
If you have any questions, feel free to reply to this message.

Thank you!
ZORO`;

    await client.sendMessage(numberId._serialized, message);
    console.log(`✅ WhatsApp confirmation sent to +${internationalNumber} (ID: ${numberId._serialized}) for order #${order.orderNumber}`);
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message for order #${order.orderNumber}:`, error.message);
    throw error;
  }
}
