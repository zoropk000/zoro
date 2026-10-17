import nodemailer from "nodemailer";
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
 * Create a Nodemailer transporter using Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env
 */
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
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

export function buildEmailTemplate({ order, title, message, showDeliveryEstimate }) {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim();
  const trackingUrl = `${frontendUrl}/track-order?orderNumber=${order.orderNumber}&phone=${order.customer.phone}`;

  // Generate order items rows
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 8px; vertical-align: middle;">
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            ${item.image ? `<td style="width: 50px; padding-right: 12px;"><img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" /></td>` : ""}
            <td style="vertical-align: middle;">
              <div style="font-weight: 700; color: #1e293b; font-size: 14px;">${item.name}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Option: ${item.size}${item.color ? ` · ${item.color}` : ""} &bull; Qty: ${item.quantity}</div>
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
      <title>${title}</title>
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
                  <div style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; margin-top: 4px;">#${order.orderNumber}</div>
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
                    <span style="font-weight: 800; color: #0f172a;">${statusDisplay}</span>
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
                    ${order.discount ? `<tr><td style="padding: 6px 0; color: #64748b;">Discount (${order.couponCode})</td><td style="text-align: right;">−${formatPKR(order.discount)}</td></tr>` : ""}
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
                          ${order.customer.phone}<br />
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
                  <div>If you have any questions, email us at zoropk000@gmail.com.</div>
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

/**
 * Send email using Nodemailer + Gmail SMTP (FREE — no API cost)
 */
export async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      "📧 Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env to enable emails.",
    );
    return { success: false, skipped: true, error: "Gmail SMTP is not configured" };
  }

  const fromName = process.env.EMAIL_FROM_NAME || "ZORO";
  const fromEmail = process.env.GMAIL_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
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
      subject = `✅ Order Received — #${order.orderNumber} | ZORO`;
      title = "We received your order";
      message = `Thank you for shopping with ZORO! We have successfully received your order <strong>#${order.orderNumber}</strong>. We are now processing it and will confirm the delivery details shortly. You can use this order number to track your order at any time.`;
      showDeliveryEstimate = false;
      break;

    case "orderConfirmed":
      subject = `🎉 Order Confirmed — #${order.orderNumber} | ZORO`;
      title = "Your order is confirmed";
      message =
        "Great news! Your order has been officially confirmed by our team. Please see your estimated delivery timeframe below. We'll start preparing your shoes right away!";
      showDeliveryEstimate = true;
      break;

    case "shipped":
      subject = `🚚 Order Shipped — #${order.orderNumber} | ZORO`;
      title = "Your order has been shipped";
      message =
        "Exciting news! Your shoes have been packed and handed over to our courier partner. They are on their way to you now.";
      showDeliveryEstimate = true;
      break;

    case "out_for_delivery":
      subject = `🏠 Your Shoes Are Coming Today — #${order.orderNumber} | ZORO`;
      title = "Your shoes are coming today";
      message =
        "Get ready! The delivery rider has picked up your parcel and is out for delivery today. Please keep your phone active so the rider can contact you.";
      showDeliveryEstimate = true;
      break;

    case "delivered":
      subject = `✅ Order Delivered — #${order.orderNumber} | ZORO`;
      title = "Your order has been delivered";
      message =
        "Enjoy your new shoes! Our courier partner confirmed that your order has been successfully delivered. Thank you for shopping with ZORO.";
      showDeliveryEstimate = false;
      break;

    default:
      console.log(`No email template defined for status: ${statusType}`);
      return { success: false, error: `Invalid status type: ${statusType}` };
  }

  const html = buildEmailTemplate({ order, title, message, showDeliveryEstimate });

  try {
    const res = await sendEmail({ to: order.customer.email, subject, html });
    if (!res.success) {
      return {
        success: false,
        error: res.error || "Email was not sent",
        skipped: res.skipped,
      };
    }
    return { success: true, res };
  } catch (error) {
    console.error(
      `Error sending email (${statusType}) for order ${order.orderNumber}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
}
