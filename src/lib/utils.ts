import type { Product, StockState, StoreSettings, OrderSummary, CartLine } from '@/types';

// Inline SVG fallback (matches original IMAGE_FALLBACK reference to placeholder.svg)
export const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e8dfd1' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%23b0a090' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='18'%3ENo image%3C/text%3E%3C/svg%3E";

export const money = (value: number | string): string =>
  `RWF ${Math.round(Number(value) || 0).toLocaleString('en-US')}`;

export const stockState = (product: Product): StockState =>
  Number(product.stock) <= 0
    ? 'out'
    : Number(product.stock) <= Number(product.lowStock)
    ? 'low'
    : 'ok';

export const stockLabel = (product: Product): string => {
  const state = stockState(product);
  if (state === 'out') return 'Out of stock';
  if (state === 'low') return `${product.stock} left`;
  return 'In stock';
};

export const publicProducts = (products: Product[]): Product[] =>
  products.filter((p) => p.published !== false);

export const productById = (products: Product[], id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const cartCount = (cart: CartLine[]): number =>
  cart.reduce((sum, line) => sum + line.qty, 0);

export const cartSubtotal = (cart: CartLine[], products: Product[]): number =>
  cart.reduce((sum, line) => {
    const p = productById(products, line.id);
    return sum + (p ? Number(p.price) * line.qty : 0);
  }, 0);

export const cleanPhone = (phone: string): string => String(phone || '').replace(/\D/g, '');

export function makeOrderSummary(
  items: CartLine[],
  products: Product[],
  settings: StoreSettings
): OrderSummary {
  const records = items
    .map((item) => ({ product: productById(products, item.id), qty: Number(item.qty) }))
    .filter((item): item is { product: Product; qty: number } => !!item.product);
  const subtotal = records.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const fee = subtotal > Number(settings.freeDeliveryThreshold) ? 0 : Number(settings.deliveryFee);
  const lines = records.map(
    (item) =>
      `• ${item.product.name} [${item.product.sku}]\n  Qty: ${item.qty} × ${money(item.product.price)} = ${money(item.qty * item.product.price)}`
  );
  return {
    records,
    subtotal,
    fee,
    total: subtotal + fee,
    text: `Hello Sassy & Classy Collections!\n\nI'd love to order:\n${lines.join('\n')}\n\nItem subtotal: ${money(subtotal)}\nEstimated delivery: ${fee === 0 ? 'Complimentary' : money(fee)}\nEstimated total: ${money(subtotal + fee)}\n\nPlease confirm availability and delivery details. Thank you!`,
  };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.warn('Clipboard API failed', error);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  textarea.remove();
  return ok;
}

export async function compressImageFile(file: File): Promise<string> {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be 10 MB or smaller.');

  let source: ImageBitmap | HTMLImageElement;
  let width: number;
  let height: number;
  let cleanup = () => {};

  if ('createImageBitmap' in window) {
    source = await createImageBitmap(file);
    width = source.width;
    height = source.height;
    cleanup = () => (source as ImageBitmap).close?.();
  } else {
    const sourceURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read image.'));
      reader.readAsDataURL(file);
    });
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode image.'));
      img.src = sourceURL;
    });
    width = (source as HTMLImageElement).naturalWidth;
    height = (source as HTMLImageElement).naturalHeight;
  }

  const scale = Math.min(1, 1400 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cleanup();
    throw new Error('Image processing is not supported by this browser.');
  }
  ctx.fillStyle = '#f8f5ef';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  cleanup();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not resize this image. Try another file.');

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not prepare image data.'));
    reader.readAsDataURL(blob);
  });
}

export function filteredAndSortedProducts(
  products: Product[],
  activeFilter: string,
  activeSearch: string,
  sort: string
): Product[] {
  const query = activeSearch.trim().toLowerCase();
  let list = publicProducts(products).filter(
    (p) =>
      (activeFilter === 'All' || p.category === activeFilter) &&
      (!query ||
        [p.name, p.category, p.sku, p.description].some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(query)
        ))
  );
  if (sort === 'low-high') list.sort((a, b) => a.price - b.price);
  else if (sort === 'high-low') list.sort((a, b) => b.price - a.price);
  else if (sort === 'newest')
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  else list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  return list;
}
