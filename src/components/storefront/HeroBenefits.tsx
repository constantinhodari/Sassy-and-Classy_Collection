'use client';

import { useStore } from '@/context/StoreContext';
import { money } from '@/lib/utils';

export default function HeroBenefits() {
  const { state } = useStore();
  const fee = Number(state.settings.deliveryFee ?? 2000);
  const threshold = Number(state.settings.freeDeliveryThreshold ?? 50000);

  return (
    <section className="hero-benefits section-shell" aria-label="Shopping benefits">
      {/* Fast Delivery */}
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16,8 20,8 23,11 23,16 16,16" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </span>
        <div>
          <strong>Fast Delivery</strong>
          <small>Quick delivery across Kigali and nationwide.</small>
        </div>
      </div>

      {/* Premium Quality */}
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
        <div>
          <strong>Premium Quality</strong>
          <small>We guarantee the quality of all our products.</small>
        </div>
      </div>

      {/* Secure Payments */}
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </span>
        <div>
          <strong>Secure Payments</strong>
          <small>Pay safely via Mobile Money or Bank Transfer.</small>
        </div>
      </div>

      {/* 24/7 Support */}
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </span>
        <div>
          <strong>24/7 Support</strong>
          <small>Our customer service is always here to help you.</small>
        </div>
      </div>
    </section>
  );
}
