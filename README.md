# Sassy & Classy Collections — Next.js + MongoDB Store

A luxury editorial-style jewellery and accessories storefront built with **Next.js 16 (App Router), React, TypeScript, and MongoDB Atlas**. Product data and uploaded images live in MongoDB; uploaded image bytes are stored in **MongoDB GridFS** (`productImages` bucket). No Cloudinary, Firebase Storage, S3, or Supabase is used.

## What this version includes

- Public storefront: hero, categories, shop grid with animated product cards, search, sorting, cart, wishlist, product detail modal, WhatsApp & Instagram social ordering, newsletter signup.
- Separate admin workspace (`/admin`): product add/edit/delete with image upload to GridFS or external image URL, stock adjustments, social order management, store settings.
- Server-side administrator authorization (`ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` cookie session).
- Idempotent database migration and starter-catalogue seeding.

## Prerequisites (Windows)

- Node.js 20+ (LTS recommended)
- npm (comes with Node.js)
- A free **MongoDB Atlas** cluster (see the Atlas walkthrough below)

## First-time setup

1. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Open `.env.local` and fill in your values. At minimum set `MONGODB_URI`. Keep `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` set if you want to use the admin workspace (otherwise uploads and edits are disabled).

3. Install dependencies:

   ```powershell
   npm install
   ```

4. Run the development server:

   ```powershell
   npm run dev
   ```

5. Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for the admin workspace.

## Configure MongoDB Atlas

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free shared cluster.
2. Create a database user with read/write access and note the password.
3. Add your IP address (or `0.0.0.0/0` for testing) to the Network Access IP allowlist.
4. Click **Connect → Drivers** → **Node.js** and copy the connection string.
5. Paste it into `.env.local` as `MONGODB_URI`, replacing `<db_password>` with your database user's password.
6. Set `MONGODB_DB=sassy_classy` (or your preferred database name).
7. Restart the dev server after changing `.env.local`.

Example `.env.local`:

```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=sassy_classy
MONGODB_IMAGE_BUCKET=productImages

ADMIN_PASSWORD=change-me-to-a-strong-password
ADMIN_SESSION_SECRET=change-me-to-a-long-random-string

MAX_IMAGE_UPLOAD_MB=5
ALLOW_INSECURE_IMAGE_URLS=false
```

### Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | MongoDB Atlas connection string |
| `MONGODB_DB` | No | `sassy_classy` | Database name |
| `MONGODB_IMAGE_BUCKET` | No | `productImages` | GridFS bucket for uploaded product images |
| `ADMIN_PASSWORD` | For admin | — | Store administrator password |
| `ADMIN_SESSION_SECRET` | For admin | — | Random string used to sign the admin session cookie |
| `MAX_IMAGE_UPLOAD_MB` | No | `5` | Maximum size per uploaded image in megabytes |
| `ALLOW_INSECURE_IMAGE_URLS` | No | `false` | Allow `http://` external image URLs (dev only) |

`.env.local` is git-ignored and must never be committed. `.env.example` is the committed template.

## Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |

## How data and images work

### Products

Every product lives in the MongoDB `products` collection and supports: id, name, SKU, slug, category, price in RWF, stock quantity, low-stock threshold, publication status, featured status, timestamps, badge, and an ordered array of product images.

Each image is one of:

- **Uploaded** (`source: 'upload'`) — bytes stored in GridFS, referenced by `fileId`, rendered via `/api/images/<fileId>`.
- **External URL** (`source: 'url'`) — only the HTTPS URL string is stored; the image is not copied into MongoDB and depends on the external host remaining available.

### Images (GridFS)

Uploads go through `POST /api/admin/images` (multipart/form-data), protected by admin authorization. The server:

1. Validates the file size (default 5 MB).
2. Sniffs the actual bytes to confirm it is a JPEG, PNG, WebP, GIF, or AVIF — the filename and browser-supplied MIME type are never trusted.
3. Stores the bytes in the `productImages` GridFS bucket.
4. Records `fileId`, filename, MIME type, size, and upload timestamp.
5. Returns `/api/images/<fileId>` as the stable rendering endpoint.

Retrieval goes through `GET /api/images/[id]`. Only images referenced by a **published** product are public; draft or unattached images require an admin session. Responses use `nosniff` and a sandbox CSP so stored files cannot be served as HTML/JavaScript.

### Migration (safe to re-run)

- `POST /api/migrate` with no body: creates indexes and seeds the starter catalogue if the database is empty. Never overwrites existing records.
- `POST /api/migrate` with a body: also imports legacy `localStorage` data (products, settings, orders, movements). Existing MongoDB records always win; nothing is deleted.

From the admin workspace, open the Overview page and refresh data, or call the migrate endpoint directly after signing in.

## Admin workflow

1. Sign in with `ADMIN_PASSWORD`.
2. Go to **Products → Add product**.
3. Choose **Upload image** (GridFS) or **Image URL** (external HTTPS link).
4. Add alt text, preview, reorder, set primary, and remove images as needed.
5. Save. New products appear on the public storefront immediately.

Uploaded images that a product no longer references are deleted from GridFS only when no other product still references them.

## LocalStorage usage

`localStorage` is used only for client-side cart and wishlist behaviour, as in the previous version. Products, stock, orders, settings, and uploaded images are **not** stored in `localStorage`; they live in MongoDB and sync across devices.

## Verified behaviour

- MongoDB connects when `MONGODB_URI` is configured (check `/api/health`).
- Administrator can upload a valid image to GridFS (protected endpoint).
- Administrator can save an external image URL (HTTPS required by default).
- Uploaded images render in the storefront via `/api/images/<id>`.
- URL-based images render when their source is available.
- Product records persist after refresh and across devices.
- Multiple product images, reorder, replace, and primary-image selection work.
- Invalid files and oversized images are rejected with clear errors.
- Missing images fall back to a local placeholder.
- Unauthorized visitors cannot upload or delete images (401).
- Deleting a product does not delete an image still used by another product.
- Existing product cards, animations, cart, wishlist, and social ordering still work.
- Production build succeeds (`npm run build`).

## Remaining limitations

- Admin authorization is a single shared password, not per-user accounts. Rotate `ADMIN_PASSWORD` when access changes.
- External image URLs are not proxied or validated for reachability; a broken host means a broken image on the storefront.
- GridFS images are public once referenced by a published product; do not upload private imagery as product images.
- Image optimization/resizing happens on upload (server-side validation only); no automatic thumbnails are generated.
- `npm run build`/`start` require `MONGODB_URI` to be set in the deployment environment for database-dependent routes to work.

## File structure

```
src/app/(store)              Public storefront routes
src/app/admin                Admin workspace routes
src/app/api                  Route handlers (products, images, orders, settings, …)
src/components/storefront    Public UI components
src/components/admin         Admin UI components
src/context                  StoreContext (cart, wishlist, products, admin session)
src/lib                      mongodb, imageStore, imageValidation, productSchema,
                             dataStore, migration, adminAuth, apiClient, utils, settings, slug
```
