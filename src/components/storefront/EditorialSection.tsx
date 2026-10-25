export default function EditorialSection() {
  return (
    <section className="editorial-section section-shell">
      <div className="editorial-image">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=88"
          alt="A beautiful close-up of a curated jewelry arrangement"
          loading="lazy"
        />
        <span className="editorial-image-label">THE LITTLE LUXURIES</span>
      </div>
      <div className="editorial-copy">
        <p className="eyebrow">A NOTE ON STYLE</p>
        <h2>
          Because the <em>details</em>
          <br />
          are never small.
        </h2>
        <p>
          Some days call for a whisper. Others call for a little extra sparkle. We believe your
          accessories should feel like you — only more so.
        </p>
        <a className="button button-light" href="#shop">
          Find your piece <span className="button-arrow">↗</span>
        </a>
        <span className="editorial-signature">
          Sassy &amp; Classy <i>♡</i>
        </span>
      </div>
      <span className="editorial-side-note">DRESS LIKE YOU MEAN IT — EVERY DAY</span>
    </section>
  );
}
