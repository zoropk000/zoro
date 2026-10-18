# Email delivery investigation and configuration

Checked on 19 October 2026 (Asia/Karachi). Website: https://zoro-ruddy.vercel.app.

## Findings and limits

- The configured sender is `zoropk000@gmail.com`. Authentication to `smtp.gmail.com:465` succeeds with TLS and the existing app password. Google manages `gmail.com` DNS and DKIM signing. A Vercel website subdomain is not a sender domain that this project can configure.
- The previous mailer sent HTML only and built tracking links from the first `FRONTEND_URL`, which is `http://localhost:8080` in the local backend environment. Those links cannot work for customers. It had no configurable SMTP provider, admin order notification, or SMTP message IDs in order records.
- A synthetic order message sent with the updated code to an independent receiver passed **SPF, DKIM, and DMARC**, including aligned `d=gmail.com` DKIM with a 2048-bit key and selector `20251104`. These results do not indicate an authentication failure for that sample. No affected recipient's original spam message was available, so the specific reason for their classification remains unconfirmed.
- The final independent sample scored **9.9/10**: [mail-tester result](https://mail-tester.com/test-20njafulj). The earlier updated sample scored 9.7/10; omitting a redundant Reply-To equal to From removed an unnecessary freemail rule. Remaining small signals include the Gmail address ending in digits. Test samples contain synthetic order data only. No real purchases were made.
- All six templates were accepted by Gmail SMTP and found in the sender's own **INBOX**, with zero matching messages in Spam. This is a self-delivery test; Gmail does not include independent recipient authentication results in those copies. It does not establish Gmail-to-other-account, Outlook, or Yahoo inbox placement.
- A separate diagnostic (`DELIVERY-TEST-e9939238`) was accepted by Gmail for the user-specified recipient at 00:06 PKT on 19 October. The user confirmed that it arrived in **Inbox**. This verifies that sample's recipient-side placement; it does not guarantee placement for all future messages or providers.
- The contact page currently contains `mailto:zoropk000@gmail.com` and a phone link. It has no contact form or submission endpoint. Messages sent through that link originate in the visitor's email app and are outside the website's SMTP flow. No other notification email flows are implemented in this repository.

Authentication is necessary but cannot guarantee inbox placement. Receiver reputation, engagement, content, complaints, recipient rules, and provider limits also apply. The cause of the original recipient's spam decision still requires their original headers and, where possible, the provider's delivery logs.

## Implemented behavior

- The existing Gmail settings remain supported. Custom SMTP can be configured for a verified domain without changing application code.
- SMTP uses implicit TLS on port 465 or mandatory STARTTLS on 587, validates certificates, requires TLS 1.2 or later, and has bounded timeouts. File and URL attachment access are disabled.
- From, envelope sender, recipient, and Reply-To use validated single addresses. Gmail's From must match its authenticated user. No visitor-supplied sender or arbitrary message headers are accepted. Replies go to From unless a different support mailbox is configured.
- Both plain text and HTML are included. Product/customer fields are HTML escaped. Tracking parameters are URL encoded and use a public HTTPS origin. Transactional subjects describe the order status.
- A new-order notification is sent to `EMAIL_ADMIN_TO`, defaulting to the authenticated sender. The existing administrator login email is not used as an implicit notification recipient.
- SMTP acceptance is checked before marking success. Per-template status and SMTP message ID are stored atomically in the order, and the admin order screen shows acceptance, failures, IDs, and manual send/resend controls. Acceptance is not described as delivered or inbox-confirmed.
- Checkout remains successful when email fails; an email failure does not undo a paid or inventory-reserved order. Retrying a completed checkout does not trigger another notification. Failed email can be resent from the admin order page. Automatic retries after ambiguous SMTP failures are not performed, because they can duplicate messages; a durable delivery queue is not introduced here.

## Current Gmail deployment

Set these **server-only** variables on the existing Vercel project and redeploy. Keep the existing app password in the secret environment store; do not put it in Git, frontend variables, screenshots, or logs.

```dotenv
GMAIL_USER=zoropk000@gmail.com
GMAIL_APP_PASSWORD=<existing app password>
EMAIL_FROM_NAME=ZORO
EMAIL_SITE_URL=https://zoro-ruddy.vercel.app
EMAIL_ADMIN_TO=zoropk000@gmail.com
```

Leave `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `EMAIL_DKIM_*` unset to use Gmail. `EMAIL_ENABLED=false` disables all outgoing mail and is set by disposable integration/preview fixtures. Production should leave it unset or use `true`.

The local ignored `backend/.env` now explicitly sets `EMAIL_SITE_URL`. Its existing secrets were preserved. The code also falls back to this public website when the legacy frontend origin is local.

Do **not** add SPF, DKIM, or DMARC records for `gmail.com` or `vercel.app`, spoof a custom From through consumer Gmail, change MX records for this fix, or add a second SPF record. Gmail already signs the authenticated outbound messages.

Deployment was not performed during this investigation: the available Vercel CLI identity is `connecter072-2158`, its only listed team is `mudassir15`, and that team's accessible projects do not include this website. Inspecting `zoro-ruddy.vercel.app` in that context fails. The owning Vercel account/team must be connected before production environment settings and deployment can be verified. The reachable live website and API health endpoint returned HTTP 200.

## Moving to a sender domain you own

This requires the actual owned domain, its DNS access, and credentials from its mail provider. No domain was supplied; no domain records were invented or changed.

1. Verify a sender such as `orders@<owned-domain>` with the selected provider. Use a monitored support/reply mailbox and provision the bounce mailbox or provider-managed return path.
2. Inventory all legitimate senders before changing DNS. Publish **one** SPF TXT record for the applicable envelope domain using the provider's exact authorized mechanisms, within SPF's DNS lookup limit. Preserve authorization for other legitimate services; never use `+all`.
3. Publish the provider's DKIM TXT/CNAME records exactly as provided, with 2048-bit keys where supported. Wait for provider verification. Prefer provider-managed signing and rotation. The website supports optional `EMAIL_DKIM_DOMAIN`, `EMAIL_DKIM_SELECTOR`, and `EMAIL_DKIM_PRIVATE_KEY` together when local signing is required; private keys stay in server secrets and the public key belongs in DNS.
4. Ensure the visible From aligns with the authenticated SPF domain or valid DKIM signing domain. A provider may replace the requested envelope with its managed bounce address; inspect actual received headers. The website accepts an explicitly configured envelope on the From domain or its bounce subdomain.
5. Publish a single `_dmarc.<owned-domain>` policy and a monitored aggregate-report destination. Preserve an existing `quarantine` or `reject` policy. For a previously unconfigured domain, collect reports while validating every legitimate sender, then enforce `quarantine` and ultimately `reject` once alignment is confirmed. Do not weaken an existing policy to fix application email.
6. Configure the application's server environment:

```dotenv
SMTP_HOST=<provider SMTP hostname>
SMTP_PORT=465
SMTP_USER=<provider username>
SMTP_PASS=<provider secret>
EMAIL_FROM=orders@<owned-domain>
EMAIL_FROM_NAME=ZORO
EMAIL_REPLY_TO=support@<owned-domain>
EMAIL_ADMIN_TO=<one monitored admin address>
EMAIL_SITE_URL=https://zoro-ruddy.vercel.app
```

Use `SMTP_PORT=587` when the provider requires STARTTLS. Leave `EMAIL_RETURN_PATH` unset unless the provider specifies an aligned envelope address. For a managed SMTP provider, PTR/rDNS and outbound IP reputation are the provider's responsibility; do not authorize Vercel website IPs in SPF.

## Checks and repeatable tests

From the repository root:

```powershell
npm run test:email
npm run test:commerce
npm run typecheck
npm run build

# Authenticate to SMTP and inspect public DNS without sending:
npm run email:check -- --dkim-selector 20251104

# One synthetic diagnostic message to a mailbox you control:
npm run email:check -- --send --to you@your-domain.example

# Six synthetic customer/admin template messages, with no database writes:
npm run email:check -- --send --all-templates --to you@your-domain.example
```

For a custom sender, replace the selector with the provider's actual selector. The diagnostic reports SMTP and DNS evidence; record presence alone is not proof of valid signatures or successful inbox placement. Diagnostic sends require an explicit recipient. All six template diagnostics go to that recipient, including the admin template, without creating an order.

After deployment, test a controlled order through the live website and inspect received originals at separate Gmail, Outlook, and any affected mailbox. Check `Authentication-Results` for `spf=pass`, `dkim=pass`, `dmarc=pass`, From alignment, Return-Path, live links, and multipart content. Verify order status and admin notification records. Use message IDs to correlate provider logs, bounces, and recipient folder placement. Confirm order retries do not send duplicate messages. Local SMTP test results are not production runtime test results.

Validation completed: **5 mailer tests and 17 commerce/API tests passed**, TypeScript checking passed, lint for changed sources passed, `git diff --check` passed, and the final production build passed. The build retains existing dependency warnings about module-level `use client` directives. Both example environment files were also checked with empty and fixture Gmail credentials. SMTP credentials and DKIM private keys are not printed by the diagnostic.

## Recipient filtering

No spam bypass or allowlist was installed. Do not disable spam/phishing checks or allow all messages claiming to be from Gmail, the store's name, or a domain. A forged From header is not authentication. A filter is unnecessary for the tested self-delivery; the affected recipient and its filter controls were not supplied.

If an affected recipient still sees authenticated mail in Spam, first examine the original headers and recipient rules, then mark the verified message as not spam. At a managed receiving gateway that supports authentication-aware rules, a narrow rule may match the exact sender **and a receiver-validated aligned DKIM/DMARC pass**, while retaining malware/phishing scanning. Do not create a From-only “never spam” rule that also trusts spoofed mail.

References: [Google sender guidelines](https://support.google.com/mail/answer/81126?hl=en), [Nodemailer SMTP](https://nodemailer.com/smtp), [Nodemailer DKIM](https://nodemailer.com/dkim).
