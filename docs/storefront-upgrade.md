# ZORO multi-category storefront

This updates the existing TanStack/Vite storefront and Express/MongoDB backend. It does not replace the database, import a new catalog, reset accounts, run a production seed, deploy, or rewrite Git history.

## Admin workflow

- Sign in at `/admin/login` using your existing administrator account.
- Open **Storefront** (`/admin/storefront`) to add or edit departments, subcategories, brands, category images, promotional banners and discount codes. Save changes to publish the configuration.
- Open **Add Product** (`/admin/products/new`). Choose a department, subcategory and audience, add pricing and images, enter stock, choose a status, then save. Use `active` to make the product available. Products with no stock are marked out of stock.
- Clothing uses sizes such as S/M/L. Shoes use shoe sizes. Perfumes use volumes such as 50ml/100ml and a fragrance type. Accessories can use `One size` or another meaningful option. New departments can choose a product type so the right customer filters appear.
- Stock is maintained per size/volume/option and shared across the product's colour choices. Colour choices are saved with the customer's order. Independent colour-and-size stock combinations are not introduced by this update.
- Products and orders have search, filters and pagination. Existing customers from orders remain listed, and registered customer accounts are shown separately.
- Existing products without a category remain in **Shoes**. Reclassify them individually if needed. Category deletion is rejected while products still use it; hide a category instead.

## Payment screenshots and tracking

1. The customer selects COD, Easypaisa/JazzCash or Meezan bank transfer. Existing payment details remain unchanged.
2. COD requires no screenshot. A prepaid checkout requires a JPG, PNG or WEBP screenshot of up to **4 MB**.
3. The server creates the order using current product prices and inventory, calculates shipping and validates any discount. A checkout retry key prevents the same submission from creating a second order.
4. The screenshot is uploaded with an order-specific, expiring authorization token. New proofs use Cloudinary authenticated image delivery. File size, MIME type and image signatures are checked. Customer tracking exposes upload/review status rather than the screenshot URL.
5. If screenshot upload fails after order creation, the confirmation explains this and links to tracking. The customer can upload the screenshot there without placing another order. Entering the order number and phone refreshes upload authorization.
6. In **Orders**, the admin sees the payment status and whether a screenshot was received. The screenshot and approval actions are at the top of the order sidebar. It can be enlarged for review.
7. **Request a new screenshot** records a customer-facing message and allows resubmission. **Approve payment & confirm order** verifies payment, saves the delivery estimate and starts the customer timeline in one action. Prepaid orders cannot be confirmed or shipped before payment approval.
8. The admin updates preparing, shipped, out for delivery and delivered. Tracking can be refreshed manually and checks for updates every 30 seconds while visible. Registered customers reach tracking from their account order history. Guests use their order number and phone.
9. For COD, mark payment collected after delivery. Existing transactional email handling and payment-proof records are retained.

## Customer experience

The homepage has original campaign imagery, equal Clothing/Shoes/Perfumes/Accessories tiles, department tabs, featured shopping, best sellers, new arrivals, a sale collection, editorial category collections and curated recommendations. Product collections use actual inventory and merchandising flags. Empty merchandising collections are not filled with invented products or ratings.

Campaign countdowns use saved end dates, never a timer that restarts for each visitor. Expired campaigns disappear. Configure an actual promotion in the admin panel to display a flash-deal banner.

The header offers debounced product suggestions, an account, wishlist and bag. Collection filters are stored in URLs and applied before pagination. Clothing, shoes and perfumes have different filters. Brand, colour and option facets come from the catalog. Discount sorting is calculated across the matching catalog before pagination.

Guest carts keep the existing `stepstyle_cart_v1` storage key. Unavailable cart entries remain visible for removal. Wishlists work on the device for guests and sync to the customer's account after sign-in. Customer authentication is separate from administrator authentication; historical guest orders are not attached to an account based only on an email match.

## Run and validate

Use Node.js 22 or later. Install the root dependencies with `npm ci`. For a separately hosted backend, install its dependencies in `backend/` as well.

```powershell
npm run typecheck
npm run test:commerce
npm run build
```

The integration suite always creates a disposable MongoDB using `mongodb-memory-server-core`. It never connects to `MONGODB_URI`. Its first run downloads an official MongoDB binary. Emails are disabled and Cloudinary transport is replaced for tests; no test proof is sent to the live image service. The development dependency uses the `core` package so normal production installs do not download a test database.

For the real store, run `npm run dev` from the root. Vite serves the existing Express API at `/api` on the same port as the storefront and loads `backend/.env`. Keep the existing database, JWT, Cloudinary, email and payment settings. No second server on port 5000 is required. Legacy loopback `VITE_API_URL` values are ignored; an explicit remote API URL still supports a separately hosted backend. Production retains the existing Vercel `/api` routing.

