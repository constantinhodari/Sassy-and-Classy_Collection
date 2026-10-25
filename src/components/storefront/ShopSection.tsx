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

  return (
    <article
      className="product-card"
      data-product-id={product.id}
      style={{ transitionDelay: `${(index % 4) * 0.07}s` }}
    >
      <div className="product-image-wrap">
        <img
          className="product-image"
          src={product.image || IMAGE_FALLBACK}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = IMAGE_FALLBACK;
          }}
        />
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
        <button
          className="product-quick-add"
          data-action="quick-add"
          data-id={product.id}
          disabled={state === 'out'}
          onClick={() => onAddToCart(product.id)}
        >
          {state === 'out' ? 'Currently unavailable' : 'Add to bag +'}
        </button>
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
            Quick view
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
          <span className="order-button-label">Order via WhatsApp</span>
          <span className="order-button-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
