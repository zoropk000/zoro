import { deliverEmail, emailConfig, emailSiteUrl } from "./emailTransport.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Format date as "12 July 2026"
 */
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format currency to PKR (e.g. Rs. 4,500)
 */
function formatPKR(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

/**
 * Map payment methods to customer-friendly names
 */
function getPaymentMethodLabel(method) {
  const map = {
    cod: "Cash on Delivery",
    easypaisa_jazzcash: "Easypaisa / JazzCash",
    meezan_bank: "Meezan Bank Transfer",
  };
  return map[method] || "Cash on Delivery";
}

/**
 * Generate a styled, responsive HTML email template
 */
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );

export function orderTrackingUrl(order) {
  const url = new URL("/track-order", emailSiteUrl());
  url.searchParams.set("orderNumber", order.orderNumber);
  url.searchParams.set("phone", order.customer.phone);
  return url.href;
}

function safeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? escapeHtml(url.href) : "";
  } catch {
    return "";
  }
}

export function buildEmailTemplate({ order, title, message, showDeliveryEstimate }) {
  const trackingUrl = escapeHtml(orderTrackingUrl(order));
  const supportEmail = emailConfig()?.replyTo || "zoropk000@gmail.com";

  // Generate order items rows
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 8px; vertical-align: middle;">
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            ${safeImageUrl(item.image) ? `<td style="width: 50px; padding-right: 12px;"><img src="${safeImageUrl(item.image)}" alt="${escapeHtml(item.name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" /></td>` : ""}
            <td style="vertical-align: middle;">
              <div style="font-weight: 700; color: #1e293b; font-size: 14px;">${escapeHtml(item.name)}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Option: ${escapeHtml(item.size)}${item.color ? ` · ${escapeHtml(item.color)}` : ""} &bull; Qty: ${Number(item.quantity)}</div>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #1e293b; font-size: 14px;">
        ${formatPKR(item.price * item.quantity)}
      </td>
    </tr>
  `,
    )
    .join("");

  // Determine delivery estimate block
  let deliveryBlock = "";
  if (showDeliveryEstimate && order.deliveryEstimate && order.deliveryEstimate.minDays) {
    const startFormatted = formatDate(order.deliveryEstimate.estimatedStartDate);
    const endFormatted = formatDate(order.deliveryEstimate.estimatedEndDate);
    deliveryBlock = `
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <div style="font-weight: 800; color: #14532d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Delivery</div>
        <div style="font-size: 18px; font-weight: 900; color: #166534; margin-top: 4px;">
          ${order.deliveryEstimate.minDays}–${order.deliveryEstimate.maxDays} Working Days
        </div>
        <div style="font-size: 14px; color: #15803d; margin-top: 2px; font-weight: 600;">
          Expected Between: ${startFormatted} &ndash; ${endFormatted}
        </div>
      </div>
    `;
  } else {
    deliveryBlock = `
      <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <div style="font-weight: 800; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Delivery</div>
        <div style="font-size: 15px; font-weight: 700; color: #334155; margin-top: 4px;">
          Estimated delivery time will be confirmed shortly.
        </div>
      </div>
    `;
  }

  // Determine order status block
  const statusDisplay =
    order.orderStatus === "pending"
      ? "⏳ Waiting for Confirmation"
      : order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 2px;">ZORO</div>
                </td>
              </tr>

              <!-- Order Number Banner -->
              <tr>
                <td style="background-color: #1e293b; padding: 14px 24px; text-align: center;">
                  <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Your Order Number</div>
                  <div style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; margin-top: 4px;">#${escapeHtml(order.orderNumber)}</div>
                  <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Use this number to track your order anytime</div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
                    Assalamualaikum ${escapeHtml(order.customer.name)} 👋
                  </div>
                  <div style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                    ${message}
                  </div>

                  ${deliveryBlock}

                  <!-- Order Status Box -->
                  <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px;">
                    <span style="color: #475569; font-weight: 600;">Current Status: </span>
                    <span style="font-weight: 800; color: #0f172a;">${escapeHtml(statusDisplay)}</span>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${trackingUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: 800; border-radius: 12px; display: inline-block;">
                      📦 TRACK MY ORDER
                    </a>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

                  <!-- Products Table -->
                  <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Order Summary</div>
                  <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #cbd5e1;">
                        <th style="padding: 8px 8px 8px 0; text-align: left; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Product</th>
                        <th style="padding: 8px 0 8px 8px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Totals Table -->
                  <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 32px; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Subtotal</td>
                      <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b;">${formatPKR(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Delivery Fee</td>
                      <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b;">${order.deliveryFee === 0 ? "FREE" : formatPKR(order.deliveryFee)}</td>
                    </tr>
                    ${order.discount ? `<tr><td style="padding: 6px 0; color: #64748b;">Discount (${escapeHtml(order.couponCode)})</td><td style="text-align: right;">−${formatPKR(order.discount)}</td></tr>` : ""}
                    <tr style="font-size: 18px; font-weight: 800;">
                      <td style="padding: 12px 0 0 0; color: #0f172a; border-top: 1px solid #e2e8f0;">Total Amount</td>
                      <td style="padding: 12px 0 0 0; text-align: right; color: #0f172a; border-top: 1px solid #e2e8f0;">${formatPKR(order.total)}</td>
                    </tr>
                  </table>

                  <!-- Delivery & Payment Info -->
                  <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border-radius: 12px; padding: 20px;">
                    <tr>
                      <td style="vertical-align: top; width: 50%; padding-right: 12px;">
                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Delivery Details</div>
                        <div style="font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.5;">
                          ${escapeHtml(order.customer.name)}<br />
                          ${escapeHtml(order.customer.phone)}<br />
                          ${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.city)}
                          ${order.customer.landmark ? `<br /><span style="font-style: italic; color: #64748b;">Landmark: ${escapeHtml(order.customer.landmark)}</span>` : ""}
                        </div>
                      </td>
                      <td style="vertical-align: top; width: 50%; padding-left: 12px; border-left: 1px solid #e2e8f0;">
                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Payment Method</div>
                        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                          ${getPaymentMethodLabel(order.paymentMethod)}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                          ${order.paymentMethod === "cod" ? "Pay in cash when order is delivered to your address." : "Prepaid using secure transfer."}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  <div style="font-weight: 700; color: #64748b; margin-bottom: 4px;">Secure Ordering &bull; Cash on Delivery &bull; Delivery Across Pakistan</div>
                  <div>Questions about this order? Reply to this email or contact ${escapeHtml(supportEmail)}.</div>
                  <div style="margin-top: 12px;">&copy; ${new Date().getFullYear()} ZORO. All rights reserved.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendEmail(message) {
  return deliverEmail(message);
}

export function buildOrderText({ order, title, message, showDeliveryEstimate }) {
  return [
    `ZORO — ${title}`,
    `Order #${order.orderNumber}`,
    `Assalamualaikum ${order.customer.name},`,
    message.replace(/<[^>]*>/g, ""),
    `Status: ${order.orderStatus}`,
    showDeliveryEstimate && order.deliveryEstimate?.minDays
      ? `Estimated delivery: ${order.deliveryEstimate.minDays}–${order.deliveryEstimate.maxDays} working days (${formatDate(order.deliveryEstimate.estimatedStartDate)}–${formatDate(order.deliveryEstimate.estimatedEndDate)}).`
      : "Estimated delivery time will be confirmed shortly.",
    `Track your order: ${orderTrackingUrl(order)}`,
    "Order summary:",
    ...order.items.map(
      (item) =>
        `${item.name} / ${item.size}${item.color ? ` / ${item.color}` : ""} x ${item.quantity}: ${formatPKR(item.price * item.quantity)}`,
    ),
    `Subtotal: ${formatPKR(order.subtotal)}`,
    `Delivery: ${formatPKR(order.deliveryFee)}`,
    ...(order.discount ? [`Discount (${order.couponCode}): ${formatPKR(order.discount)}`] : []),
    `Total: ${formatPKR(order.total)}`,
    `Payment: ${getPaymentMethodLabel(order.paymentMethod)}`,
    `Delivery to: ${order.customer.name}, ${order.customer.address}, ${order.customer.city}`,
    `Phone: ${order.customer.phone}`,
    ...(order.customer.landmark ? [`Landmark: ${order.customer.landmark}`] : []),
    `Questions? Reply to this email or contact ${emailConfig()?.replyTo || "zoropk000@gmail.com"}.`,
    emailSiteUrl(),
  ].join("\n\n");
}

