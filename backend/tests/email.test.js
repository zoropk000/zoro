import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { test, after } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import { emailConfig, emailSiteUrl, deliverEmail } from "../src/utils/emailTransport.js";

const originalTransport = nodemailer.createTransport;
const originalEnv = { ...process.env };
const gmail = { GMAIL_USER: "store@gmail.com", GMAIL_APP_PASSWORD: "fixture-only" };
const custom = {
  SMTP_HOST: "smtp.example.com",
  SMTP_USER: "smtp-credential",
  SMTP_PASS: "fixture-only",
  EMAIL_FROM: "orders@example.com",
};
const message = {
  to: "customer@example.net",
  subject: "Order received",
  text: "Order received",
  html: "<p>Order received</p>",
};
after(() => {
  nodemailer.createTransport = originalTransport;
  process.env = originalEnv;
});

test("Gmail remains authenticated and custom SMTP requires TLS and valid sender settings", () => {
  const config = emailConfig(gmail);
  assert.equal(config.from, gmail.GMAIL_USER);
  assert.equal(config.options.host, "smtp.gmail.com");
  assert.equal(config.options.secure, true);
  assert.equal(config.options.tls.rejectUnauthorized, true);
  assert.equal(config.options.tls.minVersion, "TLSv1.2");
  const starttls = emailConfig({ ...custom, SMTP_PORT: "587" });
  assert.equal(starttls.options.secure, false);
  assert.equal(starttls.options.requireTLS, true);
  assert.equal(starttls.options.disableFileAccess, true);
  assert.equal(starttls.options.disableUrlAccess, true);
  assert.throws(() => emailConfig({ ...custom, SMTP_PORT: "25" }));
  assert.throws(() => emailConfig({ SMTP_USER: "partial" }));
  assert.throws(() => emailConfig({ ...gmail, EMAIL_FROM: "store@example.com" }), /must match/);
  assert.throws(
    () => emailConfig({ ...custom, SMTP_HOST: "smtp.gmail.com", SMTP_USER: gmail.GMAIL_USER }),
    /must match/,
  );
  assert.throws(() => emailConfig({ ...custom, SMTP_HOST: "smtp://smtp.example.com" }), /hostname/);
  assert.throws(
    () => emailConfig({ ...gmail, EMAIL_RETURN_PATH: "bounce@unrelated.com" }),
    /sender domain/,
  );
  assert.throws(() => emailConfig({ ...custom, EMAIL_DKIM_SELECTOR: "partial" }), /all three/);
  assert.throws(() =>
    emailConfig({ ...gmail, EMAIL_FROM_NAME: "Store\r\nBcc: victim@example.com" }),
  );
  assert.equal(emailConfig({ ...gmail, EMAIL_ENABLED: "false" }), null);
});

test("email links use public HTTPS and never fall back to localhost", () => {
  assert.equal(
    emailSiteUrl({ FRONTEND_URL: "http://localhost:8080,https://store.example.com/" }),
    "https://store.example.com",
  );
  assert.equal(
    emailSiteUrl({ FRONTEND_URL: "http://localhost:8080" }),
    "https://zoro-ruddy.vercel.app",
  );
  for (const url of [
    "http://store.example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://user:pass@example.com",
  ]) {
    assert.throws(() => emailSiteUrl({ EMAIL_SITE_URL: url }));
  }
});

test("mail envelope and headers use trusted identities; SMTP rejection is never success", async () => {
  let captured,
    closed = false;
  nodemailer.createTransport = () => ({
    sendMail: async (mail) => {
      captured = mail;
      return { accepted: [message.to], rejected: [], messageId: "fixture-id" };
    },
    close: () => {
      closed = true;
    },
  });
  assert.deepEqual(await deliverEmail(message, custom), { success: true, messageId: "fixture-id" });
  assert.equal(closed, true);
  assert.deepEqual(captured.from, { name: "ZORO", address: "orders@example.com" });
  assert.deepEqual(captured.envelope, { from: "orders@example.com", to: [message.to] });
  assert.equal(captured.replyTo, undefined);
  await deliverEmail({ ...message, replyTo: "support@example.com" }, custom);
  assert.equal(captured.replyTo, "support@example.com");
  for (const to of [
    "one@example.net, two@example.net",
    "victim@example.net\r\nBcc: other@example.net",
  ]) {
    await assert.rejects(deliverEmail({ ...message, to }, custom), /plain email/);
  }
  await assert.rejects(
    deliverEmail({ ...message, subject: "Order\nBcc: other@example.net" }, custom),
    /single/,
  );
  await assert.rejects(deliverEmail({ ...message, text: "" }, custom), /plain text/);
  nodemailer.createTransport = () => ({
    sendMail: async () => ({ accepted: [], rejected: [message.to] }),
    close() {},
  });
  assert.equal((await deliverEmail(message, custom)).success, false);
  nodemailer.createTransport = () => ({
    sendMail: async () => {
      throw new Error("SMTP outage");
    },
    close: () => {
      closed = true;
    },
  });
  closed = false;
  await assert.rejects(deliverEmail(message, custom), /SMTP outage/);
  assert.equal(closed, true);
  nodemailer.createTransport = originalTransport;
});

