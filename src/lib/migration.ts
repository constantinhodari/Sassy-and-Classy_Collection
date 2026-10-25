import type { ProductImage, SocialOrder, StockMovement, StoreSettings } from '@/types';
import { COLLECTIONS, getDb, isMongoConfigured } from '@/lib/mongodb';
import { ensureStoreInitialized, saveStoreSettings } from '@/lib/dataStore';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { STARTER_PRODUCTS } from '@/lib/storage';
import { slugify } from '@/lib/slug';
import { primaryImageUrl, validateImageUrl } from '@/lib/productSchema';

/**
 * Data migration.
 *
 * Both entry points are idempotent: running them repeatedly never duplicates or
 * deletes anything. Existing MongoDB records always win over browser data.
 */

export interface MigrationReport {
  starterSeeded: number;
  productsInserted: number;
  productsSkipped: number;
  productsNeedingImage: number;
  ordersInserted: number;
  movementsInserted: number;
  settingsImported: boolean;
}

export interface ClientMigrationPayload {
  products?: unknown[];
  settings?: Partial<StoreSettings>;
  orders?: unknown[];
  movements?: unknown[];
}

function emptyReport(): MigrationReport {
  return {
    starterSeeded: 0,
    productsInserted: 0,
    productsSkipped: 0,
    productsNeedingImage: 0,
    ordersInserted: 0,
    movementsInserted: 0,
    settingsImported: false,
  };
}

/** Insert the starter catalogue with `$setOnInsert` — never overwrites edits. */
export async function seedStarterProducts(): Promise<number> {
  const db = await getDb();
  let inserted = 0;
  for (const product of STARTER_PRODUCTS) {
    const result = await db.collection(COLLECTIONS.products).updateOne(
      { _id: product.id as unknown as never },
      { $setOnInsert: { ...product } as unknown as Record<string, unknown> },
      { upsert: true }
    );
    if (result.upsertedCount > 0) inserted += 1;
  }
  return inserted;
}

/**
 * Convert a legacy (browser / v1) product record into a stored document.
 * Base64 `data:` images are dropped rather than written into the document —
 * those must be re-uploaded so the bytes live in GridFS.
 */
function convertLegacyProduct(raw: unknown): {
  doc: Record<string, unknown> | null;
  needsImage: boolean;
} {
  if (!raw || typeof raw !== 'object') return { doc: null, needsImage: false };
  const p = raw as Record<string, unknown>;
  const name = String(p.name ?? '').trim();
  const sku = String(p.sku ?? '').trim().toUpperCase();
  if (!name || !sku) return { doc: null, needsImage: false };

  const images: ProductImage[] = [];
  let needsImage = false;

  if (Array.isArray(p.images)) {
    for (const entry of p.images) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const fileId = typeof record.fileId === 'string' ? record.fileId : '';
      const url = typeof record.url === 'string' ? record.url : '';
      if (fileId) {
        images.push({ source: 'upload', fileId, url: `/api/images/${fileId}`, alt: String(record.alt ?? name) });
        continue;
      }
      const checked = validateImageUrl(url);
      if (checked.ok) images.push({ source: 'url', url: checked.url, alt: String(record.alt ?? name) });
      else needsImage = true;
    }
  }

  if (images.length === 0) {
    const legacyImage = typeof p.image === 'string' ? p.image : '';
    if (legacyImage.startsWith('data:')) {
      // Legacy base64 upload from the old browser-only demo.
      needsImage = true;
    } else if (legacyImage) {
      const checked = validateImageUrl(legacyImage);
      if (checked.ok) images.push({ source: 'url', url: checked.url, alt: name });
      else needsImage = true;
    } else {
      needsImage = true;
    }
  }

  const id = String(p.id ?? `sc-${sku.toLowerCase()}`);
  return {
    doc: {
      _id: id,
      id,
      sku,
      name,
      slug: String(p.slug ?? '') || slugify(name) || slugify(sku) || id,
      category: String(p.category ?? 'Other'),
      price: Number(p.price ?? 0) || 0,
      comparePrice: Number(p.comparePrice ?? 0) || 0,
      stock: Number(p.stock ?? 0) || 0,
      lowStock: Number.isFinite(Number(p.lowStock)) ? Number(p.lowStock) : 3,
      description: String(p.description ?? ''),
      images,
      image: primaryImageUrl(images),
      featured: Boolean(p.featured),
      published: p.published !== false,
      badge: String(p.badge ?? ''),
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      updatedAt: new Date().toISOString(),
    },
    needsImage,
  };
}

/** Import browser-local (localStorage) data. Idempotent. */
export async function importClientData(payload: ClientMigrationPayload): Promise<MigrationReport> {
  await ensureStoreInitialized();
  const db = await getDb();
  const report = emptyReport();

  for (const raw of payload.products ?? []) {
    const { doc, needsImage } = convertLegacyProduct(raw);
    if (!doc) {
      report.productsSkipped += 1;
      continue;
    }
    if (needsImage) report.productsNeedingImage += 1;
    const existingById = await db
      .collection(COLLECTIONS.products)
      .findOne({ _id: doc._id as unknown as never });
    if (existingById) {
      report.productsSkipped += 1;
      continue;
    }
    const skuClash = await db.collection(COLLECTIONS.products).findOne({ sku: doc.sku });
    if (skuClash) {
      report.productsSkipped += 1;
      continue;
    }
    await db.collection(COLLECTIONS.products).insertOne(doc);
    report.productsInserted += 1;
  }

  for (const raw of payload.orders ?? []) {
    if (!raw || typeof raw !== 'object') continue;
    const order = raw as SocialOrder;
    if (!order.id) continue;
    const result = await db
      .collection(COLLECTIONS.orders)
      .updateOne(
        { _id: order.id as unknown as never },
        { $setOnInsert: { ...order, _id: order.id } as unknown as Record<string, unknown> },
        { upsert: true }
      );
    if (result.upsertedCount > 0) report.ordersInserted += 1;
  }

  for (const raw of payload.movements ?? []) {
    if (!raw || typeof raw !== 'object') continue;
    const movement = raw as StockMovement;
    if (!movement.id) continue;
    const result = await db
      .collection(COLLECTIONS.movements)
      .updateOne(
        { _id: movement.id as unknown as never },
        { $setOnInsert: { ...movement, _id: movement.id } as unknown as Record<string, unknown> },
        { upsert: true }
      );
    if (result.upsertedCount > 0) report.movementsInserted += 1;
  }

  // Only import browser settings when the stored settings are still defaults.
  if (payload.settings && Object.keys(payload.settings).length > 0) {
    const stored = await db.collection(COLLECTIONS.settings).findOne({ _id: 'store' as unknown as never });
    const storedIsDefault =
      !stored ||
      Object.entries(DEFAULT_SETTINGS).every(
        ([key, value]) => (stored as unknown as Record<string, unknown>)[key] === value
      );
    if (storedIsDefault) {
      await saveStoreSettings({ ...DEFAULT_SETTINGS, ...payload.settings });
      report.settingsImported = true;
    }
  }

  return report;
}

/** Full server-side migration: indexes + starter catalogue. Safe to re-run. */
export async function runServerMigration(): Promise<MigrationReport> {
  if (!isMongoConfigured()) throw new Error('MongoDB is not configured.');
  await ensureStoreInitialized();
  const report = emptyReport();
  report.starterSeeded = await seedStarterProducts();
  return report;
}
