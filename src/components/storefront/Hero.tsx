export default function Hero() {
  return (
    <section className="hero hero-reference section-shell" aria-labelledby="heroTitle">
      <div className="hero-copy">
        <p className="hero-collection-label">
          <span className="collection-flower" aria-hidden="true">✿</span> NEW COLLECTION
        </p>
        <h1 id="heroTitle">
          Stylish Looks.<br />Everyday <em>You.</em>
        </h1>
        <p className="hero-description">
          Trendy styles, premium quality &amp; unmatched comfort. Discover the little details that
          make every look feel like you.
        </p>
        <div className="hero-actions">
          <a className="button button-coral" href="#shop">
            Shop Now <span className="button-arrow">→</span>
          </a>
          <a className="button button-outline hero-explore" href="#categories">
            Explore Collections
          </a>
        </div>
        <div className="hero-style-proof">
          <div className="proof-product-stack" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=120&q=80"
              alt=""
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=120&q=80"
              alt=""
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=120&q=80"
              alt=""
              loading="lazy"
            />
          </div>
          <div className="proof-copy">
            <strong>Little details. Big confidence.</strong>
            <span>Pieces chosen to finish your look.</span>
          </div>
        </div>
      </div>

      <div
        className="hero-art hero-art-reference"
        aria-label="Fashion campaign featuring a woman in coral styling and sunglasses"
      >
        <div className="hero-art-halo" aria-hidden="true" />
        <img
          className="hero-reference-model"
          src="/images/homepage-model-reference.jpg"
          alt="Fashion model wearing round sunglasses and coral styling against a coral editorial backdrop"
          fetchPriority="high"
        />
        <div className="hero-art-spark hero-art-spark-one" aria-hidden="true">✳</div>
        <div className="hero-art-spark hero-art-spark-two" aria-hidden="true">✦</div>
        <div className="hero-art-caption hero-art-caption-top">
          THE ACCESSORY<br />EDIT
        </div>
        <div className="hero-floating-product hero-floating-earrings">
          <img
            src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=360&q=85"
            alt="Gold earrings"
            loading="eager"
          />
          <span>EVERYDAY HOOPS</span>
        </div>
        <div className="hero-floating-product hero-floating-sunglasses">
          <img
            src="https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=360&q=85"
            alt="Fashion sunglasses"
            loading="eager"
          />
          <span>THE SUN EDIT</span>
        </div>
        <div className="hero-image-note">
          <span>CURATED WITH CARE</span>
          <strong>Your finishing touch.</strong>
        </div>
      </div>

      <a className="scroll-cue" href="#categories">
        <span className="scroll-cue-line" /> SCROLL TO DISCOVER
      </a>
    </section>
  );
}
