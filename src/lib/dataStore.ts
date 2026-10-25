import { randomUUID } from 'node:crypto';
import type { Product, SocialOrder, StockMovement, StoreSettings } from '@/types';
import { COLLECTIONS, getDb } from '@/lib/mongodb';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { STARTER_PRODUCTS } from '@/lib/storage';
import {
  serializeProduct,
  type NormalizedProduct,
  type ProductDocument,
} from '@/lib/productSchema';

/**
 * MongoDB data access for products, inventory movements, orders and settings.
 * Every function talks to the same database (`MONGODB_DB`).
 */

// ─── Bootstrap ──────────────────────────────────────────────────────────────

let bootstrapPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTIONS.products).createIndexes([
    { key: { sku: 1 }, name: 'sku_unique', unique: true },
    { key: { slug: 1 }, name: 'slug_unique', unique: true },
    { key: { published: 1 }, name: 'published_idx' },
    { key: { category: 1 }, name: 'category_idx' },
    { key: { 'images.fileId': 1 }, name: 'image_fileid_idx' },
  ]);
  await db.collection(COLLECTIONS.orders).createIndex({ createdAt: -1 });
  await db.collection(COLLECTIONS.movements).createIndex({ timestamp: -1 });

  // Seed the starter catalogue once, so a brand-new database is never empty.
  const productCount = await db.collection(COLLECTIONS.products).estimatedDocumentCount();
  if (productCount === 0) {
    const now = new Date().toISOString();
    await db.collection(COLLECTIONS.products).insertMany(
      STARTER_PRODUCTS.map((product) => ({
        ...product,
        _id: product.id,
        updatedAt: now,
      })) as unknown as Record<string, unknown>[],
      { ordered: false }
    );
  }

  // Seed default store settings once.
  await db
    .collection(COLLECTIONS.settings)
    .updateOne(
      { _id: 'store' as unknown as never },
      { $setOnInsert: { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
}

/** Idempotent: safe to call on every request. */
export function ensureStoreInitialized(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function listProducts(includeUnpublished = false): Promise<Product[]> {
  await ensureStoreInitialized();
  const db = await getDb();
  const query = includeUnpublished ? {} : { published: true };
  const docs = await db
    .collection(COLLECTIONS.products)
    .find(query)
    .sort({ featured: -1, createdAt: -1 })
    .toArray();
  return docs.map((doc) => serializeProduct(doc as Record<string, unknown>));
}

export async function getProduct(id: string): Promise<Product | null> {
  await ensureStoreInitialized();
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.products).findOne({ _id: id as unknown as never });
  return doc ? serializeProduct(doc as Record<string, unknown>) : null;
}

/** Ensure the slug is unique, appending a numeric suffix when needed. */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const db = await getDb();
  let candidate = base;
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const clash = await db
      .collection(COLLECTIONS.products)
      .findOne({ slug: candidate, ...(ignoreId ? { _id: { $ne: ignoreId as unknown as never } } : {}) });
    if (!clash) return candidate;
    candidate = `${base}-${attempt + 1}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export class DuplicateSkuError extends Error {
  constructor(sku: string) {
    super(`SKU ${sku} is already used by another product.`);
    this.name = 'DuplicateSkuError';
  }
}

async function assertSkuFree(sku: string, ignoreId?: string): Promise<void> {
  const db = await getDb();
  const clash = await db
    .collection(COLLECTIONS.products)
    .findOne({
      sku,
      ...(ignoreId ? { _id: { $ne: ignoreId as unknown as never } } : {}),
    });
  if (clash) throw new DuplicateSkuError(sku);
}

export async function createProduct(value: NormalizedProduct): Promise<Product> {
  await ensureStoreInitialized();
  await assertSkuFree(value.sku);
  const db = await getDb();
  const now = new Date().toISOString();
  const doc: ProductDocument = {
    _id: `sc-${value.sku.toLowerCase()}-${Date.now().toString(36)}`,
    ...value,
    slug: await uniqueSlug(value.slug),
    image: value.images[0]?.url || '',
    createdAt: now,
    updatedAt: now,
  };
  await db
    .collection(COLLECTIONS.products)
    .insertOne(doc as unknown as Record<string, unknown>);
  return serializeProduct(doc as unknown as Record<string, unknown>);
}

export async function updateProduct(id: string, value: NormalizedProduct): Promise<Product | null> {
  await ensureStoreInitialized();
  const existing = await getProduct(id);
  if (!existing) return null;
  await assertSkuFree(value.sku, id);
  const db = await getDb();
  const now = new Date().toISOString();
  const slug = value.slug === existing.slug ? existing.slug : await uniqueSlug(value.slug, id);
  await db.collection(COLLECTIONS.products).updateOne(
    { _id: id as unknown as never },
    {
      $set: {
        ...value,
        slug,
        image: value.images[0]?.url || '',
        updatedAt: now,
      },
    }
  );
  return getProduct(id);
}

export async function deleteProduct(id: string): Promise<Product | null> {
  await ensureStoreInitialized();
  const existing = await getProduct(id);
  if (!existing) return null;
  const db = await getDb();
  await db.collection(COLLECTIONS.products).deleteOne({ _id: id as unknown as never });
  return existing;
}

export async function setProductPublished(id: string, published: boolean): Promise<Product | null> {
  await ensureStoreInitialized();
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.products).updateOne(
    { _id: id as unknown as never },
    { $set: { published, updatedAt: new Date().toISOString() } }
  );
  if (result.matchedCount === 0) return null;
  return getProduct(id);
}

/** Apply a stock delta. Returns the updated product, or null when not found. */
export async function addStock(id: string, delta: number): Promise<Product | null> {
  await ensureStoreInitialized();
  const product = await getProduct(id);
  if (!product) return null;
  const next = Number(product.stock) + delta;
  if (next < 0) throw new Error(`Stock cannot go below zero (${product.name}).`);
  const db = await getDb();
  await db.collection(COLLECTIONS.products).updateOne(
    { _id: id as unknown as never },
    { $set: { stock: next, updatedAt: new Date().toISOString() } }
  );
  return { ...product, stock: next, updatedAt: new Date().toISOString() };
}

/** Set an absolute stock value. */
export async function setStock(id: string, stock: number): Promise<Product | null> {
  await ensureStoreInitialized();
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.products).updateOne(
    { _id: id as unknown as never },
    { $set: { stock, updatedAt: new Date().toISOString() } }
  );
  if (result.matchedCount === 0) return null;
  return getProduct(id);
}

// ─── Stock movements ────────────────────────────────────────────────────────

export async function listMovements(limit = 200): Promise<StockMovement[]> {
  await ensureStoreInitialized();
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.movements)
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return docs.map((doc) => ({
    id: String(doc._id),
    productId: String(doc.productId ?? ''),
    sku: String(doc.sku ?? ''),
    productName: String(doc.productName ?? ''),
    previousQty: Number(doc.previousQty ?? 0),
    change: Number(doc.change ?? 0),
    newQty: Number(doc.newQty ?? 0),
    reason: String(doc.reason ?? ''),
    note: String(doc.note ?? ''),
    actor: String(doc.actor ?? ''),
    timestamp: String(doc.timestamp ?? ''),
  }));
}

export async function recordMovement(
  movement: Omit<StockMovement, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<StockMovement> {
  await ensureStoreInitialized();
  const db = await getDb();
  const doc = {
    _id: `MOV-${Date.now()}-${randomUUID().slice(0, 8)}`,
    ...movement,
    timestamp: movement.timestamp || new Date().toISOString(),
  };
  await db.collection(COLLECTIONS.movements).insertOne(doc as unknown as Record<string, unknown>);
  return {
    id: doc._id,
    productId: doc.productId,
    sku: doc.sku,
    productName: doc.productName,
    previousQty: doc.previousQty,
    change: doc.change,
    newQty: doc.newQty,
    reason: doc.reason,
    note: doc.note,
    actor: doc.actor,
    timestamp: doc.timestamp,
  };
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function listOrders(): Promise<SocialOrder[]> {
  await ensureStoreInitialized();
  const db = await getDb();
  const docs = await db.collection(COLLECTIONS.orders).find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => doc as unknown as SocialOrder);
}

export async function getOrder(id: string): Promise<SocialOrder | null> {
  await ensureStoreInitialized();
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.orders).findOne({ _id: id as unknown as never });
  return doc ? (doc as unknown as SocialOrder) : null;
}

export async function createOrder(order: SocialOrder): Promise<SocialOrder> {
  await ensureStoreInitialized();
  const db = await getDb();
  await db
    .collection(COLLECTIONS.orders)
    .insertOne({ ...order, _id: order.id } as unknown as Record<string, unknown>);
  return order;
}

async function persistOrder(order: SocialOrder): Promise<SocialOrder> {
  const db = await getDb();
  const { id, ...rest } = order;
  await db
    .collection(COLLECTIONS.orders)
    .updateOne({ _id: id as unknown as never }, { $set: rest as Record<string, unknown> });
  return order;
}

export type OrderActionResult =
  | { ok: true; order: SocialOrder; products: Product[] }
  | { ok: false; error: string };

/** Confirm a pending order and deduct stock for every line. */
export async function confirmOrder(id: string, actor: string): Promise<OrderActionResult> {
  const order = await getOrder(id);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.status !== 'Pending Confirmation') {
    return { ok: false, error: `Order ${id} is already ${order.status}.` };
  }
  for (const line of order.items) {
    const product = await getProduct(line.productId);
    if (!product || product.stock < line.qty) {
      return { ok: false, error: `Not enough stock for ${line.name}.` };
    }
  }
  const products: Product[] = [];
  for (const line of order.items) {
    const previous = await getProduct(line.productId);
    if (!previous) continue;
    const updated = await addStock(line.productId, -line.qty);
    if (!updated) continue;
    products.push(updated);
    await recordMovement({
      productId: updated.id,
      sku: updated.sku,
      productName: updated.name,
      previousQty: previous.stock,
      change: -line.qty,
      newQty: updated.stock,
      reason: 'Confirmed social order',
      note: `Order ${id}`,
      actor,
    });
  }
  const confirmedAt = new Date().toISOString();
  const nextOrder: SocialOrder = { ...order, status: 'Confirmed', stockAdjusted: true, confirmedAt };
  await persistOrder(nextOrder);
  return { ok: true, order: nextOrder, products };
}

/** Cancel an order and restore stock when it had already been deducted. */
export async function cancelOrder(id: string, actor: string): Promise<OrderActionResult> {
  const order = await getOrder(id);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.status === 'Cancelled' || order.status === 'Completed') {
    return { ok: false, error: `Order ${id} cannot be cancelled (${order.status}).` };
  }
  const products: Product[] = [];
  if (order.stockAdjusted && !order.stockRestored) {
    for (const line of order.items) {
      const previous = await getProduct(line.productId);
      if (!previous) continue;
      const updated = await addStock(line.productId, line.qty);
      if (!updated) continue;
      products.push(updated);
      await recordMovement({
        productId: updated.id,
        sku: updated.sku,
        productName: updated.name,
        previousQty: previous.stock,
        change: line.qty,
        newQty: updated.stock,
        reason: 'Cancelled order restock',
        note: `Restored from order ${id}`,
        actor,
      });
    }
  }
  const nextOrder: SocialOrder = {
    ...order,
    status: 'Cancelled',
    stockRestored: true,
    cancelledAt: new Date().toISOString(),
  };
  await persistOrder(nextOrder);
  return { ok: true, order: nextOrder, products };
}

export async function setOrderStatus(id: string, status: SocialOrder['status']): Promise<SocialOrder | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const nextOrder: SocialOrder = {
    ...order,
    status,
    ...(status === 'Completed' ? { completedAt: new Date().toISOString() } : {}),
  };
  await persistOrder(nextOrder);
  return nextOrder;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getStoreSettings(): Promise<StoreSettings> {
  await ensureStoreInitialized();
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.settings).findOne({ _id: 'store' as unknown as never });
  return { ...DEFAULT_SETTINGS, ...((doc as unknown as Partial<StoreSettings>) || {}) };
}

export async function saveStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
  await ensureStoreInitialized();
  const db = await getDb();
  await db.collection(COLLECTIONS.settings).updateOne(
    { _id: 'store' as unknown as never },
    { $set: { ...settings, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  return settings;
}

// ─── Newsletter ─────────────────────────────────────────────────────────────

export async function saveNewsletterEmail(email: string): Promise<void> {
  await ensureStoreInitialized();
  const db = await getDb();
  await db
    .collection(COLLECTIONS.newsletter)
    .updateOne(
      { _id: email.toLowerCase() as unknown as never },
      { $set: { email, subscribedAt: new Date().toISOString() } },
      { upsert: true }
    );
}
