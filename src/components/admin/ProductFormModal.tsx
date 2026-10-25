'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductImage } from '@/types';
import { useStore } from '@/context/StoreContext';
import { api, uploadProductImage, ApiError } from '@/lib/apiClient';
import { IMAGE_FALLBACK } from '@/lib/utils';

interface Props {
  product: Product | null;
  onClose: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function sourceLabel(image: ProductImage): string {
  return image.source === 'upload' ? 'Uploaded to MongoDB' : 'External URL';
}

export default function ProductFormModal({ product, onClose }: Props) {
  const { state, saveProduct, toast, apiErrorMessage } = useStore();
  const session = state.admin;
  const maxMb = session?.maxImageUploadMb ?? 5;
  const allowHttp = session?.allowInsecureImageUrls ?? false;

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [category, setCategory] = useState(product?.category || 'Earrings');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [comparePrice, setComparePrice] = useState(
    product?.comparePrice ? product.comparePrice.toString() : ''
  );
  const [stock, setStock] = useState(product?.stock?.toString() || '0');
  const [lowStock, setLowStock] = useState(product?.lowStock?.toString() || '3');
  const [description, setDescription] = useState(product?.description || '');
  const [featured, setFeatured] = useState(product?.featured || false);
  const [published, setPublished] = useState(product?.published !== false);

  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setPrice(product.price.toString());
    setComparePrice(product.comparePrice ? product.comparePrice.toString() : '');
    setStock(product.stock.toString());
    setLowStock(product.lowStock.toString());
    setDescription(product.description || '');
    setFeatured(product.featured);
    setPublished(product.published !== false);
    setImages(product.images ?? []);
  }, [product]);

  // ─── Image helpers ────────────────────────────────────────────────────────

  const originalFileIds = new Set(
    (product?.images ?? [])
      .filter((image) => image.source === 'upload')
      .map((image) => (image as { fileId: string }).fileId)
  );

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    const added: ProductImage[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast(`${file.name}: unsupported image type. Use JPEG, PNG, WebP, GIF or AVIF.`);
        continue;
      }
      if (file.size > maxMb * 1024 * 1024) {
        toast(`${file.name} is larger than the ${maxMb} MB limit.`);
        continue;
      }
      try {
        setProgress(0);
        const image = await uploadProductImage(file, altInput.trim() || name.trim(), setProgress);
        added.push(image);
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status >= 500 ||
            error.code === 'DATABASE_ERROR' ||
            error.code === 'MONGO_DNS_ERROR' ||
            error.code === 'MONGO_NOT_CONFIGURED')
        ) {
          toast(`Database error: ${apiErrorMessage(error)}`);
        } else {
          toast(`${file.name}: ${apiErrorMessage(error)}`);
        }
      }
    }
    setProgress(0);
    setUploading(false);
    if (added.length > 0) {
      setImages((prev) => [...prev, ...added]);
      toast(`${added.length} image${added.length === 1 ? '' : 's'} uploaded to MongoDB GridFS.`);
    }
  };

  const handleAddUrl = () => {
    const value = urlInput.trim();
    if (!value) {
      toast('Paste an image URL first.');
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      toast('Enter a valid absolute image URL, for example https://example.com/photo.jpg');
      return;
    }
    if (parsed.protocol === 'http:' && !allowHttp) {
      toast('Image URLs must use HTTPS. Ask the developer to enable insecure URLs for local testing.');
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      toast('Image URLs must start with https:// (or http:// in development).');
      return;
    }
    setImages((prev) => [
      ...prev,
      { source: 'url', url: parsed.toString(), alt: altInput.trim() || name.trim() },
    ]);
    setUrlInput('');
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const makePrimary = (index: number) => {
    setImages((prev) => {
      if (index === 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  };

  const setAlt = (index: number, alt: string) => {
    setImages((prev) => prev.map((image, i) => (i === index ? { ...image, alt } : image)));
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    // Only delete an upload that was added in this session; images from the
    // saved product are cleaned up by the server when the product is updated.
    if (image.source === 'upload' && !originalFileIds.has(image.fileId)) {
      try {
        await api.deleteImage(image.fileId);
      } catch {
        // The file stays in GridFS; a later cleanup can remove it safely.
      }
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanSku = sku.trim().toUpperCase();
    const numPrice = Number(price);
    const numCompare = Number(comparePrice) || 0;
    const numStock = Number(stock);
    const numLowStock = Number(lowStock);

    if (!cleanName) {
      toast('Product name is required.');
      return;
    }
    if (!cleanSku) {
      toast('SKU is required.');
      return;
    }
    if (state.products.some((p) => p.sku.toUpperCase() === cleanSku && p.id !== product?.id)) {
      toast('That SKU is already in use. Please choose a unique SKU.');
      return;
    }
    if (isNaN(numPrice) || numPrice < 0) {
      toast('Selling price must be a non-negative number.');
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      toast('Stock must be a non-negative number.');
      return;
    }
    if (isNaN(numLowStock) || numLowStock < 0) {
      toast('Low stock threshold must be a non-negative number.');
      return;
    }
    if (images.length === 0) {
      toast('Add at least one product image — upload a file or paste an image URL.');
      return;
    }

    setSaving(true);
    const saved = await saveProduct({
      id: product?.id,
      name: cleanName,
      sku: cleanSku,
      slug: product?.slug,
      category,
      price: numPrice,
      comparePrice: numCompare,
      stock: numStock,
      lowStock: numLowStock,
      description: description.trim(),
      images,
      featured,
      published,
      badge: product?.badge || '',
    });
    setSaving(false);
    if (saved) onClose();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="modal-backdrop admin-form-backdrop"
      id="adminProductModalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="admin-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adminProductModalTitle"
      >
        <div className="admin-form-heading">
          <div>
            <p className="eyebrow">PRODUCT STUDIO</p>
            <h2 id="adminProductModalTitle">{product ? 'Edit product' : 'Add a product'}</h2>
          </div>
          <button
            className="icon-button"
            id="adminProductModalClose"
            onClick={onClose}
            aria-label="Close product form"
          >
            ✕
          </button>
        </div>

        <form id="adminProductForm" className="admin-product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field span-two">
              Product name
              <input
                id="productName"
                required
                maxLength={100}
                placeholder="e.g. The Solstice Hoops"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="form-field">
              SKU
              <input
                id="productSKU"
                required
                maxLength={40}
                placeholder="SC-EAR-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </label>

            <label className="form-field">
              Category
              <select
                id="productCategory"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Earrings</option>
                <option>Necklaces</option>
                <option>Rings</option>
                <option>Bracelets</option>
                <option>Sunglasses</option>
                <option>Pins</option>
                <option>Other</option>
              </select>
            </label>

            <label className="form-field">
              Selling price (RWF)
              <input
                id="productPrice"
                type="number"
                min={0}
                step={1}
                required
                placeholder="8000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>

            <label className="form-field">
              Compare-at price (optional)
              <input
                id="productComparePrice"
                type="number"
                min={0}
                step={1}
                placeholder="10000"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
              />
            </label>

            <label className="form-field">
              Stock quantity
              <input
                id="productStock"
                type="number"
                min={0}
                step={1}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </label>

            <label className="form-field">
              Low-stock threshold
              <input
                id="productLowStock"
                type="number"
                min={0}
                step={1}
                required
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
              />
            </label>

            {/* ── Product images ─────────────────────────────────────────── */}
            <div className="span-two" id="productImageManager">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className={`admin-btn ${mode === 'upload' ? '' : 'secondary'}`}
                  onClick={() => setMode('upload')}
                  aria-pressed={mode === 'upload'}
                >
                  Upload image
                </button>
                <button
                  type="button"
                  className={`admin-btn ${mode === 'url' ? '' : 'secondary'}`}
                  onClick={() => setMode('url')}
                  aria-pressed={mode === 'url'}
                >
                  Image URL
                </button>
                <span style={{ fontSize: 10, color: '#899198' }}>
                  {images.length} image{images.length === 1 ? '' : 's'} · the first image is the
                  primary storefront image
                </span>
              </div>

              <label className="form-field" style={{ marginBottom: 10 }}>
                Alt text (accessibility description)
                <input
                  type="text"
                  maxLength={160}
                  placeholder="e.g. Gold hoop earrings on a cream background"
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                />
              </label>

              {mode === 'upload' ? (
                <div className="form-field">
                  <input
                    id="productImageFile"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    disabled={uploading}
                    onChange={handleUpload}
                  />
                  <small>
                    JPEG, PNG, WebP, GIF or AVIF · up to {maxMb} MB each. Files are validated on
                    the server and stored in MongoDB GridFS.
                  </small>
                  {uploading && (
                    <div
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={{
                        marginTop: 8,
                        height: 6,
                        borderRadius: 4,
                        background: '#e6ded2',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: '#1c1b19',
                          transition: 'width .2s ease',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-field">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      id="productImage"
                      type="url"
                      placeholder="https://example.com/product.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      style={{ flex: '1 1 240px' }}
                    />
                    <button type="button" className="admin-btn" onClick={handleAddUrl}>
                      ＋ Add image
                    </button>
                  </div>
                  <small>
                    {allowHttp
                      ? 'HTTPS is recommended; http:// is allowed in this environment.'
                      : 'Only HTTPS image URLs are accepted.'}{' '}
                    The image is not copied into MongoDB — it stays on the external host, so it
                    depends on that source staying available.
                  </small>
                </div>
              )}

              {images.length > 0 ? (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '14px 0 0',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  {images.map((image, index) => (
                    <li
                      key={`${image.url}-${index}`}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        border: '1px solid #e6ded2',
                        borderRadius: 10,
                        padding: 10,
                        background: index === 0 ? '#faf7f1' : '#fff',
                      }}
                    >
                      <img
                        src={image.url || IMAGE_FALLBACK}
                        alt={image.alt || name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = IMAGE_FALLBACK;
                        }}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 8,
                          flex: '0 0 auto',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 12 }}>
                          {index === 0 ? 'Primary image' : `Image ${index + 1}`}
                        </strong>
                        <small style={{ display: 'block', color: '#899198', marginBottom: 6 }}>
                          {sourceLabel(image)}
                        </small>
                        <input
                          type="text"
                          value={image.alt}
                          placeholder="Alt text"
                          maxLength={160}
                          onChange={(e) => setAlt(index, e.target.value)}
                          style={{ width: '100%', fontSize: 12 }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          flex: '0 0 auto',
                        }}
                      >
                        <button
                          type="button"
                          className="small-action"
                          onClick={() => makePrimary(index)}
                          disabled={index === 0}
                        >
                          Make primary
                        </button>
                        <button
                          type="button"
                          className="small-action"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          aria-label="Move image up"
                        >
                          ↑ Move up
                        </button>
                        <button
                          type="button"
                          className="small-action"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                          aria-label="Move image down"
                        >
                          ↓ Move down
                        </button>
                        <button
                          type="button"
                          className="small-action remove"
                          onClick={() => removeImage(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-empty" style={{ marginTop: 12 }}>
                  <strong>No product images yet</strong>
                  Upload a file or paste an image URL to add one.
                </div>
              )}
            </div>

            <label className="form-field span-two">
              Short description
              <textarea
                id="productDescription"
                rows={3}
                maxLength={500}
                placeholder="What makes this piece special?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="form-check span-two">
              <input
                id="productFeatured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Feature this product on the homepage
            </label>

            <label className="form-check span-two">
              <input
                id="productPublished"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Publish this product in the storefront
            </label>
          </div>

          <div className="admin-form-actions">
            <button
              className="button button-outline"
              type="button"
              id="cancelProductForm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-dark" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving…' : 'Save product'} <span>↗</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
