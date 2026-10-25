'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { publicProducts, money } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export default function OrderFormModal({ onClose }: Props) {
  const { state, recordOrder, toast } = useStore();
  const availableProducts = publicProducts(state.products);

  const [customer, setCustomer] = useState('');
  const [channel, setChannel] = useState<'WhatsApp' | 'Instagram'>('WhatsApp');
  const [productId, setProductId] = useState(availableProducts[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!customer.trim()) {
      toast('Customer name is required.');
      return;
    }
    if (!productId) {
      toast('Select a product.');
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      toast('Enter a valid quantity.');
      return;
    }

    const product = availableProducts.find((p) => p.id === productId);
    if (!product) {
      toast('Selected product not found.');
      return;
    }

    const subtotal = product.price * qty;
    const threshold = Number(state.settings.freeDeliveryThreshold);
    const fee = subtotal > threshold ? 0 : Number(state.settings.deliveryFee);

    const order = {
      id: `SC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
      customer: customer.trim(),
      channel,
      contact: contact.trim(),
      notes: notes.trim(),
      items: [
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          qty,
          price: product.price,
        },
      ],
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
      status: 'Pending Confirmation' as const,
      stockAdjusted: false,
      createdAt: new Date().toISOString(),
    };

    recordOrder(order);
    onClose();
  };

  return (
    <div
      className="modal-backdrop admin-form-backdrop"
      id="adminOrderModalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="admin-form-modal compact-admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adminOrderModalTitle"
      >
        <div className="admin-form-heading">
          <div>
            <p className="eyebrow">ORDER DESK</p>
            <h2 id="adminOrderModalTitle">Record a social order</h2>
          </div>
          <button
            className="icon-button"
            id="adminOrderModalClose"
            onClick={onClose}
            aria-label="Close order form"
          >
            ✕
          </button>
        </div>

        <form id="adminOrderForm" className="admin-product-form" onSubmit={handleSubmit}>
          <label className="form-field">
            Customer name
            <input
              id="orderCustomer"
              required
              placeholder="Customer name"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </label>

          <label className="form-field">
            Order channel
            <select
              id="orderChannel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as 'WhatsApp' | 'Instagram')}
            >
              <option>WhatsApp</option>
              <option>Instagram</option>
            </select>
          </label>

          <label className="form-field">
            Product
            <select
              id="orderProductSelect"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {availableProducts.length === 0 ? (
                <option value="">No published products available</option>
              ) : (
                availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {money(p.price)} (stock: {p.stock})
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="form-field">
            Quantity
            <input
              id="orderQuantity"
              type="number"
              min={1}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          <label className="form-field">
            Customer contact (optional)
            <input
              id="orderContact"
              placeholder="Phone or Instagram handle"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </label>

          <label className="form-field">
            Notes (optional)
            <textarea
              id="orderNotes"
              rows={2}
              placeholder="Variant, delivery notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <p className="form-help">
            The order starts as Pending. Stock is checked and adjusted only when you confirm
            it.
          </p>

          <div className="admin-form-actions">
            <button
              className="button button-outline"
              type="button"
              id="cancelOrderForm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-dark" type="submit">
              Save order
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
