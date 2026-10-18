import dotenv from "dotenv";
import { resolveTxt } from "node:dns/promises";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";

// Deployed environment takes precedence. No credentials are printed.
dotenv.config({ path: "backend/.env" });
dotenv.config();
const { values } = parseArgs({
  options: {
    send: { type: "boolean", default: false },
    to: { type: "string" },
    "all-templates": { type: "boolean", default: false },
    "dkim-selector": { type: "string" },
  },
});
const { emailConfig, createEmailTransport, emailSiteUrl, mailbox } =
  await import("../backend/src/utils/emailTransport.js");
const { sendEmail, sendOrderStatusEmail, sendAdminOrderEmail } =
  await import("../backend/src/utils/email.js");
const report = {
  timestamp: new Date().toISOString(),
  scope: "SMTP and public DNS; inbox placement requires received headers",
  dns: {},
};
async function records(name) {
  try {
    return (await resolveTxt(name)).map((record) => record.join(""));
  } catch (error) {
    return { error: error.code };
  }
}
try {
  if (values["all-templates"] && !values.send)
    throw new Error("--all-templates requires --send and --to.");
  if (values.send && !values.to)
    throw new Error("--send requires an explicit --to address you control.");
  const config = emailConfig();
  if (!config) throw new Error("SMTP email is disabled or not configured.");
  report.website = emailSiteUrl();
  report.sender = config.from;
  report.smtp = { host: config.options.host, port: config.options.port, tlsRequired: true };
  const transport = createEmailTransport(config);
  try {
    await transport.verify();
    report.smtp.authenticated = true;
  } finally {
    transport.close();
  }
  const [txt, dmarc] = await Promise.all([
    records(config.domain),
    records(`_dmarc.${config.domain}`),
  ]);
  report.dns.spf = Array.isArray(txt) ? txt.filter((value) => /^v=spf1(?:\s|$)/i.test(value)) : txt;
  report.dns.dmarc = Array.isArray(dmarc)
    ? dmarc.filter((value) => /^v=DMARC1;/i.test(value))
    : dmarc;
  const selector = values["dkim-selector"] || process.env.EMAIL_DKIM_SELECTOR;
  if (selector && !/^[a-z0-9_-]+$/i.test(selector)) throw new Error("Invalid DKIM selector.");
  report.dns.dkim = selector
    ? {
        name: `${selector}._domainkey.${config.domain}`,
        records: await records(`${selector}._domainkey.${config.domain}`),
      }
    : {
        status: "unknown",
        action: "Read s= from a received DKIM-Signature, then rerun with --dkim-selector.",
      };
  report.dns.notes = [
    "Record presence does not establish SPF authorization or a valid aligned DKIM signature; inspect received Authentication-Results.",
    "Do not add a second SPF record. Custom-domain DMARC can inherit organizational policy.",
  ];
  if (values.send) {
    const to = mailbox(values.to);
    const orderNumber = `DELIVERY-TEST-${randomUUID().slice(0, 8)}`;
    report.testId = orderNumber;
    report.tests = [];
    if (values["all-templates"]) {
      const order = {
        orderNumber,
        orderStatus: "pending",
        paymentMethod: "cod",
        customer: {
          name: "Email delivery test",
          email: to,
          phone: "03000000000",
          address: "Test only — no shipment",
          city: "Karachi",
        },
        items: [{ name: "Delivery diagnostic (no purchase)", size: "M", quantity: 1, price: 100 }],
        subtotal: 100,
        deliveryFee: 0,
        total: 100,
        deliveryEstimate: {
          minDays: 3,
          maxDays: 5,
          estimatedStartDate: new Date(),
          estimatedEndDate: new Date(Date.now() + 5 * 86400000),
        },
      };
      for (const status of [
        "orderReceived",
        "orderConfirmed",
        "shipped",
        "out_for_delivery",
        "delivered",
      ]) {
        order.orderStatus =
          status === "orderReceived"
            ? "pending"
            : status === "orderConfirmed"
              ? "confirmed"
              : status;
        report.tests.push({ type: status, ...(await sendOrderStatusEmail(order, status)) });
      }
      // The explicit diagnostic recipient also receives the admin template. No order is persisted.
      process.env.EMAIL_ADMIN_TO = to;
      report.tests.push({ type: "adminOrderReceived", ...(await sendAdminOrderEmail(order)) });
    } else {
      report.tests.push({
        type: "diagnostic",
        ...(await sendEmail({
          to,
          subject: `ZORO email delivery test ${orderNumber}`,
          text: `This is an authorized website email delivery test. No order was created.\nReference: ${orderNumber}\nWebsite: ${report.website}\nPlease inspect Authentication-Results for SPF, DKIM and DMARC and check the folder containing this message.`,
          html: `<html lang="en"><body><h1>ZORO email delivery test</h1><p>No order was created.</p><p>Reference: ${orderNumber}</p><p>Check SPF, DKIM and DMARC in the received message headers and confirm the destination folder.</p></body></html>`,
        })),
      });
    }
    if (report.tests.some((result) => !result.success)) process.exitCode = 1;
  }
} catch (error) {
  report.error = { code: error.code, responseCode: error.responseCode, message: error.message };
  process.exitCode = 1;
}
console.log(JSON.stringify(report, null, 2));
