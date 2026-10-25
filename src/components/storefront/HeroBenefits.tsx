'use client';

import { useStore } from '@/context/StoreContext';
import { money } from '@/lib/utils';

export default function HeroBenefits() {
  const { state } = useStore();
  const fee = Number(state.settings.deliveryFee ?? 2000);
  const threshold = Number(state.settings.freeDeliveryThreshold ?? 50000);

  return (
    <section className="hero-benefits section-shell" aria-label="Shopping benefits">
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">✧</span>
        <div>
          <strong>Premium Details</strong>
          <small>Accessories chosen with care</small>
        </div>
      </div>
      <span className="hero-benefit-divider" aria-hidden="true" />
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">↗</span>
        <div>
          <strong>Easy Ordering</strong>
          <small>Shop through WhatsApp or Instagram</small>
        </div>
      </div>
      <span className="hero-benefit-divider" aria-hidden="true" />
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">♡</span>
        <div>
          <strong>Delivery Available</strong>
          <small>Standard delivery {money(fee)}</small>
        </div>
      </div>
      <span className="hero-benefit-divider" aria-hidden="true" />
      <div className="hero-benefit">
        <span className="hero-benefit-icon" aria-hidden="true">✿</span>
        <div>
          <strong>Free Delivery</strong>
          <small>
            {threshold === 0
              ? 'Complimentary delivery on all orders'
              : `On orders above ${money(threshold)}`}
          </small>
        </div>
      </div>
    </section>
  );
}
