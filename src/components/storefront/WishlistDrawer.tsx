'use client';

import { useStore } from '@/context/StoreContext';
import {
  productById,
  stockState,
  stockLabel,
  money,
  IMAGE_FALLBACK,
} from '@/lib/utils';

export default function WishlistDrawer() {
  const { state, dispatch, toggleWishlist, addToCart } = useStore();
  const isOpen = state.wishlistOpen;
  const count = state.wishlist.length;

  const validProducts = state.wishlist
    .map((id) => productById(state.products, id))
    .filter((p): p is (typeof state.products)[0] => !!p);

  const handleClose = () => {
    dispatch({ type: 'CLOSE_WISHLIST' });
  };

  const handleExplore = () => {
    handleClose();
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleView = (id: string) => {
    handleClose();
    dispatch({ type: 'OPEN_PRODUCT_MODAL', payload: id });
  };

  const handleAddToCart = (id: string) => {
    addToCart(id);
  };

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'show' : ''}`}
        id="wishlistOverlay"
        hidden={!isOpen}
        onClick={handleClose}
      />
      <aside
        className={`drawer ${isOpen ? 'open' : ''}`}
        id="wishlistDrawer"
        aria-label="Wishlist"
        aria-hidden={!isOpen}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">SAVED WITH LOVE</p>
            <h2>
              Your wishlist <span id="wishlistTitleCount">({count})</span>
            </h2>
          </div>
          <button
            className="icon-button close-drawer"
            onClick={handleClose}
            aria-label="Close wishlist"
          >
            ✕
          </button>
        </div>

        <div className="drawer-content" id="wishlistContent">
          {validProducts.length === 0 ? (
            <div className="drawer-empty">
              <span className="empty-icon">♡</span>
              <h3>Nothing saved just yet.</h3>
              <p>Tap the little heart on a piece to keep it close.</p>
              <button
                className="button button-dark"
                id="emptyWishlistShop"
                onClick={handleExplore}
              >
                Explore the collection →
              </button>
            </div>
          ) : (
            validProducts.map((p) => {
              const stateClass = stockState(p);
              return (
                <div className="wishlist-line" key={p.id}>
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
                    <div
                      className={`stock-label ${stateClass}`}
                      style={{ fontSize: 9, marginTop: 6 }}
                    >
                      <i className="stock-dot"></i>
                      {stockLabel(p)}
                    </div>
                  </div>
                  <div className="wishlist-actions">
                    <button
                      className="small-action"
                      onClick={() => handleView(p.id)}
                    >
                      View
                    </button>
                    <button
                      className="small-action"
                      disabled={stateClass === 'out'}
                      onClick={() => handleAddToCart(p.id)}
                    >
                      Add to bag
                    </button>
                    <button
                      className="small-action remove"
                      onClick={() => toggleWishlist(p.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
