'use client';

import { useStore } from '@/context/StoreContext';
import {
  productById,
  cartCount,
  cartSubtotal,
  money,
  IMAGE_FALLBACK,
} from '@/lib/utils';

export default function CartDrawer() {
  const {
    state,
    dispatch,
    changeCartQty,
    removeFromCart,
    orderViaWhatsApp,
    orderViaInstagram,
  } = useStore();

  const isOpen = state.cartOpen;
  const count = cartCount(state.cart);
  const subtotal = cartSubtotal(state.cart, state.products);
  const threshold = Number(state.settings.freeDeliveryThreshold);
  const deliveryFee = Number(state.settings.deliveryFee);
  const fee = subtotal > threshold ? 0 : deliveryFee;
  const remaining = Math.max(0, threshold - subtotal);
  const progressPercent = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
  const isUnlocked = subtotal >= threshold;

  const validCartLines = state.cart
    .map((line) => {
      const p = productById(state.products, line.id);
      return p ? { line, product: p } : null;
    })
    .filter(
      (item): item is { line: (typeof state.cart)[0]; product: (typeof state.products)[0] } =>
        item !== null
    );

  const handleClose = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const handleExplore = () => {
    handleClose();
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckoutWhatsApp = () => {
    const items = validCartLines.map(({ line }) => ({ id: line.id, qty: line.qty }));
    orderViaWhatsApp(items);
  };

  const handleCheckoutInstagram = () => {
    const items = validCartLines.map(({ line }) => ({ id: line.id, qty: line.qty }));
    orderViaInstagram(items);
  };

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'show' : ''}`}
        id="cartOverlay"
        hidden={!isOpen}
        onClick={handleClose}
      />
      <aside
        className={`drawer ${isOpen ? 'open' : ''}`}
        id="cartDrawer"
        aria-label="Shopping bag"
        aria-hidden={!isOpen}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">YOUR LITTLE TREASURES</p>
            <h2>
              Your bag <span id="cartTitleCount">({count})</span>
            </h2>
          </div>
          <button
            className="icon-button close-drawer"
            onClick={handleClose}
            aria-label="Close shopping bag"
          >
            ✕
          </button>
        </div>

        <div className="drawer-content" id="cartContent">
          {validCartLines.length === 0 ? (
            <div className="drawer-empty">
              <span className="empty-icon">♡</span>
              <h3>Your bag is taking a little nap.</h3>
              <p>Find a piece that feels like you, and it will be waiting here.</p>
              <button className="button button-dark" id="emptyCartShop" onClick={handleExplore}>
                Explore the collection →
              </button>
            </div>
          ) : (
            validCartLines.map(({ line, product: p }) => (
              <div className="cart-line" key={line.id}>
                <img
                  src={p.image || IMAGE_FALLBACK}
                  alt={p.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = IMAGE_FALLBACK;
                  }}
                />
                <div>
                  <div className="line-category">{p.category}</div>
                  <h3>{p.name}</h3>
                  <div className="line-price">{money(p.price)}</div>
                  <div className="quantity-control">
                    <button
                      onClick={() => changeCartQty(p.id, -1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      onClick={() => changeCartQty(p.id, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="remove-line"
                  onClick={() => removeFromCart(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {validCartLines.length > 0 && (
          <div className="drawer-footer" id="cartFooter">
            <div className="delivery-progress-card">
              <div className="delivery-progress-header">
                <span className="delivery-icon">{isUnlocked ? '✨' : '✦'}</span>
                <span>
                  {isUnlocked ? (
                    <strong>Complimentary Delivery Unlocked!</strong>
                  ) : (
                    <>
                      Add <strong>{money(remaining)}</strong> more for <strong>Free Delivery</strong>
                    </>
                  )}
                </span>
              </div>
              <div className="delivery-progress-track">
                <div
                  className="delivery-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="cart-totals">
              <span>Item subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="cart-totals">
              <span>Estimated delivery</span>
              <span>{fee === 0 ? 'Complimentary' : money(fee)}</span>
            </div>
            <div className="cart-totals total">
              <span>Estimated total</span>
              <span>{money(subtotal + fee)}</span>
            </div>

            <div className="drawer-actions">
              <button
                className="button-whatsapp-checkout"
                onClick={handleCheckoutWhatsApp}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.36-.51.08-1.17.11-3.37-.8-2.61-1.08-4.28-3.74-4.41-3.91-.13-.17-1.05-1.39-1.05-2.66s.66-1.89.9-2.14c.24-.25.52-.31.7-.31.18 0 .36 0 .52.01.17.01.4.06.61.57.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.32.39-.46.52-.15.15-.31.31-.13.62.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.46 1.52.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.78.84 2.09.99.31.15.52.23.6.36.08.13.08.76-.16 1.43z"/>
                </svg>
                Order via WhatsApp ↗
              </button>
              <button
                className="button-instagram-checkout"
                onClick={handleCheckoutInstagram}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                Order via Instagram ↗
              </button>
              <button className="text-link" id="continueShopping" onClick={handleClose}>
                Continue shopping <span>→</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
