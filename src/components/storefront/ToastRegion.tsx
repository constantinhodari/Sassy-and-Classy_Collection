'use client';

import { useStore } from '@/context/StoreContext';

export default function ToastRegion() {
  const { state } = useStore();

  return (
    <div
      className="toast-region"
      id="toastRegion"
      aria-live="polite"
      aria-atomic="true"
    >
      {state.toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
