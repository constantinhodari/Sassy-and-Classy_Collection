'use client';

import { useStore } from '@/context/StoreContext';

export default function InstagramSection() {
  const { state } = useStore();
  const username =
    String(state.settings.instagramUsername || 'sassyclassy_rwanda')
      .replace(/^@/, '')
      .trim() || 'sassyclassy_rwanda';
  const instagramUrl = `https://www.instagram.com/${encodeURIComponent(username)}/`;

  return (
    <section className="instagram-section section-shell section-padding" id="contact">
      <div className="instagram-heading">
        <p className="eyebrow">A LITTLE MORE SASS, A LITTLE MORE CLASS</p>
        <h2>
          Meet us on <em>Instagram.</em>
        </h2>
        <a
          className="text-link"
          id="instagramFollowLink"
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{username} <span>↗</span>
        </a>
      </div>
      <div className="instagram-grid">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Sassy and Classy on Instagram"
        >
          <img
            src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=85"
            alt="Jewelry style inspiration"
            loading="lazy"
          />
          <span>↗</span>
        </a>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Sassy and Classy on Instagram"
        >
          <img
            src="https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=700&q=85"
            alt="Sunglasses style inspiration"
            loading="lazy"
          />
          <span>↗</span>
        </a>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Sassy and Classy on Instagram"
        >
          <img
            src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=700&q=85"
            alt="Ring style inspiration"
            loading="lazy"
          />
          <span>↗</span>
        </a>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Sassy and Classy on Instagram"
        >
          <img
            src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=700&q=85"
            alt="Bracelet style inspiration"
            loading="lazy"
          />
          <span>↗</span>
        </a>
      </div>
    </section>
  );
}
