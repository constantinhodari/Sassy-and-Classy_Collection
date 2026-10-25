'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  productById,
  stockState,
  money,
  IMAGE_FALLBACK,
} from '@/lib/utils';

interface ProductModalProps {
  productId: string;
}

export default function ProductModal({ productId }: ProductModalProps) {
  const { state, dispatch, addToCart, orderViaWhatsApp, orderViaInstagram } =
    useStore();
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const product = productById(state.products, productId);
  if (!product) return null;

  const st = stockState(product);
  const maxStock = Number(product.stock);

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url).filter(Boolean)
      : [product.image || IMAGE_FALLBACK];

  const currentImage = images[activeImageIndex] || images[0] || IMAGE_FALLBACK;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
  };

  const handleAdd = () => {
    if (addToCart(product.id, qty)) {
      handleClose();
    }
  };

  const handleWhatsApp = () => {
    orderViaWhatsApp([{ id: product.id, qty }], true);
    handleClose();
  };

  const handleInstagram = () => {
    orderViaInstagram([{ id: product.id, qty }], true);
    handleClose();
  };

  return (
    <div
      className="modal-backdrop"
      id="productModalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <section
        className="product-modal"
        id="productModal"
        role="dialog"
        aria-modal="true"
        aria-label="Product details"
      >
        <button
          className="icon-button modal-close"
          id="productModalClose"
          onClick={handleClose}
          aria-label="Close product details"
        >
          ✕
        </button>

        <div id="productModalBody">
          <div className="product-detail-layout">
            <div className="product-detail-image">
              <img
                src={currentImage}
                alt={product.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = IMAGE_FALLBACK;
                }}
              />
              {images.length > 1 && (
                <div className="product-modal-thumbnails">
                  {images.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      className={`product-modal-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={url} alt={`${product.name} view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="product-detail-copy">
              <p className="eyebrow">
                {product.category} · {product.sku}
              </p>
              <h2>{product.name}</h2>
              <div className="detail-price">
                {product.comparePrice > product.price && (
                  <span className="product-old-price">
                    {money(product.comparePrice)}
                  </span>
                )}
                {money(product.price)}
              </div>
              <p className="detail-description">
                {product.description ||
                  'A considered finishing touch for your personal style. Crafted with precision and an eye for enduring beauty.'}
              </p>

              {/* Luxury Guarantee Trust Badges */}
              <div className="product-assurances-grid">
                <div className="assurance-item">
                  <span className="assurance-icon">✦</span>
                  <div>
                    <strong>18K Gold PVD Coating</strong>
                    <small>Waterproof &amp; Non-Tarnish</small>
                  </div>
                </div>
                <div className="assurance-item">
                  <span className="assurance-icon">✧</span>
                  <div>
                    <strong>Hypoallergenic</strong>
                    <small>Nickel &amp; Lead Free</small>
                  </div>
                </div>
                <div className="assurance-item">
                  <span className="assurance-icon">📦</span>
                  <div>
                    <strong>Express Delivery</strong>
                    <small>Kigali Same-Day / Next-Day</small>
                  </div>
                </div>
                <div className="assurance-item">
                  <span className="assurance-icon">↺</span>
                  <div>
                    <strong>Easy Exchange</strong>
                    <small>7-Day Confirmation Window</small>
                  </div>
                </div>
              </div>

              <div className={`detail-stock ${st}`}>
                {st === 'out'
                  ? 'Currently out of stock'
                  : st === 'low'
                  ? `Only ${product.stock} left — a little favourite`
                  : 'In stock and ready to be loved'}
              </div>

              <div className="detail-quantity">
                <span>Quantity</span>
                <div className="quantity-control">
                  <button
                    id="detailQtyMinus"
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span id="detailQtyValue">{qty}</span>
                  <button
                    id="detailQtyPlus"
                    disabled={st === 'out' || qty >= maxStock}
                    onClick={() => setQty((prev) => Math.min(maxStock, prev + 1))}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="button button-dark"
                  id="detailAddCart"
                  disabled={st === 'out'}
                  onClick={handleAdd}
                >
                  Add to bag <span>＋</span>
                </button>
                <button
                  className="button button-whatsapp"
                  id="detailWhatsApp"
                  disabled={st === 'out'}
                  onClick={handleWhatsApp}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style={{ marginRight: 6 }}>
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.36-.51.08-1.17.11-3.37-.8-2.61-1.08-4.28-3.74-4.41-3.91-.13-.17-1.05-1.39-1.05-2.66s.66-1.89.9-2.14c.24-.25.52-.31.7-.31.18 0 .36 0 .52.01.17.01.4.06.61.57.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.32.39-.46.52-.15.15-.31.31-.13.62.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.46 1.52.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.78.84 2.09.99.31.15.52.23.6.36.08.13.08.76-.16 1.43z"/>
                  </svg>
                  Order via WhatsApp <span>↗</span>
                </button>
                <button
                  className="button button-instagram"
                  id="detailInstagram"
                  disabled={st === 'out'}
                  onClick={handleInstagram}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{ marginRight: 6 }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  Order via Instagram <span>↗</span>
                </button>
              </div>

              <p className="detail-note">
                Social orders are instant booking requests. Delivery is complimentary on orders above RWF 50,000.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
