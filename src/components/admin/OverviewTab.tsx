'use client';

import { useStore } from '@/context/StoreContext';
import { publicProducts, stockState, stockLabel, money } from '@/lib/utils';

interface Props {
  onGoToTab: (tab: string) => void;
}

export default function OverviewTab({ onGoToTab }: Props) {
  const { state } = useStore();
  const pubProds = publicProducts(state.products);

  const activeCount = pubProds.length;
  const unitsCount = pubProds.reduce((sum, p) => sum + Number(p.stock), 0);
  const lowCount = pubProds.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.lowStock)
  ).length;
  const outCount = pubProds.filter((p) => Number(p.stock) <= 0).length;

  const recentOrders = [...state.orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const watchProducts = pubProds
    .filter((p) => stockState(p) !== 'ok')
    .slice(0, 6);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h2>Good things, in order.</h2>
          <p>
            A quick look at your store. Products, stock and orders are stored in MongoDB.
          </p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">Published products</div>
          <div className="admin-stat-value">{activeCount}</div>
          <div className="admin-stat-note">Visible in the storefront</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Stock units</div>
          <div className="admin-stat-value">{unitsCount}</div>
          <div className="admin-stat-note">Units across published products</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Low stock</div>
          <div className="admin-stat-value">{lowCount}</div>
          <div className="admin-stat-note">Items at their alert threshold</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Out of stock</div>
          <div className="admin-stat-value">{outCount}</div>
          <div className="admin-stat-note">Items that cannot be ordered</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Recent social orders</h3>
            <p>Orders you recorded from WhatsApp and Instagram.</p>
          </div>
          <button
            className="admin-btn secondary"
            onClick={() => onGoToTab('orders')}
          >
            View orders ↗
          </button>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.id}</strong>
                      </td>
                      <td>{o.customer}</td>
                      <td>{o.channel}</td>
                      <td>{money(o.total)}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            o.status === 'Pending Confirmation'
                              ? 'warn'
                              : o.status === 'Cancelled'
                              ? 'danger'
                              : 'neutral'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty">
                        <strong>No social orders recorded</strong>
                        Record an order after a customer contacts you.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Stock to keep an eye on</h3>
            <p>Low-stock and out-of-stock products.</p>
          </div>
          <button
            className="admin-btn secondary"
            onClick={() => onGoToTab('inventory')}
          >
            Open inventory ↗
          </button>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {watchProducts.length > 0 ? (
                  watchProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.sku}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            stockState(p) === 'out' ? 'danger' : 'warn'
                          }`}
                        >
                          {stockLabel(p)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty">
                        All published products have healthy stock.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
