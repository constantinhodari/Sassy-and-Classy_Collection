/** An image whose bytes live in MongoDB GridFS. */
export interface UploadedProductImage {
  source: 'upload';
  /** GridFS file id (a MongoDB ObjectId hex string). */
  fileId: string;
  /** Application endpoint used to render the image, e.g. `/api/images/<fileId>`. */
  url: string;
  alt: string;
}

/** An image hosted somewhere else; we only ever store the URL. */
export interface ExternalProductImage {
  source: 'url';
  url: string;
  alt: string;
}

export type ProductImage = UploadedProductImage | ExternalProductImage;

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  comparePrice: number;
  stock: number;
  lowStock: number;
  description: string;
  /** Primary image src — an `/api/images/<id>` endpoint or an external URL. */
  image: string;
  /** Full ordered gallery. The first entry is the primary image. */
  images: ProductImage[];
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  badge: string;
}

/** Payload accepted by the product create/update endpoints. */
export interface ProductInput {
  id?: string;
  sku: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  comparePrice?: number;
  stock: number;
  lowStock?: number;
  description?: string;
  images?: Array<{
    source?: 'upload' | 'url';
    fileId?: string;
    url?: string;
    alt?: string;
  }>;
  featured?: boolean;
  published?: boolean;
  badge?: string;
}

export interface CartLine {
  id: string;
  qty: number;
}

export interface WishlistItem {
  id: string;
}

export interface StoreSettings {
  whatsappNumber: string;
  instagramUsername: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  deliveryMessage: string;
  exchangePolicy: string;
  businessEmail: string;
  businessHours: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  price: number;
}

export type OrderStatus =
  | 'Pending Confirmation'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready for Delivery'
  | 'Completed'
  | 'Cancelled';

export interface SocialOrder {
  id: string;
  customer: string;
  channel: 'WhatsApp' | 'Instagram';
  contact: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  stockAdjusted: boolean;
  stockRestored?: boolean;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  previousQty: number;
  change: number;
  newQty: number;
  reason: string;
  note: string;
  actor: string;
  timestamp: string;
}

export type StockState = 'ok' | 'low' | 'out';

export type AdminTab = 'overview' | 'products' | 'inventory' | 'orders' | 'settings';

export interface Toast {
  id: string;
  message: string;
}

export interface OrderSummary {
  records: Array<{ product: Product; qty: number }>;
  subtotal: number;
  fee: number;
  total: number;
  text: string;
}
