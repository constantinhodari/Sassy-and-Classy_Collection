'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { stockState, money, IMAGE_FALLBACK } from '@/lib/utils';

interface Props {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
}

export default function ProductsTab({ onAddProduct, onEditProduct }: Props) {
  const { state, archiveProduct, deleteProduct } = useStore();
  const [query, setQuery] = useState('');

  const filtered = state.products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.name, p.category, p.sku].some((v) =>
      String(v).toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h2>Your product edit.</h2>
          <p>
            Add a piece, update its details, or hide products that are no longer
            available.
          </p>
        </div>
        <button className="admin-btn" id="adminAddProduct" onClick={onAddProduct}>
          ＋ Add product
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          id="adminProductSearch"
          type="search"
          placeholder="Search name, category or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span style={{ fontSize: 9, color: '#899198' }}>
          {state.products.length} product
          {state.products.length === 1 ? '' : 's'} in MongoDB Atlas
        </span>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Inventory</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="adminProductRows">
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const stateClass = stockState(p);
                  return (
                    <tr key={p.id}>
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
                            <small>{p.category}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.sku}</td>
                      <td>{money(p.price)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            stateClass === 'low'
                              ? 'warn'
                              : stateClass === 'out'
                              ? 'danger'
                              : ''
                          }`}
                        >
                          {stateClass === 'out'
                            ? 'Out of stock'
                            : stateClass === 'low'
                            ? 'Low stock'
                            : 'In stock'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            p.published === false ? 'neutral' : ''
                          }`}
                        >
                          {p.published === false ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button onClick={() => onEditProduct(p)}>Edit</button>
                          <button
                            className="delete"
                            onClick={() => void archiveProduct(p.id)}
                          >
                            {p.published === false ? 'Publish' : 'Archive'}
                          </button>
                          <button
                            className="delete"
                            onClick={() => void deleteProduct(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      <strong>No products found</strong>
                      Try another search or add your first product.
                    </div>
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
