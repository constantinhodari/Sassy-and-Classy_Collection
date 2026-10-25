'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { cartCount } from '@/lib/utils';

export default function SiteHeader() {
  const { state, dispatch } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const count = cartCount(state.cart);
  const wishCount = state.wishlist.length;

  const toggleMobile = () => setMobileOpen((v) => !v);
  const [activeNav, setActiveNav] = useState('#top');
  const closeMenu = () => setMobileOpen(false);

  // Close the mobile navigation on Escape (mirrors the original keydown handler)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleNavScroll = (href: string) => (e: React.MouseEvent) => {
    closeMenu();
    setActiveNav(href);
    const id = href.replace('#', '');
    if (id && id !== 'top') {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.hash = href;
    }
  };

  return (
    <header className="site-header" id="top">
      <button
        className="mobile-menu-button icon-button"
        id="mobileMenuToggle"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        onClick={toggleMobile}
      >
        <span className="hamburger" />
      </button>

      <a className="brand" href="#top" aria-label="Sassy and Classy home" onClick={handleNavScroll('#top')}>
        <span className="brand-mark" aria-hidden="true">✿</span>
        <span className="brand-copy">
          <span className="brand-name">
            SASSY <i>&amp;</i> CLASSY
          </span>
          <span className="brand-subtitle">COLLECTIONS</span>
        </span>
      </a>

      <nav className={`main-nav${mobileOpen ? ' open' : ''}`} id="mainNav" aria-label="Main navigation">
        <a className={`nav-link${activeNav === '#top' ? ' active' : ''}`} href="#top" onClick={handleNavScroll('#top')}>Home</a>
        <a className={`nav-link${activeNav === '#shop' ? ' active' : ''}`} href="#shop" onClick={handleNavScroll('#shop')}>Shop</a>
        <a className={`nav-link${activeNav === '#categories' ? ' active' : ''}`} href="#categories" onClick={handleNavScroll('#categories')}>Collections</a>
        <a className={`nav-link${activeNav === '#story' ? ' active' : ''}`} href="#story" onClick={handleNavScroll('#story')}>Our Story</a>
        <a className={`nav-link${activeNav === '#contact' ? ' active' : ''}`} href="#contact" onClick={handleNavScroll('#contact')}>Contact</a>
      </nav>

      <div className="header-actions">
        <button
          className="icon-button search-toggle"
          id="searchToggle"
          aria-label="Search products"
          onClick={() => dispatch({ type: 'OPEN_SEARCH' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
        </button>

        <button
          className="icon-button wishlist-toggle"
          id="wishlistToggle"
          aria-label="View wishlist"
          onClick={() => dispatch({ type: 'OPEN_WISHLIST' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.8 1.8Z" />
          </svg>
          <span className="count-badge" id="wishlistCount">{wishCount}</span>
        </button>

        <button
          className="icon-button cart-toggle"
          id="cartToggle"
          aria-label="Open shopping bag"
          onClick={() => dispatch({ type: 'OPEN_CART' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5.5 8.5h13l1 12h-15l1-12Z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
          </svg>
          <span className="count-badge" id="cartCount">{count}</span>
        </button>
      </div>
    </header>
  );
}
