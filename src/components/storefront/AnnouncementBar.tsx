'use client';

import { useStore } from '@/context/StoreContext';

export default function AnnouncementBar() {
  const { state } = useStore();
  const threshold = Number(state.settings.freeDeliveryThreshold);
  const text =
    threshold === 0
      ? 'Complimentary delivery on all orders'
      : `Free delivery on orders above RWF ${Math.round(threshold).toLocaleString('en-US')}`;

  return (
    <div className="announcement-bar">
      <span>YOUR STYLE, YOUR STATEMENT</span>
      <span className="announcement-separator">✦</span>
      <span>{text}</span>
    </div>
  );
}
