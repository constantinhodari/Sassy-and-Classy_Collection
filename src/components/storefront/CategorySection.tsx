'use client';

import { useStore } from '@/context/StoreContext';

const CATEGORIES = [
  {
    name: 'Earrings',
    number: '01 / 06',
    tagline: 'Find your sparkle ↗',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85',
    alt: 'Gold earrings collection',
    large: true,
  },
  {
    name: 'Necklaces',
    number: '02 / 06',
    tagline: 'Layered with love ↗',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
    alt: 'Necklace collection',
  },
  {
    name: 'Rings',
    number: '03 / 06',
    tagline: 'Made to be noticed ↗',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85',
    alt: 'Ring collection',
  },
  {
    name: 'Bracelets',
    number: '04 / 06',
    tagline: 'A little wrist story ↗',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
    alt: 'Bracelet collection',
  },
  {
    name: 'Sunglasses',
    number: '05 / 06',
    tagline: 'See things differently ↗',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=900&q=85',
    alt: 'Sunglasses collection',
  },
  {
    name: 'Pins',
    number: '06 / 06',
    tagline: 'The final flourish ↗',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=900&q=85',
    alt: 'Fashion accessories collection',
    label: 'Pins & details',
  },
] as const;

interface Props {
  onFilterChange?: () => void;
}

export default function CategorySection({ onFilterChange }: Props) {
  const { dispatch } = useStore();

  const handleCategoryClick = (name: string) => {
    dispatch({ type: 'SET_FILTER', payload: name });
    onFilterChange?.();
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="category-section section-shell section-padding" id="categories">
      <div className="section-heading heading-split category-heading-reference">
        <div>
          <h2>Shop by Category</h2>
        </div>
        <a href="#categories" className="text-link category-view-all">
          View All Categories <span>→</span>
        </a>
      </div>
      <div className="category-grid" id="categoryGrid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            className={`category-card${'large' in cat && cat.large ? ' category-large' : ''}`}
            data-category={cat.name}
            onClick={() => handleCategoryClick(cat.name)}
          >
            <img src={cat.image} alt={cat.alt} loading="lazy" />
            <span className="category-number">{cat.number}</span>
            <span className="category-copy">
              <span>{'label' in cat ? cat.label : cat.name}</span>
              <small>{cat.tagline}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
