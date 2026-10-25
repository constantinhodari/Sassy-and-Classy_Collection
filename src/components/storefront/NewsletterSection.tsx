'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';

export default function NewsletterSection() {
  const { newsletterSignup } = useStore();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    newsletterSignup(email.trim());
    setEmail('');
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-inner">
        <p className="eyebrow">LOVE A GOOD LITTLE FIND?</p>
        <h2>
          Stay in the <em>know.</em>
        </h2>
        <p>New arrivals, style notes, and little things worth opening your inbox for.</p>
        <form id="newsletterForm" className="newsletter-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="newsletterEmail">
            Your email address
          </label>
          <input
            id="newsletterEmail"
            type="email"
            placeholder="Your email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" aria-label="Subscribe to newsletter">
            Join the list <span>→</span>
          </button>
        </form>
        <small className="newsletter-disclaimer">
          Just the lovely things. Unsubscribe whenever you like.
        </small>
      </div>
      <span className="newsletter-flower flower-left">✳</span>
      <span className="newsletter-flower flower-right">✳</span>
    </section>
  );
}
