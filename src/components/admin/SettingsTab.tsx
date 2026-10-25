'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';

export default function SettingsTab() {
  const { state, saveSettings, toast } = useStore();

  const [whatsapp, setWhatsapp] = useState(state.settings.whatsappNumber || '');
  const [instagram, setInstagram] = useState(
    state.settings.instagramUsername || 'sassyclassy_rwanda'
  );
  const [email, setEmail] = useState(state.settings.businessEmail || '');
  const [fee, setFee] = useState(state.settings.deliveryFee?.toString() || '2000');
  const [threshold, setThreshold] = useState(
    state.settings.freeDeliveryThreshold?.toString() || '50000'
  );
  const [deliveryMessage, setDeliveryMessage] = useState(
    state.settings.deliveryMessage || ''
  );
  const [exchangePolicy, setExchangePolicy] = useState(
    state.settings.exchangePolicy || ''
  );
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setWhatsapp(state.settings.whatsappNumber || '');
    setInstagram(state.settings.instagramUsername || 'sassyclassy_rwanda');
    setEmail(state.settings.businessEmail || '');
    setFee(state.settings.deliveryFee?.toString() || '2000');
    setThreshold(state.settings.freeDeliveryThreshold?.toString() || '50000');
    setDeliveryMessage(state.settings.deliveryMessage || '');
    setExchangePolicy(state.settings.exchangePolicy || '');
  }, [state.settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numFee = Number(fee);
    const numThreshold = Number(threshold);

    if (
      !Number.isFinite(numFee) ||
      numFee < 0 ||
      !Number.isFinite(numThreshold) ||
      numThreshold < 0
    ) {
      toast('Delivery settings must be non-negative numbers.');
      return;
    }

    void saveSettings({
      ...state.settings,
      whatsappNumber: whatsapp.trim(),
      instagramUsername: instagram.trim().replace(/^@/, '') || 'sassyclassy_rwanda',
      businessEmail: email.trim(),
      deliveryFee: numFee,
      freeDeliveryThreshold: numThreshold,
      deliveryMessage: deliveryMessage.trim(),
      exchangePolicy: exchangePolicy.trim(),
    });

    setSavedMessage('Saved to MongoDB. These settings are shared with every device.');
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h2>Make it yours.</h2>
          <p>
            Keep your social ordering details and delivery information up to
            date.
          </p>
        </div>
      </div>

      <form id="adminSettingsForm" onSubmit={handleSubmit}>
        <div className="admin-settings-grid">
          <div className="admin-settings-card">
            <h3>Social ordering</h3>
            <p>These details are used for social order links on the storefront.</p>

            <label className="form-field">
              WhatsApp business number
              <input
                id="settingWhatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 2507XXXXXXXX"
              />
              <small>
                Include country code; digits only is best. Leave blank until
                confirmed.
              </small>
            </label>

            <label className="form-field">
              Instagram username
              <input
                id="settingInstagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="sassyclassy_rwanda"
              />
            </label>

            <label className="form-field">
              Business email (optional)
              <input
                id="settingEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
              />
            </label>
          </div>

          <div className="admin-settings-card">
            <h3>Delivery &amp; policies</h3>
            <p>Prices and delivery messages display throughout the store.</p>

            <label className="form-field">
              Standard delivery fee (RWF)
              <input
                id="settingDeliveryFee"
                type="number"
                min={0}
                step={1}
                required
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </label>

            <label className="form-field">
              Free delivery threshold (RWF)
              <input
                id="settingThreshold"
                type="number"
                min={0}
                step={1}
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </label>

            <label className="form-field">
              Delivery information
              <textarea
                id="settingDeliveryMessage"
                rows={3}
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
              />
            </label>

            <label className="form-field">
              Exchange policy
              <textarea
                id="settingExchangePolicy"
                rows={3}
                value={exchangePolicy}
                onChange={(e) => setExchangePolicy(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="admin-settings-card" style={{ marginTop: 16 }}>
          <h3>Store note</h3>
          <p>
            These settings are stored in your MongoDB database, so they apply to
            every device that opens the storefront. Keep your admin password and
            connection string private — the server verifies every admin action.
          </p>
          <button className="admin-btn" type="submit">
            Save store settings ↗
          </button>
          {savedMessage && (
            <p className="admin-inline-message" id="settingsSaveMessage">
              {savedMessage}
            </p>
          )}
        </div>
      </form>
    </>
  );
}
