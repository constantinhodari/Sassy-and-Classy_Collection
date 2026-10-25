import type { Product, ProductImage } from '@/types';
import { slugify } from '@/lib/slug';

export const STORAGE = {
  products: 'sc_products_v1',
  cart: 'sc_cart_v1',
  wishlist: 'sc_wishlist_v1',
  settings: 'sc_settings_v1',
  orders: 'sc_orders_v1',
  movements: 'sc_movements_v1',
  newsletter: 'sc_newsletter_demo_v1',
} as const;

type StarterSeed = Omit<Product, 'slug' | 'images'>;

const STARTER_SEED: StarterSeed[] = [
  {
    id: 'sc-ear-001',
    sku: 'SC-EAR-001',
    name: 'Solstice Gold Hoops',
    category: 'Earrings',
    price: 8500,
    comparePrice: 0,
    stock: 12,
    lowStock: 3,
    description:
      'Your everyday golden hour. These sculptural hoops bring a soft, confident glow to everything from a simple tee to your favourite occasion look.',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
    featured: true,
    published: true,
    createdAt: '2026-08-01T10:00:00.000Z',
    badge: 'BEST LOVED',
  },
  {
    id: 'sc-neck-001',
    sku: 'SC-NEC-001',
    name: 'The Golden Hour Chain',
    category: 'Necklaces',
    price: 12500,
    comparePrice: 0,
    stock: 7,
    lowStock: 3,
    description:
      'A fine, versatile chain with just the right amount of light-catching detail. Lovely worn alone or layered with your other favourites.',
    image:
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
    featured: true,
    published: true,
    createdAt: '2026-08-05T10:00:00.000Z',
    badge: 'SIGNATURE',
  },
  {
    id: 'sc-ring-001',
    sku: 'SC-RNG-001',
    name: 'Muse Statement Ring',
    category: 'Rings',
    price: 9500,
    comparePrice: 11000,
    stock: 5,
    lowStock: 2,
    description:
      'A bold little finishing touch with a sculptural silhouette. Made for stacking, styling, and being noticed.',
    image:
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85',
    featured: true,
    published: true,
    createdAt: '2026-08-10T10:00:00.000Z',
    badge: 'LITTLE LUXURY',
  },
  {
    id: 'sc-brc-001',
    sku: 'SC-BRC-001',
    name: 'Soleil Bracelet',
    category: 'Bracelets',
    price: 11000,
    comparePrice: 0,
    stock: 9,
    lowStock: 3,
    description:
      'A delicate bracelet with a warm golden finish. Wear it solo for a whisper of shine or stack it for your own signature look.',
    image:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
    featured: true,
    published: true,
    createdAt: '2026-08-11T10:00:00.000Z',
    badge: '',
  },
  {
    id: 'sc-sun-001',
    sku: 'SC-SUN-001',
    name: 'The Sunday Sunglasses',
    category: 'Sunglasses',
    price: 15000,
    comparePrice: 0,
    stock: 6,
    lowStock: 2,
    description:
      'An effortlessly confident frame for slow mornings, sunny afternoons, and every little escape in between.',
    image:
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=900&q=85',
    featured: true,
    published: true,
    createdAt: '2026-08-13T10:00:00.000Z',
    badge: 'NEW EDIT',
  },
  {
    id: 'sc-pin-001',
    sku: 'SC-PIN-001',
    name: 'Petite Bloom Pin',
    category: 'Pins',
    price: 6500,
    comparePrice: 0,
    stock: 14,
    lowStock: 4,
    description:
      'A tiny bloom with a big personality. Add this playful detail to a blazer, scarf, bag, or your favourite knit.',
    image:
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=900&q=85',
    featured: false,
    published: true,
    createdAt: '2026-08-15T10:00:00.000Z',
    badge: '',
  },
  {
    id: 'sc-ear-002',
    sku: 'SC-EAR-002',
    name: 'Pearl Muse Drops',
    category: 'Earrings',
    price: 10000,
    comparePrice: 0,
    stock: 4,
    lowStock: 3,
    description:
      'Soft, luminous, and endlessly wearable. These pearl-inspired drops add a graceful note to daytime dressing and evenings out.',
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
    featured: true,
    published: true,
    createdAt: '2026-08-18T10:00:00.000Z',
    badge: 'LOW STOCK',
  },
  {
    id: 'sc-neck-002',
    sku: 'SC-NEC-002',
    name: 'Layered Love Necklace',
    category: 'Necklaces',
    price: 14500,
    comparePrice: 0,
    stock: 8,
    lowStock: 3,
    description:
      'The look of a thoughtfully layered stack, without the guesswork. Easy, polished, and ready for repeat wear.',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85',
    featured: false,
    published: true,
    createdAt: '2026-08-20T10:00:00.000Z',
    badge: '',
  },
  {
    id: 'sc-ring-002',
    sku: 'SC-RNG-002',
    name: 'Little Orbit Ring',
    category: 'Rings',
    price: 7500,
    comparePrice: 0,
    stock: 0,
    lowStock: 2,
    description:
      'A delicate statement with a modern, playful shape. A sweet addition to your everyday jewellery story.',
    image:
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
    featured: false,
    published: true,
    createdAt: '2026-08-22T10:00:00.000Z',
    badge: '',
  },
  {
    id: 'sc-brc-002',
    sku: 'SC-BRC-002',
    name: 'Golden Thread Cuff',
    category: 'Bracelets',
    price: 13000,
    comparePrice: 0,
    stock: 2,
    lowStock: 3,
    description:
      'A clean cuff with sculptural simplicity. Made to complement your watch, stack with bangles, or stand beautifully on its own.',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
    featured: false,
    published: true,
    createdAt: '2026-08-25T10:00:00.000Z',
    badge: '',
  },
  {
    id: 'sc-sun-002',
    sku: 'SC-SUN-002',
    name: 'Soft Focus Frames',
    category: 'Sunglasses',
    price: 18000,
    comparePrice: 0,
    stock: 3,
    lowStock: 2,
    description:
      'A modern frame with vintage attitude. An easy finishing touch for bright days and confident entrances.',
    image:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85',
    featured: false,
    published: true,
    createdAt: '2026-08-27T10:00:00.000Z',
    badge: '',
  },
  {
    id: 'sc-pin-002',
    sku: 'SC-PIN-002',
    name: 'Golden Petal Brooch',
    category: 'Pins',
    price: 7000,
    comparePrice: 0,
    stock: 10,
    lowStock: 3,
    description:
      'A small, sculptural accent for collars, bags, and scarves. The tiny detail that makes the whole look feel considered.',
    image:
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=900&q=85',
    featured: false,
    published: true,
    createdAt: '2026-08-28T10:00:00.000Z',
    badge: '',
  },
];

export function starterImages(seed: { image: string; name: string }): ProductImage[] {
  return seed.image ? [{ source: 'url', url: seed.image, alt: seed.name }] : [];
}

/**
 * Starter catalogue used to seed a brand-new MongoDB database so the storefront
 * is never empty on first run. These point at the original externally hosted
 * images; nothing is downloaded or copied into GridFS.
 */
export const STARTER_PRODUCTS: Product[] = STARTER_SEED.map((seed) => ({
  ...seed,
  slug: slugify(seed.name),
  images: starterImages(seed),
}));

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}`, error);
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key}`, error);
    return false;
  }
}
