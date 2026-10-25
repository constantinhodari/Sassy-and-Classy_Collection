'use client';

import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useFluidCursor, useMagneticButtons } from '@/hooks/useMotionEffects';
import AnnouncementBar from '@/components/storefront/AnnouncementBar';
import SiteHeader from '@/components/storefront/SiteHeader';
import SearchPanel from '@/components/storefront/SearchPanel';
import Hero from '@/components/storefront/Hero';
import HeroBenefits from '@/components/storefront/HeroBenefits';
import CategorySection from '@/components/storefront/CategorySection';
import ShopSection from '@/components/storefront/ShopSection';
import EditorialSection from '@/components/storefront/EditorialSection';
import StorySection from '@/components/storefront/StorySection';
import InstagramSection from '@/components/storefront/InstagramSection';
import NewsletterSection from '@/components/storefront/NewsletterSection';
import SiteFooter from '@/components/storefront/SiteFooter';
import CartDrawer from '@/components/storefront/CartDrawer';
import WishlistDrawer from '@/components/storefront/WishlistDrawer';
import ProductModal from '@/components/storefront/ProductModal';
import InfoModal from '@/components/storefront/InfoModal';
import ToastRegion from '@/components/storefront/ToastRegion';

export default function StorefrontPage() {
  const { state, dispatch } = useStore();
  const { reobserve } = useScrollReveal(state.hydrated);
  useFluidCursor();
  useMagneticButtons(state.hydrated && state.products.length);

  // Lock body scroll when any overlay is open
  useEffect(() => {
    const shouldLock =
      state.cartOpen ||
      state.wishlistOpen ||
      !!state.productModalId ||
      !!state.infoModal;
    document.body.classList.toggle('lock-scroll', shouldLock);
  }, [state.cartOpen, state.wishlistOpen, state.productModalId, state.infoModal]);

  // Close drawers on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.productModalId) {
          dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
        } else if (state.infoModal) {
          dispatch({ type: 'CLOSE_INFO_MODAL' });
        } else {
          dispatch({ type: 'CLOSE_CART' });
          dispatch({ type: 'CLOSE_WISHLIST' });
          dispatch({ type: 'CLOSE_SEARCH' });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.productModalId, state.infoModal, dispatch]);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <SearchPanel />
      <main>
        <Hero />
        <HeroBenefits />
        <CategorySection onFilterChange={reobserve} />
        <ShopSection onProductsRendered={reobserve} />
        <EditorialSection />
        <StorySection />
        <InstagramSection />
        <NewsletterSection />
      </main>
      <SiteFooter />

      {/* Overlays */}
      <CartDrawer />
      <WishlistDrawer />
      {state.productModalId && <ProductModal productId={state.productModalId} />}
      {state.infoModal && (
        <InfoModal title={state.infoModal.title} body={state.infoModal.body} />
      )}
      <ToastRegion />
    </>
  );
}