test("all customer and admin templates produce multipart mail with safe content and working links", async () => {
  // Prevent dotenv from selecting any real SMTP credentials in this test process.
  for (const key of Object.keys(process.env))
    if (/^(SMTP_|EMAIL_|GMAIL_)/.test(key)) delete process.env[key];
  Object.assign(process.env, gmail, {
    EMAIL_SITE_URL: "https://zoro-ruddy.vercel.app",
    EMAIL_ENABLED: "true",
  });
  const { sendOrderStatusEmail, sendAdminOrderEmail, buildEmailTemplate } =
    await import("../src/utils/email.js");
  const mails = [];
  nodemailer.createTransport = () => ({
    sendMail: async (mail) => {
      mails.push(mail);
      return { accepted: [mail.to], messageId: "template-id" };
    },
    close() {},
  });
  const order = {
    orderNumber: "ZORO-TEST",
    orderStatus: "pending",
    paymentMethod: "cod",
    customer: {
      name: '<script>alert("x")</script>',
      email: message.to,
      phone: "+92 3001234567",
      address: "<unsafe>",
      city: "Karachi",
    },
    items: [
      {
        name: '<img src=x onerror="alert(1)">',
        image: 'https://example.com/a.png?x="&y=1',
        size: "<M>",
        color: "<Black>",
        quantity: 1,
        price: 100,
      },
    ],
    subtotal: 100,
    deliveryFee: 250,
    total: 340,
    discount: 10,
    couponCode: "<unsafe>",
    deliveryEstimate: {
      minDays: 2,
      maxDays: 4,
      estimatedStartDate: new Date(),
      estimatedEndDate: new Date(),
    },
  };
  for (const status of [
    "orderReceived",
    "orderConfirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
  ]) {
    assert.equal((await sendOrderStatusEmail(order, status)).success, true);
  }
  assert.equal((await sendAdminOrderEmail(order)).success, true);
  assert.equal(mails.length, 6);
  for (const mail of mails) {
    assert.ok(mail.text.includes(order.orderNumber));
    assert.ok(!mail.html.includes("<script>"));
    assert.ok(!mail.html.includes("<img src=x"));
    assert.ok(!mail.html.includes("localhost"));
    assert.ok(!mail.text.includes("localhost"));
    const compiled = await originalTransport({ streamTransport: true, buffer: true }).sendMail(
      mail,
    );
    const raw = compiled.message.toString();
    assert.match(raw, /Content-Type: multipart\/alternative/);
    assert.match(raw, /Content-Type: text\/plain/);
    assert.match(raw, /Content-Type: text\/html/);
  }
  const tracking = mails[0].text.match(/Track your order: (.+)/)[1];
  assert.equal(new URL(tracking).searchParams.get("phone"), order.customer.phone);
  assert.equal(new URL(tracking).origin, "https://zoro-ruddy.vercel.app");
  assert.equal(mails[5].to, gmail.GMAIL_USER);
  assert.equal(mails[5].from.address, gmail.GMAIL_USER);
  assert.equal(mails[5].replyTo, undefined);
  const unsafeImage = structuredClone(order);
  unsafeImage.items[0].image = "javascript:alert(1)";
  assert.ok(
    !buildEmailTemplate({ order: unsafeImage, title: "Order", message: "Test" }).includes(
      "javascript:",
    ),
  );
  assert.equal((await sendOrderStatusEmail(order, "bogus")).success, false);
  nodemailer.createTransport = originalTransport;
});

test("custom-domain DKIM creates a signature using the configured sender domain", async () => {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const config = emailConfig({
    ...custom,
    EMAIL_DKIM_DOMAIN: "example.com",
    EMAIL_DKIM_SELECTOR: "website",
    EMAIL_DKIM_PRIVATE_KEY: privateKey.replace(/\n/g, "\\n"),
  });
  const compiled = await originalTransport({
    streamTransport: true,
    buffer: true,
    dkim: config.options.dkim,
  }).sendMail({ ...message, from: config.from });
  assert.match(
    compiled.message.toString(),
    /DKIM-Signature:[\s\S]*?d=example\.com;[\s\S]*?s=website;/,
  );
  const weak = generateKeyPairSync("rsa", {
    modulusLength: 1024,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  assert.throws(
    () =>
      emailConfig({
        ...custom,
        EMAIL_DKIM_DOMAIN: "example.com",
        EMAIL_DKIM_SELECTOR: "website",
        EMAIL_DKIM_PRIVATE_KEY: weak.privateKey,
      }),
    /2048/,
  );
});