If requests previously failed with `ERR_CONNECTION_RESET` on port 5000, restart Vite and refresh the page after this update. Port 5000 was owned by a Windows service on the reviewed machine. Check `/api/health` for a running API. If catalog requests return 503, the API is responding but MongoDB is unavailable. Correct `MONGODB_URI` in `backend/.env` using the active Atlas cluster's connection string, check cluster/network access, and restart Vite. No catalog or order data is replaced when the database is unavailable.

For an explicitly disposable visual QA catalog, run `node scripts/preview-qa.mjs`. It prints an available local API port. Start Vite in another terminal with `ZORO_DEV_API_PROXY` set to that backend origin (for example, `$env:ZORO_DEV_API_PROXY='http://127.0.0.1:49696'`). Browser requests continue to use `/api`. The same proxy setting supports an intentionally separate local backend. This script never reads the configured database URI, creates only clearly named QA products, disables email and simulates image storage. It is not a production seed or a storefront fallback. Stop it when testing is finished.

## Verification and release limits

- The integration suite covers department creation, product creation and edits, legacy shoe classification, filtering, discount sorting, account boundaries, wishlist persistence, guest checkout, server-calculated totals, stock limits, concurrent reservations, inventory rollback, screenshot authorization/upload/rejection/resubmission, payment approval, tracking and checkout replay protection.
- Desktop and mobile browser checks cover the homepage, search, product options, wishlist, Buy Now, structured checkout, discount application, screenshot upload, admin review and customer tracking.
- The original Atlas SRV hostname returned `ENOTFOUND`. The owner updated `MONGODB_URI` locally, and all five reported failing API endpoints returned HTTP 200 through Vite's same-origin API. Existing catalog reads were verified; no test orders were written to the live database. A real checkout using the deployment's credentials still needs launch verification.
- Actual Cloudinary delivery and SMTP email have not been tested against the live services. Ensure Cloudinary authenticated delivery is enabled for new proofs and the existing environment credentials are present. Review the existing transfer account details before accepting payments.
- Root production dependency audit reports no vulnerabilities after updating Nodemailer. Compatible backend dependency fixes were applied. The separately installed, retained `whatsapp-web.js` dependency tree still has nine high-severity audit findings; npm proposes a breaking downgrade. That integration was not replaced or downgraded. It is separate from the storefront's WhatsApp support links. Review it before independently deploying that optional WhatsApp browser integration.
- Authentication throttling is per running server instance. Configure shared edge throttling for a multi-instance deployment. Existing policy pages and account/payment settings still need the store owner's normal launch review.

## Original imagery

The built-in imagegen tool generated the following original assets. WebP exports are saved in `public/images/` and used directly by the site. No Clicky logos, photography or proprietary content were copied. Clicky's [public storefront](https://www.clicky.pk/) was inspected for shopping patterns and hierarchy.

- `campaign.webp`: original fashion campaign, approximately 114 KB.
- `category-clothing.webp`, `category-shoes.webp`, `category-perfumes.webp`, `category-accessories.webp`: department photographs exported from the generated four-panel source; approximately 31–49 KB each.

Final campaign prompt:

> Create a premium original fashion campaign photograph for ZORO, a Pakistani online multi-category fashion store. Landscape 3:2 composition. Two adult South Asian fashion models in a warm ivory minimalist architectural studio, man left wearing an off-white textured overshirt over a white tee with dark trousers, woman right wearing a modest elegant sage green long-sleeved contemporary kurta and cream wide-leg trousers, simple tan handbag. Both in understated cream sneakers. Natural relaxed editorial posing, confident, modern, aspirational but approachable, sunlight casting beautiful architectural diagonal shadows, pale stone wall, beige floor, subtle film grain, expensive magazine photography, realistic skin and garment fabric, full figures from head to shoes with adequate breathing room. Restrained neutral palette, art directed fashion editorial. No text, no logos, no watermarks, no borders, no collage. This will be the right hand photograph in a wide homepage hero; models should fill the frame elegantly.

Final department prompt:

> A premium e-commerce department photography contact sheet, square image, exactly FOUR equally sized square panels in a seamless 2 by 2 grid. Each panel has a pale warm ivory stone studio background and soft realistic editorial shadows. Top LEFT panel: folded ivory linen shirts and a carefully draped sage green cotton garment, clothing texture, tidy fashion still life. Top RIGHT panel: a pair of minimalist unbranded white and beige leather sneakers, side profile, studio product photograph. Bottom LEFT panel: two exquisite unbranded amber perfume bottles with black and gold caps, one upright, subtle reflections, luxury fragrance still life. Bottom RIGHT panel: a sculptural small tan leather handbag with a simple gold wristwatch and black sunglasses, editorial accessories still life. All objects centered in their own panels, generous space around them, coordinated warm neutral color palette, realistic high-end studio product photography, sharp detail. No lettering, no logos, no text, no watermarks. No drawn borders or gaps between panels. Original generic products, no identifiable brands.
