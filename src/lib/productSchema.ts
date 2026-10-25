import type { Product, ProductImage } from '@/types';
import { slugify } from '@/lib/slug';
import { isValidFileId, imageEndpoint } from '@/lib/imageStore';

/** Shape of a product document as stored in MongoDB. */
export interface ProductDocument extends Omit<Product, 'id'> {
  _id: string;
}

export interface NormalizedProduct {
  sku: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  comparePrice: number;
  stock: number;
  lowStock: number;
  description: string;
  images: ProductImage[];
  featured: boolean;
  published: boolean;
  badge: string;
}

const CATEGORIES = new Set([
  'Earrings',
  'Necklaces',
  'Rings',
  'Bracelets',
  'Sunglasses',
  'Pins',
  'Other',
]);

export function allowInsecureImageUrls(): boolean {
  return String(process.env.ALLOW_INSECURE_IMAGE_URLS || '').toLowerCase() === 'true';
}

/**
 * Validate an external image URL. HTTPS is required unless the operator has
 * explicitly opted into insecure URLs for local development.
 */
export function validateImageUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const value = String(raw || '').trim();
  if (!value) return { ok: false, error: 'Image URL cannot be empty.' };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: `"${value}" is not a valid absolute image URL.` };
  }
  if (parsed.protocol === 'https:') return { ok: true, url: parsed.toString() };
  if (parsed.protocol === 'http:') {
    if (allowInsecureImageUrls()) return { ok: true, url: parsed.toString() };
    return {
      ok: false,
      error: `Image URLs must use HTTPS. Enable ALLOW_INSECURE_IMAGE_URLS=true to allow http:// during development (${value}).`,
    };
  }
  return { ok: false, error: 'Image URL must use the http:// or https:// protocol.' };
}

/**
 * Normalize the submitted image list into stored image records.
 * Uploaded images must carry a valid GridFS file id; external images must have
 * a valid, allowed URL. Nothing is fetched from the network here, which keeps
 * the endpoint free of server-side request forgery.
 */
export function normalizeProductImages(raw: unknown): { images: ProductImage[]; errors: string[] } {
  const images: ProductImage[] = [];
  const errors: string[] = [];
  if (raw == null) return { images, errors };
  if (!Array.isArray(raw)) return { images, errors: ['`images` must be an array.'] };

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      errors.push(`Image ${index + 1} is not a valid image record.`);
      return;
    }
    const record = entry as Record<string, unknown>;
    const alt = String(record.alt ?? '').trim().slice(0, 200);
    const fileId = typeof record.fileId === 'string' ? record.fileId.trim() : '';

    // Uploaded image: identified by a GridFS file id.
    if (fileId || record.source === 'upload') {
      if (!isValidFileId(fileId)) {
        errors.push(`Image ${index + 1} has an invalid upload reference.`);
        return;
      }
      images.push({ source: 'upload', fileId, url: imageEndpoint(fileId), alt });
      return;
    }

    // External image: identified by a URL.
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    if (!url) {
      errors.push(`Image ${index + 1} needs either an uploaded file or a URL.`);
      return;
    }
    const validated = validateImageUrl(url);
    if (!validated.ok) {
      errors.push(`Image ${index + 1}: ${validated.error}`);
      return;
    }
    images.push({ source: 'url', url: validated.url, alt });
  });

  return { images, errors };
}

/** The rendered primary image: the first gallery entry, else a legacy field. */
export function primaryImageUrl(images: ProductImage[], fallback = ''): string {
  return images[0]?.url || fallback;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: NormalizedProduct;
}

/** Server-side validation for product create/update payloads. */
export function validateProductInput(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['A product payload is required.'] };
  }
  const body = raw as Record<string, unknown>;

  const name = String(body.name ?? '').trim();
  if (!name) errors.push('Product name is required.');
  if (name.length > 100) errors.push('Product name must be 100 characters or fewer.');

  const sku = String(body.sku ?? '').trim().toUpperCase();
  if (!sku) errors.push('SKU is required.');
  if (sku.length > 40) errors.push('SKU must be 40 characters or fewer.');

  const categoryRaw = String(body.category ?? '').trim() || 'Other';
  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : 'Other';

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) errors.push('Selling price must be a non-negative number.');

  const comparePrice = Number(body.comparePrice ?? 0);
  if (!Number.isFinite(comparePrice) || comparePrice < 0) {
    errors.push('Compare-at price must be a non-negative number.');
  }

  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    errors.push('Stock quantity must be a whole number of zero or more.');
  }

  const lowStock = Number(body.lowStock ?? 3);
  if (!Number.isInteger(lowStock) || lowStock < 0) {
    errors.push('Low-stock threshold must be a whole number of zero or more.');
  }

  const description = String(body.description ?? '').trim().slice(0, 500);
  const badge = String(body.badge ?? '').trim().slice(0, 40);

  const { images, errors: imageErrors } = normalizeProductImages(body.images);
  errors.push(...imageErrors);
  if (images.length === 0) {
    errors.push('Add at least one product image (upload a file or paste an image URL).');
  }

  if (errors.length > 0) return { ok: false, errors };

  const slugSource = String(body.slug ?? '').trim() || name;
  const slug = slugify(slugSource) || slugify(sku) || `product-${Date.now().toString(36)}`;

  return {
    ok: true,
    errors: [],
    value: {
      name,
      sku,
      slug,
      category,
      price: Math.round(price),
      comparePrice: Math.round(comparePrice),
      stock,
      lowStock,
      description,
      images,
      featured: Boolean(body.featured),
      published: body.published !== false,
      badge,
    },
  };
}

/** Convert a stored MongoDB document into the client-facing `Product`. */
export function serializeProduct(doc: Record<string, unknown>): Product {
  const images = Array.isArray(doc.images) ? (doc.images as ProductImage[]) : [];
  const legacyImage = typeof doc.image === 'string' ? doc.image : '';
  return {
    id: String(doc._id),
    sku: String(doc.sku ?? ''),
    name: String(doc.name ?? ''),
    slug: String(doc.slug ?? ''),
    category: String(doc.category ?? 'Other'),
    price: Number(doc.price ?? 0),
    comparePrice: Number(doc.comparePrice ?? 0),
    stock: Number(doc.stock ?? 0),
    lowStock: Number(doc.lowStock ?? 3),
    description: String(doc.description ?? ''),
    image: primaryImageUrl(images, legacyImage),
    images,
    featured: Boolean(doc.featured),
    published: doc.published !== false,
    createdAt: String(doc.createdAt ?? new Date().toISOString()),
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
    badge: String(doc.badge ?? ''),
  };
}
