'use client';

import { useStore } from '@/context/StoreContext';

interface InfoModalProps {
  title: string;
  body: string;
}

export default function InfoModal({ title, body }: InfoModalProps) {
  const { dispatch } = useStore();

  const handleClose = () => {
    dispatch({ type: 'CLOSE_INFO_MODAL' });
  };

  return (
    <div
      className="modal-backdrop"
      id="productModalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          id="productModalClose"
          onClick={handleClose}
          aria-label="Close information"
        >
          ✕
        </button>
        <div
          className="info-modal-content"
          style={{ padding: '55px clamp(22px, 6vw, 60px)', maxWidth: 700 }}
        >
          <p className="eyebrow">SASSY &amp; CLASSY COLLECTIONS</p>
          <h2 style={{ fontSize: 'clamp(34px, 5vw, 49px)', marginBottom: 20 }}>
            {title}
          </h2>
          <p style={{ fontSize: 12, lineHeight: 2, color: 'var(--muted)' }}>
            {body}
          </p>
          <button
            className="button button-dark"
            id="infoCloseButton"
            onClick={handleClose}
          >
            Close <span>×</span>
          </button>
        </div>
      </section>
    </div>
  );
}
