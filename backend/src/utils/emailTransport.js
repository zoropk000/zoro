import nodemailer from "nodemailer";
import { createPrivateKey } from "node:crypto";

const mailboxPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;

export function mailbox(value, label = "Email address") {
  const address = String(value || "").trim();
  if (address.length > 254 || !mailboxPattern.test(address)) {
    throw new Error(`${label} must contain one plain email address.`);
  }
  return address;
}

export function emailSiteUrl(env = process.env) {
  const candidates = env.EMAIL_SITE_URL
    ? [env.EMAIL_SITE_URL]
    : [...String(env.FRONTEND_URL || "").split(","), "https://zoro-ruddy.vercel.app"];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate.trim());
      if (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !/^(localhost|127\.|0\.|\[::1\])/.test(url.hostname) &&
        !url.hostname.endsWith(".local")
      )
        return url.origin;
    } catch {
      /* Try the next configured public origin. */
    }
  }
  throw new Error("EMAIL_SITE_URL must be a public HTTPS website URL.");
}

export function emailConfig(env = process.env) {
  if (env.EMAIL_ENABLED === "false") return null;
  const custom = Boolean(env.SMTP_HOST);
  const hasCustomSettings = [env.SMTP_USER, env.SMTP_PASS, env.SMTP_PORT].some(Boolean);
  if (!custom && hasCustomSettings) throw new Error("Set SMTP_HOST for custom SMTP settings.");
  const user = custom ? env.SMTP_USER : env.GMAIL_USER;
  const pass = custom ? env.SMTP_PASS : env.GMAIL_APP_PASSWORD;
  if (!user && !pass && !custom) return null;
  if (!user || !pass) throw new Error("SMTP username and password must both be configured.");
  const host = custom ? env.SMTP_HOST.trim().toLowerCase() : "smtp.gmail.com";
  if (!/^[a-z0-9.-]+$/.test(host))
    throw new Error("SMTP_HOST must contain a plain server hostname.");
  const from = mailbox(env.EMAIL_FROM || (custom ? user : env.GMAIL_USER), "EMAIL_FROM");
  if (
    /^smtp\.(gmail|googlemail)\.com$/.test(host) &&
    from.toLowerCase() !== mailbox(user, "Gmail SMTP user").toLowerCase()
  ) {
    throw new Error(
      "Gmail EMAIL_FROM must match GMAIL_USER; use verified domain SMTP for another sender.",
    );
  }
  const port = Number(env.SMTP_PORT || 465);
  if (![465, 587].includes(port)) throw new Error("Use SMTP_PORT 465 (TLS) or 587 (STARTTLS).");
  const domain = from.split("@")[1].toLowerCase();
  const fromName = env.EMAIL_FROM_NAME || "ZORO";
  if (/[\r\n]/.test(fromName)) throw new Error("EMAIL_FROM_NAME cannot contain line breaks.");
  const replyTo = mailbox(env.EMAIL_REPLY_TO || from, "EMAIL_REPLY_TO");
  const returnPath = mailbox(env.EMAIL_RETURN_PATH || from, "EMAIL_RETURN_PATH");
  const returnDomain = returnPath.split("@")[1].toLowerCase();
  if (returnDomain !== domain && !returnDomain.endsWith(`.${domain}`)) {
    throw new Error("EMAIL_RETURN_PATH must use the sender domain or its bounce subdomain.");
  }
  const signing = [env.EMAIL_DKIM_DOMAIN, env.EMAIL_DKIM_SELECTOR, env.EMAIL_DKIM_PRIVATE_KEY];
  let dkim;
  if (signing.some(Boolean)) {
    if (!signing.every(Boolean))
      throw new Error("Configure all three EMAIL_DKIM_* settings together.");
    if (
      env.EMAIL_DKIM_DOMAIN.toLowerCase() !== domain ||
      /^(gmail|googlemail)\.com$/.test(domain)
    ) {
      throw new Error(
        "Local DKIM must sign your own EMAIL_FROM domain; Gmail signs its own messages.",
      );
    }
    if (!/^[a-z0-9_-]+$/i.test(env.EMAIL_DKIM_SELECTOR)) throw new Error("Invalid DKIM selector.");
    const privateKey = env.EMAIL_DKIM_PRIVATE_KEY.replace(/\\n/g, "\n");
    let signingKey;
    try {
      signingKey = createPrivateKey(privateKey);
    } catch {
      throw new Error("EMAIL_DKIM_PRIVATE_KEY must contain a valid RSA private key.");
    }
    if (
      signingKey.asymmetricKeyType !== "rsa" ||
      signingKey.asymmetricKeyDetails.modulusLength < 2048
    ) {
      throw new Error("DKIM requires an RSA key of at least 2048 bits.");
    }
    dkim = {
      domainName: domain,
      keySelector: env.EMAIL_DKIM_SELECTOR,
      privateKey,
    };
  }
  return {
    from,
    fromName,
    replyTo,
    returnPath,
    domain,
    options: {
      host,
      port,
      secure: port === 465,
      requireTLS: true,
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      disableFileAccess: true,
      disableUrlAccess: true,
      ...(dkim ? { dkim } : {}),
    },
  };
}

export function createEmailTransport(config = emailConfig()) {
  return config ? nodemailer.createTransport(config.options) : null;
}

export async function deliverEmail({ to, subject, text, html, replyTo }, env = process.env) {
  const config = emailConfig(env);
  if (!config)
    return { success: false, skipped: true, error: "SMTP email is disabled or not configured" };
  const recipient = mailbox(to, "Recipient");
  if (typeof subject !== "string" || !subject.trim() || /[\r\n]/.test(subject)) {
    throw new Error("Email subject must be a single non-empty line.");
  }
  if (typeof text !== "string" || !text.trim() || typeof html !== "string" || !html.trim()) {
    throw new Error("Transactional emails require both plain text and HTML content.");
  }
  const transport = createEmailTransport(config);
  try {
    const replyAddress = mailbox(replyTo || config.replyTo, "Reply-To");
    const info = await transport.sendMail({
      from: { name: config.fromName, address: config.from },
      to: recipient,
      // Replies already go to From. Add Reply-To only for a different support mailbox.
      ...(replyAddress.toLowerCase() !== config.from.toLowerCase()
        ? { replyTo: replyAddress }
        : {}),
      envelope: { from: config.returnPath, to: [recipient] },
      subject,
      text,
      html,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const accepted = (info.accepted || []).some(
      (address) => String(address).toLowerCase() === recipient.toLowerCase(),
    );
    if (!accepted || info.rejected?.length) {
      return {
        success: false,
        messageId: info.messageId,
        error: "SMTP server did not accept the recipient",
      };
    }
    // SMTP acceptance does not establish delivery or inbox placement.
    return { success: true, messageId: info.messageId };
  } finally {
    transport.close();
  }
}