// Admin destinations come only from server configuration, never checkout input.
export async function sendAdminOrderEmail(order) {
  try {
    const config = emailConfig();
    if (!config)
      return { success: false, skipped: true, error: "SMTP email is disabled or not configured" };
    const to = process.env.EMAIL_ADMIN_TO || config.from;
    const subject = `New order #${order.orderNumber} | ZORO`;
    const text = [
      `New website order #${order.orderNumber}`,
      `Customer: ${order.customer.name}`,
      `Email: ${order.customer.email}`,
      `Phone: ${order.customer.phone}`,
      `Total: ${formatPKR(order.total)}`,
      `Payment: ${getPaymentMethodLabel(order.paymentMethod)}`,
      `Review orders: ${emailSiteUrl()}/admin/orders`,
    ].join("\n");
    return await sendEmail({
      to,
      subject,
      text,
      html: `<html lang="en"><body><h1>New website order</h1><p>${escapeHtml(text).replace(/\n/g, "<br />")}</p></body></html>`,
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send appropriate status email based on status type
 */
export async function sendOrderStatusEmail(order, statusType) {
  if (!order.customer.email) {
    console.log(`Skipping email for order ${order.orderNumber}: No customer email provided.`);
    return { success: false, error: "No customer email" };
  }

  let subject = "";
  let title = "";
  let message = "";
  let showDeliveryEstimate = false;

  switch (statusType) {
    case "orderReceived":
      subject = `Order received #${order.orderNumber} | ZORO`;
      title = "We received your order";
      message = `Thank you for shopping with ZORO. We have received your order <strong>#${escapeHtml(order.orderNumber)}</strong>. We are processing it and will confirm the delivery details shortly. You can use this order number to track your order at any time.`;
      showDeliveryEstimate = false;
      break;

    case "orderConfirmed":
      subject = `Order confirmed #${order.orderNumber} | ZORO`;
      title = "Your order is confirmed";
      message =
        "Your order has been confirmed by our team. Please see your estimated delivery timeframe below. We'll start preparing your items shortly.";
      showDeliveryEstimate = true;
      break;

    case "shipped":
      subject = `Order shipped #${order.orderNumber} | ZORO`;
      title = "Your order has been shipped";
      message =
        "Your items have been packed and handed over to our courier partner. They are on their way to you.";
      showDeliveryEstimate = true;
      break;

    case "out_for_delivery":
      subject = `Order out for delivery #${order.orderNumber} | ZORO`;
      title = "Your order is coming today";
      message =
        "Get ready! The delivery rider has picked up your parcel and is out for delivery today. Please keep your phone active so the rider can contact you.";
      showDeliveryEstimate = true;
      break;

    case "delivered":
      subject = `Order delivered #${order.orderNumber} | ZORO`;
      title = "Your order has been delivered";
      message =
        "Our courier partner confirmed that your order has been delivered. Thank you for shopping with ZORO.";
      showDeliveryEstimate = false;
      break;

    default:
      console.log(`No email template defined for status: ${statusType}`);
      return { success: false, error: `Invalid status type: ${statusType}` };
  }

  try {
    const template = { order, title, message, showDeliveryEstimate };
    const html = buildEmailTemplate(template);
    const text = buildOrderText(template);
    const res = await sendEmail({ to: order.customer.email, subject, text, html });
    if (!res.success) {
      return {
        success: false,
        error: res.error || "Email was not sent",
        skipped: res.skipped,
        messageId: res.messageId,
      };
    }
    return { success: true, messageId: res.messageId };
  } catch (error) {
    console.error(
      `Error sending email (${statusType}) for order ${order.orderNumber}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
}
