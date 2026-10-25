'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Product,
  ProductInput,
  CartLine,
  StoreSettings,
  SocialOrder,
  StockMovement,
  Toast,
} from '@/types';
import { STORAGE, loadJSON, saveJSON } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { api, ApiError, type AdminSessionInfo, type MigrationReport } from '@/lib/apiClient';
import {
  productById,
  makeOrderSummary,
  copyText,
  cleanPhone,
} from '@/lib/utils';

// ─── State ─────────────────────────────────────────────────────────────────

type DataStatus = 'loading' | 'ready' | 'error';

interface StoreState {
  products: Product[];
  cart: CartLine[];
  wishlist: string[];
  settings: StoreSettings;
  orders: SocialOrder[];
  movements: StockMovement[];
  toasts: Toast[];
  dataStatus: DataStatus;
  dataError: string | null;
  admin: AdminSessionInfo | null;
  adminChecked: boolean;
  // UI state
  cartOpen: boolean;
  wishlistOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  activeFilter: string;
  activeSort: string;
  productModalId: string | null;
  infoModal: { title: string; body: string } | null;
  hydrated: boolean;
}

const initialState: StoreState = {
  products: [],
  cart: [],
  wishlist: [],
  settings: DEFAULT_SETTINGS,
  orders: [],
  movements: [],
  toasts: [],
  dataStatus: 'loading',
  dataError: null,
  admin: null,
  adminChecked: false,
  cartOpen: false,
  wishlistOpen: false,
  searchOpen: false,
  searchQuery: '',
  activeFilter: 'All',
  activeSort: 'featured',
  productModalId: null,
  infoModal: null,
  hydrated: false,
};

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE'; payload: Partial<StoreState> }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CART'; payload: CartLine[] }
  | { type: 'SET_WISHLIST'; payload: string[] }
  | { type: 'SET_SETTINGS'; payload: StoreSettings }
  | { type: 'SET_ORDERS'; payload: SocialOrder[] }
  | { type: 'SET_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'SET_ADMIN'; payload: AdminSessionInfo | null }
  | { type: 'SET_DATA_STATUS'; payload: { status: DataStatus; error: string | null } }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'OPEN_WISHLIST' }
  | { type: 'CLOSE_WISHLIST' }
  | { type: 'OPEN_SEARCH' }
  | { type: 'CLOSE_SEARCH' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_SORT'; payload: string }
  | { type: 'OPEN_PRODUCT_MODAL'; payload: string }
  | { type: 'CLOSE_PRODUCT_MODAL' }
  | { type: 'OPEN_INFO_MODAL'; payload: { title: string; body: string } }
  | { type: 'CLOSE_INFO_MODAL' };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, movements: action.payload };
    case 'SET_ADMIN':
      return { ...state, admin: action.payload, adminChecked: true };
    case 'SET_DATA_STATUS':
      return { ...state, dataStatus: action.payload.status, dataError: action.payload.error };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case 'OPEN_CART':
      return { ...state, cartOpen: true, wishlistOpen: false };
    case 'CLOSE_CART':
      return { ...state, cartOpen: false };
    case 'OPEN_WISHLIST':
      return { ...state, wishlistOpen: true, cartOpen: false };
    case 'CLOSE_WISHLIST':
      return { ...state, wishlistOpen: false };
    case 'OPEN_SEARCH':
      return { ...state, searchOpen: true };
    case 'CLOSE_SEARCH':
      return { ...state, searchOpen: false };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER':
      return { ...state, activeFilter: action.payload };
    case 'SET_SORT':
      return { ...state, activeSort: action.payload };
    case 'OPEN_PRODUCT_MODAL':
      return { ...state, productModalId: action.payload };
    case 'CLOSE_PRODUCT_MODAL':
      return { ...state, productModalId: null };
    case 'OPEN_INFO_MODAL':
      return { ...state, infoModal: action.payload };
    case 'CLOSE_INFO_MODAL':
      return { ...state, infoModal: null };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

