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
  const progress =
    subtotal > threshold
      ? 'You have unlocked complimentary delivery.'
      : `You're ${money(remaining)} away from complimentary delivery.`;

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
            <div className="delivery-progress">{progress}</div>
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
                className="button button-dark"
                onClick={handleCheckoutWhatsApp}
              >
                Order via WhatsApp <span>↗</span>
              </button>
              <button
                className="button button-outline"
                onClick={handleCheckoutInstagram}
              >
                Order via Instagram <span>↗</span>
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
