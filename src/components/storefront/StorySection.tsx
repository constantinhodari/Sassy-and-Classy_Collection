export default function StorySection() {
  return (
    <section className="story-section section-shell section-padding" id="story">
      <div className="story-image-wrap">
        <img
          src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85"
          alt="Delicate gold accessories"
          loading="lazy"
        />
        <div className="story-image-note">
          <span>THE S&amp;C WAY</span>
          <strong>
            Intentional.
            <br />
            Effortless.
            <br />
            Always you.
          </strong>
        </div>
      </div>
      <div className="story-copy">
        <p className="eyebrow">A LITTLE ABOUT US</p>
        <h2>
          Accessories for <em>your kind</em>
          <br />
          of beautiful.
        </h2>
        <p>
          At Sassy &amp; Classy, we celebrate the power of the finishing touch. The earrings you
          reach for on a busy morning. The bracelet that makes an ordinary outfit feel special.
          The piece that feels unmistakably you.
        </p>
        <p>
          Consider us your little corner for everyday elegance, thoughtful details, and discovering
          your own signature style.
        </p>
        <a className="text-link" href="#contact">
          Come say hello <span>→</span>
        </a>
        <div className="story-ornament">
          S<span>&amp;</span>C
        </div>
      </div>
    </section>
  );
}