export interface StoreContextValue {
  state: StoreState;
  dispatch: React.Dispatch<Action>;
  scope: 'store' | 'admin';
  // Utilities
  toast: (message: string) => void;
  refreshAll: () => Promise<void>;
  apiErrorMessage: (error: unknown) => string;
  // Cart & wishlist (browser-local by design)
  addToCart: (id: string, qty?: number) => boolean;
  toggleWishlist: (id: string) => void;
  changeCartQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearFilters: () => void;
  orderViaWhatsApp: (items: CartLine[], fromProduct?: boolean) => void;
  orderViaInstagram: (items: CartLine[], fromProduct?: boolean) => void;
  // Admin session
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  importBrowserData: () => Promise<MigrationReport | null>;
  // Admin: products
  saveProduct: (data: ProductInput & { id?: string }) => Promise<Product | null>;
  archiveProduct: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustInventory: (productId: string, delta: number, reason: string) => Promise<void>;
  // Admin: orders
  recordOrder: (order: SocialOrder) => Promise<void>;
  confirmOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: SocialOrder['status']) => Promise<void>;
  // Admin: settings
  saveSettings: (settings: StoreSettings) => Promise<void>;
  newsletterSignup: (email: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function StoreProvider({
  children,
  scope = 'store',
}: {
  children: ReactNode;
  scope?: 'store' | 'admin';
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const toast = useCallback((message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    dispatch({ type: 'ADD_TOAST', payload: { id, message } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4200);
  }, []);

  const apiErrorMessage = useCallback(
    (error: unknown): string => {
      if (error instanceof ApiError) return error.message;
      if (error instanceof Error) return error.message;
      return 'Something went wrong. Please try again.';
    },
    []
  );

  // ─── Local (browser-only) cart & wishlist hydration ───────────────────────

  useEffect(() => {
    const cart = loadJSON<CartLine[]>(STORAGE.cart, []);
    const wishlist = loadJSON<string[]>(STORAGE.wishlist, []);
    dispatch({ type: 'HYDRATE', payload: { cart, wishlist } });
  }, []);

  // ─── Server data ──────────────────────────────────────────────────────────

  const refreshAll = useCallback(async () => {
    dispatch({ type: 'SET_DATA_STATUS', payload: { status: 'loading', error: null } });
    try {
      const session = await api.session();
      dispatch({ type: 'SET_ADMIN', payload: session });

      if (!session.mongoConfigured) {
        dispatch({
          type: 'SET_DATA_STATUS',
          payload: {
            status: 'error',
            error:
              'MongoDB is not configured. Add MONGODB_URI to .env.local and restart the server.',
          },
        });
        return;
      }

      const settingsResult = await api.getSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settingsResult.settings });

      const productScope = scope === 'admin' && session.authenticated ? 'all' : 'public';
      const productResult = await api.listProducts(productScope);
      dispatch({ type: 'SET_PRODUCTS', payload: productResult.products });

      if (session.authenticated) {
        const [ordersResult, movementsResult] = await Promise.all([
          api.listOrders(),
          api.listMovements(),
        ]);
        dispatch({ type: 'SET_ORDERS', payload: ordersResult.orders });
        dispatch({ type: 'SET_MOVEMENTS', payload: movementsResult.movements });
      } else {
        dispatch({ type: 'SET_ORDERS', payload: [] });
        dispatch({ type: 'SET_MOVEMENTS', payload: [] });
      }

      dispatch({ type: 'SET_DATA_STATUS', payload: { status: 'ready', error: null } });
    } catch (error) {
      const message = apiErrorMessage(error);
      dispatch({ type: 'SET_DATA_STATUS', payload: { status: 'error', error: message } });
    }
  }, [scope, apiErrorMessage]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // ─── Admin session ────────────────────────────────────────────────────────

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        await api.login(password);
        await refreshAll();
        toast('Signed in. You can now manage the store.');
        return true;
      } catch (error) {
        toast(apiErrorMessage(error));
        return false;
      }
    },
    [refreshAll, toast, apiErrorMessage]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore — cookie is cleared client-visible either way
    }
    await refreshAll();
    toast('Signed out of the admin workspace.');
  }, [refreshAll, toast]);

  const importBrowserData = useCallback(async (): Promise<MigrationReport | null> => {
    try {
      const payload = {
        products: loadJSON<Product[]>(STORAGE.products, []),
        settings: loadJSON<Partial<StoreSettings>>(STORAGE.settings, {}),
        orders: loadJSON<SocialOrder[]>(STORAGE.orders, []),
        movements: loadJSON<StockMovement[]>(STORAGE.movements, []),
      };
      if (!payload.products.length) {
        toast('No browser products were found to import.');
        return null;
      }
      const result = await api.migrate(payload as unknown as Record<string, unknown>);
      await refreshAll();
      const inserted = (result.clientReport?.productsInserted ?? 0) + result.report.starterSeeded;
      toast(`Imported ${inserted} product${inserted === 1 ? '' : 's'} into MongoDB.`);
      return result.clientReport;
    } catch (error) {
      toast(apiErrorMessage(error));
      return null;
    }
  }, [refreshAll, toast, apiErrorMessage]);

  // ─── Cart (browser-local) ─────────────────────────────────────────────────

  const addToCart = useCallback(
    (id: string, qty = 1): boolean => {
      const product = productById(state.products, id);
      qty = Math.floor(Number(qty));
      if (!product || product.published === false) {
        toast('This piece is not available right now.');
        return false;
      }
      if (!Number.isInteger(qty) || qty < 1) {
        toast('Please choose a valid quantity.');
        return false;
      }
      if (product.stock <= 0) {
        toast('This piece is currently out of stock.');
        return false;
      }
      const existing = state.cart.find((item) => item.id === id);
      const total = (existing?.qty || 0) + qty;
      if (total > Number(product.stock)) {
        toast(`Only ${product.stock} item${product.stock === 1 ? '' : 's'} available right now.`);
        return false;
      }
      const newCart = existing
        ? state.cart.map((item) => (item.id === id ? { ...item, qty: total } : item))
        : [...state.cart, { id, qty }];
      saveJSON(STORAGE.cart, newCart);
      dispatch({ type: 'SET_CART', payload: newCart });
      toast(`${product.name} added to your bag.`);
      return true;
    },
    [state.products, state.cart, toast]
  );

  const changeCartQty = useCallback(
    (id: string, delta: number) => {
      const line = state.cart.find((item) => item.id === id);
      const product = productById(state.products, id);
      if (!line || !product) return;
      const next = line.qty + delta;
      let newCart: CartLine[];
      if (next < 1) {
        newCart = state.cart.filter((item) => item.id !== id);
      } else if (next > Number(product.stock)) {
        toast(`Only ${product.stock} item${product.stock === 1 ? '' : 's'} available.`);
        return;
      } else {
        newCart = state.cart.map((item) => (item.id === id ? { ...item, qty: next } : item));
      }
      saveJSON(STORAGE.cart, newCart);
      dispatch({ type: 'SET_CART', payload: newCart });
    },
    [state.cart, state.products, toast]
  );

  const removeFromCart = useCallback(
    (id: string) => {
      const newCart = state.cart.filter((item) => item.id !== id);
      saveJSON(STORAGE.cart, newCart);
      dispatch({ type: 'SET_CART', payload: newCart });
    },
    [state.cart]
  );

  // ─── Wishlist (browser-local) ─────────────────────────────────────────────

  const toggleWishlist = useCallback(
    (id: string) => {
      const product = productById(state.products, id);
      if (!product) return;
      const isInWishlist = state.wishlist.includes(id);
      const newWishlist = isInWishlist
        ? state.wishlist.filter((item) => item !== id)
        : [...state.wishlist, id];
      saveJSON(STORAGE.wishlist, newWishlist);
      dispatch({ type: 'SET_WISHLIST', payload: newWishlist });
      toast(isInWishlist ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
    },
    [state.products, state.wishlist, toast]
  );

  const clearFilters = useCallback(() => {
    dispatch({ type: 'SET_FILTER', payload: 'All' });
    dispatch({ type: 'SET_SEARCH', payload: '' });
  }, []);

  // ─── Social ordering ──────────────────────────────────────────────────────

  const orderViaWhatsApp = useCallback(
    (items: CartLine[], fromProduct = false) => {
      const summary = makeOrderSummary(items, state.products, state.settings);
      if (!summary.records.length) {
        toast('Add a product before preparing your order.');
        return;
      }
      const unavailable = summary.records.find(
        (item) => item.qty > Number(item.product.stock) || Number(item.product.stock) <= 0
      );
      if (unavailable) {
        toast(
          `${unavailable.product.name} does not have enough stock for that quantity. Please update your bag.`
        );
        return;
      }
      const phone = cleanPhone(state.settings.whatsappNumber);
      if (!phone) {
        toast('Add your WhatsApp business number in Admin → Store settings first.');
        if (fromProduct) dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
        return;
      }
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(summary.text)}`,
        '_blank',
        'noopener,noreferrer'
      );
      toast('WhatsApp opened with your order details. The order is not confirmed yet.');
      if (fromProduct) dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
    },
    [state.products, state.settings, toast]
  );

  const orderViaInstagram = useCallback(
    async (items: CartLine[], fromProduct = false) => {
      const summary = makeOrderSummary(items, state.products, state.settings);
      if (!summary.records.length) {
        toast('Add a product before preparing your order.');
        return;
      }
      const unavailable = summary.records.find(
        (item) => item.qty > Number(item.product.stock) || Number(item.product.stock) <= 0
      );
      if (unavailable) {
        toast(
          `${unavailable.product.name} does not have enough stock for that quantity. Please update your bag.`
        );
        return;
      }
      const username = String(state.settings.instagramUsername || 'sassyclassy_rwanda')
        .replace(/^@/, '')
        .trim();
      window.open(
        `https://www.instagram.com/${encodeURIComponent(username)}/`,
        '_blank',
        'noopener,noreferrer'
      );
      const copied = await copyText(summary.text);
      toast(
        copied
          ? 'Order details copied. Paste them into your Instagram DM.'
          : 'Instagram opened. Please copy your order details from the cart and send them in a DM.'
      );
      if (fromProduct) dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
    },
    [state.products, state.settings, toast]
  );

  // ─── Admin: products ──────────────────────────────────────────────────────

  const saveProduct = useCallback(
    async (data: ProductInput & { id?: string }): Promise<Product | null> => {
      const payload: Record<string, unknown> = {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        category: data.category,
        price: data.price,
        comparePrice: data.comparePrice,
        stock: data.stock,
        lowStock: data.lowStock,
        description: data.description,
        images: data.images,
        featured: data.featured,
        published: data.published,
        badge: data.badge,
      };
      try {
        const result = data.id
          ? await api.updateProduct(data.id, payload)
          : await api.createProduct(payload);
        // Refresh so inventory movements and the storefront stay in sync.
        await refreshAll();
        toast(data.id ? 'Product updated in MongoDB.' : 'Product saved to MongoDB.');
        return result.product;
      } catch (error) {
        toast(apiErrorMessage(error));
        return null;
      }
    },
    [refreshAll, toast, apiErrorMessage]
  );

  const archiveProduct = useCallback(
    async (id: string) => {
      const product = productById(state.products, id);
      if (!product) return;
      if (product.published !== false) {
        if (
          !window.confirm(`Archive “${product.name}”? It will no longer appear in the storefront.`)
        )
          return;
      }
      try {
        await api.setProductPublished(id, product.published === false);
        await refreshAll();
        toast(product.published ? 'Product archived.' : 'Product published.');
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [state.products, refreshAll, toast, apiErrorMessage]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const product = productById(state.products, id);
      if (!product) return;
      if (
        !window.confirm(
          `Permanently delete “${product.name}” from the database? Uploaded images are only removed when no other product uses them.`
        )
      )
        return;
      try {
        await api.deleteProduct(id);
        await refreshAll();
        toast('Product deleted from MongoDB.');
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [state.products, refreshAll, toast, apiErrorMessage]
  );

  const adjustInventory = useCallback(
    async (productId: string, delta: number, reason: string) => {
      if (!Number.isInteger(delta) || delta === 0) {
        toast('Enter a whole-number adjustment, such as +5 or -2.');
        return;
      }
      try {
        const result = await api.adjustStock(productId, { delta, reason, actor: 'Admin dashboard' });
        dispatch({
          type: 'SET_PRODUCTS',
          payload: state.products.map((p) => (p.id === productId ? result.product : p)),
        });
        await refreshAll();
        toast(`Stock updated: ${result.product.name} now has ${result.product.stock}.`);
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [state.products, refreshAll, toast, apiErrorMessage]
  );

  // ─── Admin: orders ────────────────────────────────────────────────────────

  const recordOrder = useCallback(
    async (order: SocialOrder) => {
      try {
        await api.createOrder(order);
        await refreshAll();
        toast('Social order recorded as pending. Stock has not changed.');
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [refreshAll, toast, apiErrorMessage]
  );

  const confirmOrder = useCallback(
    async (id: string) => {
      try {
        const result = await api.confirmOrder(id, 'Admin dashboard');
        await refreshAll();
        toast(`Order ${result.order.id} confirmed and stock updated.`);
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [refreshAll, toast, apiErrorMessage]
  );

  const cancelOrder = useCallback(
    async (id: string) => {
      const order = state.orders.find((o) => o.id === id);
      if (!order) return;
      if (order.status === 'Cancelled' || order.status === 'Completed') return;
      if (
        !window.confirm(
          `Cancel order ${order.id}?${
            order.stockAdjusted ? ' Stock already deducted will be restored.' : ''
          }`
        )
      )
        return;
      try {
        await api.cancelOrder(id, 'Admin dashboard');
        await refreshAll();
        toast('Order cancelled. Inventory was updated where required.');
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [state.orders, refreshAll, toast, apiErrorMessage]
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: SocialOrder['status']) => {
      try {
        await api.setOrderStatus(id, status);
        await refreshAll();
        if (status === 'Completed') {
          toast('Order marked as completed. Stock is not deducted again.');
        }
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [refreshAll, toast, apiErrorMessage]
  );

  // ─── Admin: settings & newsletter ─────────────────────────────────────────

  const saveSettings = useCallback(
    async (newSettings: StoreSettings) => {
      try {
        const result = await api.saveSettings(newSettings);
        dispatch({ type: 'SET_SETTINGS', payload: result.settings });
        toast('Store settings saved to MongoDB.');
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [toast, apiErrorMessage]
  );

  const newsletterSignup = useCallback(
    async (email: string) => {
      if (!email) {
        toast('Enter an email address first.');
        return;
      }
      try {
        await api.newsletterSignup(email);
        toast('Thank you — your email has been saved.');
      } catch (error) {
        toast(apiErrorMessage(error));
      }
    },
    [toast, apiErrorMessage]
  );

  const value: StoreContextValue = {
    state,
    dispatch,
    scope,
    toast,
    refreshAll,
    apiErrorMessage,
    addToCart,
    toggleWishlist,
    changeCartQty,
    removeFromCart,
    clearFilters,
    orderViaWhatsApp,
    orderViaInstagram,
    login,
    logout,
    importBrowserData,
    saveProduct,
    archiveProduct,
    deleteProduct,
    adjustInventory,
    recordOrder,
    confirmOrder,
    cancelOrder,
    updateOrderStatus,
    saveSettings,
    newsletterSignup,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
