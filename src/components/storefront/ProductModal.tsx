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

  const product = productById(state.products, productId);
  if (!product) return null;

  const st = stockState(product);
  const maxStock = Number(product.stock);

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
                src={product.image || IMAGE_FALLBACK}
                alt={product.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = IMAGE_FALLBACK;
                }}
              />
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
                  'A considered finishing touch for your personal style.'}
              </p>
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
                  Order via WhatsApp <span>↗</span>
                </button>
                <button
                  className="button button-instagram"
                  id="detailInstagram"
                  disabled={st === 'out'}
                  onClick={handleInstagram}
                >
                  Order via Instagram <span>↗</span>
                </button>
              </div>

              <p className="detail-note">
                Social orders are requests until we confirm availability and delivery.
                Delivery is calculated when we confirm your order.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
