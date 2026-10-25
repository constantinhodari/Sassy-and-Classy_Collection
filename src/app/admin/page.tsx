'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import AdminGate from '@/components/admin/AdminGate';
import OverviewTab from '@/components/admin/OverviewTab';
import ProductsTab from '@/components/admin/ProductsTab';
import InventoryTab from '@/components/admin/InventoryTab';
import OrdersTab from '@/components/admin/OrdersTab';
import SettingsTab from '@/components/admin/SettingsTab';
import ProductFormModal from '@/components/admin/ProductFormModal';
import OrderFormModal from '@/components/admin/OrderFormModal';
import ToastRegion from '@/components/storefront/ToastRegion';

type AdminTab = 'overview' | 'products' | 'inventory' | 'orders' | 'settings';

export default function AdminPage() {
  const { state, logout, refreshAll } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (orderModalOpen) setOrderModalOpen(false);
        else if (productModalOpen) setProductModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orderModalOpen, productModalOpen]);

  useEffect(() => {
    document.body.classList.toggle('lock-scroll', productModalOpen || orderModalOpen);
    return () => document.body.classList.remove('lock-scroll');
  }, [productModalOpen, orderModalOpen]);

  // Mirror the original admin.html `admin-page-body` class for page-level styling
  useEffect(() => {
    document.body.classList.add('admin-page-body');
    return () => document.body.classList.remove('admin-page-body');
  }, []);

  const tabTitles: Record<AdminTab, string> = {
    overview: 'Overview',
    products: 'Product management',
    inventory: 'Inventory management',
    orders: 'Social orders',
    settings: 'Store settings',
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  return (
    <>
      <AdminGate>
        <div className="admin-overlay admin-standalone" id="adminOverlay">
          <section className="admin-app" aria-label="Store administration">
            <aside className="admin-sidebar">
              <div className="admin-sidebar-brand">
                <img
                  src="/images/brand-logo.jpg"
                  alt="Sassy & Classy Collections Logo"
                  className="brand-logo-img admin-brand-logo"
                  width={42}
                  height={42}
                />
                <div>
                  <strong>SASSY &amp; CLASSY</strong>
                  <small>STORE STUDIO</small>
                </div>
              </div>
              <p className="admin-label">WORKSPACE</p>
              <button
                className={`admin-nav ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <span>◫</span> Overview
              </button>
              <button
                className={`admin-nav ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <span>◇</span> Products
              </button>
              <button
                className={`admin-nav ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                <span>▤</span> Inventory
              </button>
              <button
                className={`admin-nav ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <span>↗</span> Social orders
              </button>
              <button
                className={`admin-nav ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <span>⚙</span> Store settings
              </button>

              <div className="admin-sidebar-bottom">
                <span className="local-dot"></span>
                <div>
                  <strong>MongoDB Atlas</strong>
                  <small>{state.admin?.database || 'Shared database'}</small>
                </div>
              </div>
              <button className="admin-nav" onClick={() => void logout()}>
                <span>⏻</span> Sign out
              </button>
            </aside>

            <div className="admin-main">
              <header className="admin-topbar">
                <div>
                  <span className="admin-crumb">S&amp;C / ADMINISTRATION</span>
                  <h1 id="adminPageTitle">{tabTitles[activeTab]}</h1>
                </div>
                <div className="admin-top-actions">
                  <span className="admin-demo-badge">
                    {state.admin?.mongoConnected ? 'MONGODB CONNECTED' : 'DATABASE MODE'}
                  </span>
                  <button className="admin-btn secondary" onClick={() => void refreshAll()}>
                    ↻ Refresh
                  </button>
                  <Link className="admin-back-link" href="/" aria-label="Return to storefront">
                    View storefront ↗
                  </Link>
                </div>
              </header>

              {state.dataError && (
                <div className="admin-notice">
                  <strong>Database notice:</strong> {state.dataError}
                </div>
              )}

              <div className="admin-page" id="adminPageContent">
                {activeTab === 'overview' && (
                  <OverviewTab onGoToTab={(tab) => setActiveTab(tab as AdminTab)} />
                )}
                {activeTab === 'products' && (
                  <ProductsTab
                    onAddProduct={handleOpenAddProduct}
                    onEditProduct={handleOpenEditProduct}
                  />
                )}
                {activeTab === 'inventory' && <InventoryTab />}
                {activeTab === 'orders' && (
                  <OrdersTab onRecordOrder={() => setOrderModalOpen(true)} />
                )}
                {activeTab === 'settings' && <SettingsTab />}
              </div>
            </div>
          </section>
        </div>

        {productModalOpen && (
          <ProductFormModal
            product={editingProduct}
            onClose={() => setProductModalOpen(false)}
          />
        )}

        {orderModalOpen && <OrderFormModal onClose={() => setOrderModalOpen(false)} />}
      </AdminGate>

      <ToastRegion />
    </>
  );
}
