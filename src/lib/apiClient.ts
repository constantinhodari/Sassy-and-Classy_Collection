import type {
  OrderStatus,
  Product,
  ProductImage,
  SocialOrder,
  StockMovement,
  StoreSettings,
} from '@/types';

/** Thin typed client for the Sassy & Classy API routes. */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(init.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload: Record<string, unknown> = {};
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      payload = { error: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      String(payload.error || `Request failed (${response.status}).`),
      response.status,
      typeof payload.code === 'string' ? payload.code : undefined
    );
  }
  return payload as T;
}

export interface AdminSessionInfo {
  authenticated: boolean;
  adminAuthConfigured: boolean;
  mongoConfigured: boolean;
  mongoConnected: boolean;
  database: string | null;
  maxImageUploadMb: number;
  allowInsecureImageUrls: boolean;
}

export interface MigrationReport {
  starterSeeded: number;
  productsInserted: number;
  productsSkipped: number;
  productsNeedingImage: number;
  ordersInserted: number;
  movementsInserted: number;
  settingsImported: boolean;
}

export interface MigrationResponse {
  report: MigrationReport;
  clientReport: MigrationReport | null;
}

export const api = {
  // ── Products ──────────────────────────────────────────────────────────
  listProducts(scope: 'public' | 'all' = 'public') {
    const query = scope === 'all' ? '?scope=all' : '';
    return request<{ products: Product[] }>(`/api/products${query}`);
  },
  createProduct(input: Record<string, unknown>) {
    return request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateProduct(id: string, input: Record<string, unknown>) {
    return request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },
  setProductPublished(id: string, published: boolean) {
    return request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish', published }),
    });
  },
  adjustStock(id: string, payload: { delta?: number; stock?: number; reason: string; actor?: string }) {
    return request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'stock', ...payload }),
    });
  },
  deleteProduct(id: string) {
    return request<{ ok: boolean; product: Product }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── Images ────────────────────────────────────────────────────────────
  deleteImage(fileId: string) {
    return request<{ ok: boolean; deleted: boolean }>(
      `/api/admin/images/${encodeURIComponent(fileId)}`,
      { method: 'DELETE' }
    );
  },

  // ── Orders ────────────────────────────────────────────────────────────
  listOrders() {
    return request<{ orders: SocialOrder[] }>('/api/orders');
  },
  createOrder(order: SocialOrder) {
    return request<{ order: SocialOrder }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },
  confirmOrder(id: string, actor?: string) {
    return request<{ order: SocialOrder; products: Product[] }>(
      `/api/orders/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ action: 'confirm', actor }) }
    );
  },
  cancelOrder(id: string, actor?: string) {
    return request<{ order: SocialOrder; products: Product[] }>(
      `/api/orders/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ action: 'cancel', actor }) }
    );
  },
  setOrderStatus(id: string, status: OrderStatus) {
    return request<{ order: SocialOrder }>(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'status', status }),
    });
  },

  // ── Inventory / settings / newsletter ─────────────────────────────────
  listMovements(limit = 200) {
    return request<{ movements: StockMovement[] }>(`/api/movements?limit=${limit}`);
  },
  getSettings() {
    return request<{ settings: StoreSettings }>('/api/settings');
  },
  saveSettings(settings: StoreSettings) {
    return request<{ settings: StoreSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
  newsletterSignup(email: string) {
    return request<{ ok: boolean }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // ── Admin session / migration ─────────────────────────────────────────
  session() {
    return request<AdminSessionInfo>('/api/admin/session');
  },
  login(password: string) {
    return request<{ ok: boolean }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
  logout() {
    return request<{ ok: boolean }>('/api/admin/logout', { method: 'POST' });
  },
  migrate(payload?: Record<string, unknown>) {
    return request<MigrationResponse>('/api/migrate', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
  },
};

/** Upload a product image with real progress events. */
export function uploadProductImage(
  file: File,
  alt: string,
  onProgress?: (percent: number) => void
): Promise<ProductImage> {
  return new Promise<ProductImage>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('alt', alt);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/images');
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText || '{}') as Record<string, unknown>;
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.image) {
        resolve(data.image as ProductImage);
      } else {
        reject(
          new ApiError(
            String(data.error || `Upload failed (${xhr.status}).`),
            xhr.status,
            typeof data.code === 'string' ? data.code : undefined
          )
        );
      }
    };

    xhr.onerror = () => reject(new ApiError('Network error while uploading the image.', 0));
    xhr.onabort = () => reject(new ApiError('Upload cancelled.', 0));
    xhr.send(form);
  });
}
