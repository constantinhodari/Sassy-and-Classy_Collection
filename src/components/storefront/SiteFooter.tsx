'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { cleanPhone } from '@/lib/utils';

export default function SiteFooter() {
  const { state, dispatch, toast } = useStore();
  const username =
    String(state.settings.instagramUsername || 'sassyclassy_rwanda')
      .replace(/^@/, '')
      .trim() || 'sassyclassy_rwanda';
  const instagramUrl = `https://www.instagram.com/${encodeURIComponent(username)}/`;

  const handlePolicy = (which: 'Shipping' | 'Returns' | 'Care' | 'Privacy') => {
    let title = '';
    let body = '';
    if (which === 'Shipping') {
      title = 'Shipping & delivery';
      body =
        state.settings.deliveryMessage ||
        'Standard delivery is RWF 2,000. Enjoy complimentary delivery on orders above RWF 50,000.';
    } else if (which === 'Returns') {
      title = 'Returns & exchanges';
      body =
        state.settings.exchangePolicy ||
        'Please contact us through WhatsApp or Instagram to discuss an exchange. Exchange arrangements are subject to store confirmation.';
    } else if (which === 'Care') {
      title = 'Product care';
      body =
        'Keep accessories dry when possible, store them separately to reduce scratches, and wipe gently with a soft cloth. For material-specific care, ask us before using cleaning products.';
    } else {
      title = 'Privacy note';
      body =
        'We only use information you share to respond to enquiries and coordinate your requested order in this demo. This static site does not send data to a store database.';
    }
    dispatch({ type: 'OPEN_INFO_MODAL', payload: { title, body } });
  };

  const handleWhatsApp = () => {
    const phone = cleanPhone(state.settings.whatsappNumber);
    if (!phone) {
      toast('Add your WhatsApp business number in the admin page → Store settings first.');
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        'Hello Sassy & Classy Collections! I have a question about your accessories.'
      )}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const [year, setYear] = useState<number | string>('2026');
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-main section-shell">
        <div className="footer-brand-column">
          <a className="brand footer-brand" href="#top">
            <img
              src="/images/brand-logo.jpg"
              alt="Sassy & Classy Collections Logo"
              className="brand-logo-img footer-brand-logo"
              width={54}
              height={54}
            />
            <span className="brand-copy">
              <span className="brand-name">
                SASSY <i>&amp;</i> CLASSY
              </span>
              <span className="brand-subtitle">C O L L E C T I O N S</span>
            </span>
          </a>
          <p>
            Your style. Your statement.
            <br />A little luxury in every detail.
          </p>
          <a
            className="footer-social"
            id="footerInstagram"
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram ↗
          </a>
        </div>
        <div className="footer-link-column">
          <strong>EXPLORE</strong>
          <a href="#shop">Shop all</a>
          <a href="#categories">Collections</a>
          <a href="#story">Our story</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-link-column">
          <strong>SHOPPING NOTES</strong>
          <a
            href="#footerPolicies"
            onClick={(e) => {
              e.preventDefault();
              handlePolicy('Shipping');
            }}
          >
            Shipping &amp; delivery
          </a>
          <a
            href="#footerPolicies"
            onClick={(e) => {
              e.preventDefault();
              handlePolicy('Returns');
            }}
          >
            Returns &amp; exchanges
          </a>
          <a
            href="#footerPolicies"
            onClick={(e) => {
              e.preventDefault();
              handlePolicy('Care');
            }}
          >
            Product care
          </a>
          <a
            href="#footerPolicies"
            onClick={(e) => {
              e.preventDefault();
              handlePolicy('Privacy');
            }}
          >
            Privacy note
          </a>
        </div>
        <div className="footer-contact-column">
          <strong>LET&apos;S TALK</strong>
          <p>
            Questions about a piece?
            <br />
            We&apos;d love to help.
          </p>
          <button className="text-link footer-whatsapp" id="footerWhatsApp" onClick={handleWhatsApp}>
            Chat on WhatsApp <span>↗</span>
          </button>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            DM us on Instagram ↗
          </a>
          <span className="footer-location">KIGALI, RWANDA</span>
        </div>
      </div>
      <div className="footer-bottom section-shell">
        <span>© {year} Sassy &amp; Classy Collections</span>
        <span>
          MADE FOR YOUR MOMENTS <i>✳</i>
        </span>
      </div>
    </footer>
  );
}
