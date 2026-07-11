function formatWhatsAppPhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  if (cleaned.startsWith("03") && cleaned.length === 11) return `92${cleaned.slice(1)}`;
  if (cleaned.startsWith("92") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("3") && cleaned.length === 10) return `92${cleaned}`;
  return cleaned;
}

function formatPKR(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;
}

function getPaymentMethodLabel(method) {
  const map = {
    cod: "Cash on Delivery",
    easypaisa_jazzcash: "Easypaisa / JazzCash",
    meezan_bank: "Meezan Bank Transfer",
  };
  return map[method] || "Cash on Delivery";
}

function buildOrderConfirmationMessage(order) {
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.name} (Size: ${item.size}) x${item.quantity} = ${formatPKR(
          item.price * item.quantity,
        )}`,
    )
    .join("\n");

  return `Assalamualaikum ${order.customer.name}

Thank you for shopping with ZORO! We have successfully received your order.

Order Number: #${order.orderNumber}

Order Summary:
${itemsText}
Subtotal: ${formatPKR(order.subtotal)}
Delivery Fee: ${order.deliveryFee === 0 ? "FREE" : formatPKR(order.deliveryFee)}
Total Amount: ${formatPKR(order.total)}

Delivery Details:
Name: ${order.customer.name}
Phone: ${order.customer.phone}
Address: ${order.customer.address}, ${order.customer.city}
${order.customer.landmark ? `Landmark: ${order.customer.landmark}\n` : ""}Payment Method: ${getPaymentMethodLabel(
    order.paymentMethod,
  )}

You can use your order number to track your order on our website.

Thank you!
ZORO`;
}

export function isWhatsAppCloudConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendOrderConfirmationWhatsAppCloud(order) {
  if (!isWhatsAppCloudConfigured()) {
    return { success: false, skipped: true, error: "WhatsApp Cloud API is not configured" };
  }

  const to = formatWhatsAppPhone(order.customer.phone);
  if (!to) {
    return { success: false, error: "Customer phone number is missing" };
  }

  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";
  const messageBody = templateName
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: order.customer.name },
                { type: "text", text: `#${order.orderNumber}` },
                { type: "text", text: formatPKR(order.total) },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: buildOrderConfirmationMessage(order),
        },
      };

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageBody),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error?.message || `WhatsApp Cloud API failed with HTTP ${response.status}`;
    return { success: false, error: message, details: payload };
  }

  return {
    success: true,
    messageId: payload?.messages?.[0]?.id,
  };
}
