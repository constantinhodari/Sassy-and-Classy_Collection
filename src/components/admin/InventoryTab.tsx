'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { publicProducts, stockState, stockLabel, money, IMAGE_FALLBACK } from '@/lib/utils';

export default function InventoryTab() {
  const { state, adjustInventory, toast } = useStore();
  const [query, setQuery] = useState('');
  const [adjustments, setAdjustments] = useState<Record<string, { delta: string; reason: string }>>({});

  const pubProds = publicProducts(state.products);
  const totalUnits = pubProds.reduce((sum, p) => sum + Number(p.stock), 0);
  const lowCount = pubProds.filter((p) => stockState(p) !== 'ok').length;
  const stockValue = pubProds.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.stock),
    0
  );

  const filtered = state.products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.name, p.sku].some((v) => String(v).toLowerCase().includes(q));
  });

  const handleAdjustClick = (productId: string) => {
    const adj = adjustments[productId];
    const delta = Number(adj?.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      toast('Enter a whole-number adjustment, such as +5 or -2.');
      return;
    }
    const reason = adj?.reason?.trim() || 'Restock';
    adjustInventory(productId, delta, reason);
    setAdjustments((prev) => ({
      ...prev,
      [productId]: { delta: '', reason: '' },
    }));
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h2>Every piece accounted for.</h2>
          <p>
            Adjust stock carefully. Each adjustment is recorded in the local
            movement log.
          </p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">Total units</div>
          <div className="admin-stat-value">{totalUnits}</div>
          <div className="admin-stat-note">Current published stock</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Low / out of stock</div>
          <div className="admin-stat-value">{lowCount}</div>
          <div className="admin-stat-note">Needs a little attention</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Stock movements</div>
          <div className="admin-stat-value">{state.movements.length}</div>
          <div className="admin-stat-note">Adjustments recorded</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Stock value</div>
          <div className="admin-stat-value">{money(stockValue)}</div>
          <div className="admin-stat-note">Retail price × units, not cost value</div>
        </div>
      </div>

      <div className="admin-warning-card" style={{ marginBottom: 18 }}>
        Use a positive number to add stock and a negative number to remove it. Do
        not include the new total—enter only the change.
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Current stock</h3>
            <p>Adjustments will create a movement record.</p>
          </div>
          <input
            className="admin-search"
            style={{ maxWidth: 220 }}
            id="inventorySearch"
            placeholder="Find product or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Adjustment</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="inventoryRows">
              {filtered.map((p) => {
                const st = stockState(p);
                const currentAdj = adjustments[p.id] || { delta: '', reason: '' };
                return (
                  <tr key={p.id} data-inventory-row={p.id}>
                    <td>
                      <div className="admin-table-product">
                        <img
                          src={p.image || IMAGE_FALLBACK}
                          alt={p.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              IMAGE_FALLBACK;
                          }}
                        />
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.stock}</td>
                    <td>{p.lowStock}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          st === 'out' ? 'danger' : st === 'low' ? 'warn' : ''
                        }`}
                      >
                        {stockLabel(p)}
                      </span>
                    </td>
                    <td>
                      <input
                        className="admin-field-inline"
                        placeholder="e.g. +5"
                        type="number"
                        value={currentAdj.delta}
                        onChange={(e) =>
                          setAdjustments((prev) => ({
                            ...prev,
                            [p.id]: { ...currentAdj, delta: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="admin-filter-select"
                        value={currentAdj.reason || 'Restock'}
                        onChange={(e) =>
                          setAdjustments((prev) => ({
                            ...prev,
                            [p.id]: { ...currentAdj, reason: e.target.value },
                          }))
                        }
                        aria-label="Adjustment reason"
                      >
                        <option>Restock</option>
                        <option>Damaged item</option>
                        <option>Stock count correction</option>
                        <option>Returned item</option>
                        <option>Manual adjustment</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="admin-btn secondary"
                        style={{ padding: '6px 10px', fontSize: 9 }}
                        onClick={() => handleAdjustClick(p.id)}
                      >
                        Apply
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Recent stock movements</h3>
            <p>Latest adjustments and confirmed social orders.</p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Product</th>
                <th>Movement</th>
                <th>Previous</th>
                <th>New quantity</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {state.movements.length > 0 ? (
                state.movements.slice(0, 30).map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.timestamp).toLocaleString()}</td>
                    <td>
                      {m.productName}
                      <small style={{ display: 'block', color: '#999' }}>
                        {m.sku}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`movement-tag ${
                          m.change < 0 ? 'negative' : ''
                        }`}
                      >
                        {m.change > 0 ? '+' : ''}
                        {m.change}
                      </span>
                    </td>
                    <td>{m.previousQty}</td>
                    <td>{m.newQty}</td>
                    <td>
                      {m.reason}
                      {m.note && (
                        <small style={{ display: 'block', color: '#999' }}>
                          {m.note}
                        </small>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">No movements recorded yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
