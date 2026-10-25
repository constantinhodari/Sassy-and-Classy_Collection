'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { filteredAndSortedProducts, stockState, stockLabel, money, IMAGE_FALLBACK } from '@/lib/utils';
import type { Product } from '@/types';

const FILTER_CATEGORIES = ['All', 'Earrings', 'Necklaces', 'Rings', 'Bracelets', 'Sunglasses', 'Pins'];

interface Props {
  onProductsRendered?: () => void;
}

export default function ShopSection({ onProductsRendered }: Props) {
  const { state, dispatch, addToCart, toggleWishlist, orderViaWhatsApp } = useStore();
  const { activeFilter, activeSort, searchQuery, products, wishlist } = state;

  const filteredProducts = filteredAndSortedProducts(products, activeFilter, searchQuery, activeSort);

  useEffect(() => {
    onProductsRendered?.();
  }, [filteredProducts.length, activeFilter, activeSort, searchQuery]); // eslint-disable-line

  // Product card flip-in intersection observer
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>('.product-card');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      cards.forEach((c) => c.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -25px 0px' }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  });

  const handleFilterChange = (filter: string) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_SORT', payload: e.target.value });
  };

  const handleClearFilters = () => {
    dispatch({ type: 'SET_FILTER', payload: 'All' });
    dispatch({ type: 'SET_SEARCH', payload: '' });
  };

  return (
    <section className="shop-section section-shell section-padding" id="shop">
      <div className="section-heading heading-split">
        <div>
          <p className="eyebrow">THE CURRENT OBSESSION</p>
          <h2>
            Pieces to <em>keep close.</em>
          </h2>
        </div>
        <button
          className="text-link"
          id="viewAllLink"
          onClick={() => {
            dispatch({ type: 'SET_FILTER', payload: 'All' });
            dispatch({ type: 'SET_SEARCH', payload: '' });
          }}
        >
          Explore all pieces <span>→</span>
        </button>
      </div>

      <div className="shop-toolbar">
        <div className="filter-chips" id="filterChips">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-chip${activeFilter === cat ? ' active' : ''}`}
              data-filter={cat}
              onClick={() => handleFilterChange(cat)}
            >
              {cat === 'All' ? 'All pieces' : cat}
            </button>
          ))}
        </div>
        <label className="sort-select-wrap">
          <span>Sort by</span>
          <select id="sortProducts" aria-label="Sort products" value={activeSort} onChange={handleSortChange}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="low-high">Price: low to high</option>
            <option value="high-low">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="product-grid" id="productGrid" aria-live="polite" ref={gridRef}>
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            isWishlisted={wishlist.includes(product.id)}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            onOpenModal={(id) => dispatch({ type: 'OPEN_PRODUCT_MODAL', payload: id })}
            onOrderWhatsApp={(id) => orderViaWhatsApp([{ id, qty: 1 }])}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && state.hydrated && (
        <div className="empty-state" id="emptyProducts">
          <span>✳</span>
          <h3>No pieces found just yet.</h3>
          <p>Try another search or category.</p>
          <button className="button button-outline" id="clearFilters" onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <div className="shop-bottom-note">
        <span className="note-rule" />
        <span>GOOD TASTE IS IN THE DETAILS</span>
        <span className="note-rule" />
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  isWishlisted: boolean;
  onAddToCart: (id: string) => boolean;
  onToggleWishlist: (id: string) => void;
  onOpenModal: (id: string) => void;
  onOrderWhatsApp: (id: string) => void;
}

function ProductCard({
  product,
  index,
  isWishlisted,
  onAddToCart,
  onToggleWishlist,
  onOpenModal,
  onOrderWhatsApp,
}: ProductCardProps) {
  const state = stockState(product);
  const badge = product.badge || (state === 'low' ? 'LOW STOCK' : '');

  const primaryImage = product.image || (product.images && product.images[0]?.url) || IMAGE_FALLBACK;
  const secondaryImage =
    product.images && product.images.length > 1
      ? product.images.find((img) => img.url !== primaryImage)?.url || product.images[1]?.url
      : null;

  return (
    <article
      className="product-card in-view"
      data-product-id={product.id}
      style={{ transitionDelay: `${(index % 4) * 0.05}s` }}
    >
      <div className="product-image-wrap">
        <img
          className="product-image primary-image"
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = IMAGE_FALLBACK;
          }}
        />
        {secondaryImage && (
          <img
            className="product-image secondary-image"
            src={secondaryImage}
            alt={`${product.name} lifestyle`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = IMAGE_FALLBACK;
            }}
          />
        )}
        {badge && (
          <span
            className={`product-badge${state === 'low' ? ' low' : ''}${state === 'out' ? ' sold' : ''}`}
          >
            {state === 'out' ? 'SOLD OUT' : badge}
          </span>
        )}
        <button
          className={`product-wish${isWishlisted ? ' saved' : ''}`}
          data-action="wishlist"
          data-id={product.id}
          aria-label={`${isWishlisted ? 'Remove' : 'Add'} ${product.name} ${isWishlisted ? 'from' : 'to'} wishlist`}
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist(product.id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.8 1.8Z"
              fill={isWishlisted ? 'currentColor' : 'none'}
            />
          </svg>
        </button>

        <div className="product-card-quick-actions">
          <button
            className="btn-card-quick-add"
            data-action="quick-add"
            data-id={product.id}
            disabled={state === 'out'}
            onClick={() => onAddToCart(product.id)}
          >
            {state === 'out' ? 'Unavailable' : 'Add to bag +'}
          </button>
          <button
            className="btn-card-quick-view"
            data-action="details"
            data-id={product.id}
            onClick={() => onOpenModal(product.id)}
            aria-label={`Quick view ${product.name}`}
          >
            Quick View
          </button>
        </div>
      </div>

      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <div className="product-name-row">
          <h3
            className="product-name"
            data-action="details"
            data-id={product.id}
            tabIndex={0}
            role="button"
            onClick={() => onOpenModal(product.id)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenModal(product.id)}
          >
            {product.name}
          </h3>
          <span className="product-price">
            {product.comparePrice > product.price && (
              <span className="product-old-price">{money(product.comparePrice)}</span>
            )}
            {money(product.price)}
          </span>
        </div>
        <div className="product-meta">
          <span className={`stock-label ${state}`}>
            <i className="stock-dot" />
            {stockLabel(product)}
          </span>
          <button
            className="quick-view-link"
            data-action="details"
            data-id={product.id}
            onClick={() => onOpenModal(product.id)}
          >
            Details ↗
          </button>
        </div>
        <button
          className="product-order-button"
          data-action="order-whatsapp"
          data-id={product.id}
          disabled={state === 'out'}
          aria-label={`Order ${product.name} through WhatsApp`}
          onClick={() => onOrderWhatsApp(product.id)}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.36-.51.08-1.17.11-3.37-.8-2.61-1.08-4.28-3.74-4.41-3.91-.13-.17-1.05-1.39-1.05-2.66s.66-1.89.9-2.14c.24-.25.52-.31.7-.31.18 0 .36 0 .52.01.17.01.4.06.61.57.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.32.39-.46.52-.15.15-.31.31-.13.62.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.46 1.52.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.78.84 2.09.99.31.15.52.23.6.36.08.13.08.76-.16 1.43z"/>
          </svg>
          <span className="order-button-label">Order via WhatsApp</span>
          <span className="order-button-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
