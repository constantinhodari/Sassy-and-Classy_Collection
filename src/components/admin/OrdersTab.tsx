'use client';

import { useStore } from '@/context/StoreContext';
import { money } from '@/lib/utils';

interface Props {
  onRecordOrder: () => void;
}

export default function OrdersTab({ onRecordOrder }: Props) {
  const { state, confirmOrder, cancelOrder, updateOrderStatus } = useStore();

  const sortedOrders = [...state.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h2>Social order desk.</h2>
          <p>
            Record orders received through WhatsApp or Instagram, then confirm
            them when stock is checked.
          </p>
        </div>
        <button
          className="admin-btn"
          id="adminRecordOrder"
          onClick={onRecordOrder}
        >
          ＋ Record order
        </button>
      </div>

      <div className="admin-warning-card" style={{ marginBottom: 18 }}>
        Opening WhatsApp or Instagram does not create an order automatically.
        Record the order here after the customer sends the details. Pending
        orders do not change stock.
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Channel</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length > 0 ? (
                sortedOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.id}</strong>
                      <small
                        style={{ display: 'block', color: '#999', marginTop: 4 }}
                      >
                        {new Date(o.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {o.customer}
                      {o.contact && (
                        <small style={{ display: 'block', color: '#999' }}>
                          {o.contact}
                        </small>
                      )}
                    </td>
                    <td>{o.channel}</td>
                    <td>
                      {o.items.map((i) => i.name).join(', ')}
                      <small style={{ display: 'block', color: '#999' }}>
                        {o.items.map((i) => i.sku).join(', ')}
                      </small>
                    </td>
                    <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td>{money(o.total)}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          o.status === 'Pending Confirmation'
                            ? 'warn'
                            : o.status === 'Cancelled'
                            ? 'danger'
                            : o.status === 'Completed'
                            ? ''
                            : 'neutral'
                        }`}
                      >
                        {o.status}
                      </span>
                      {o.stockAdjusted && (
                        <small
                          style={{
                            display: 'block',
                            color: '#64826a',
                            marginTop: 4,
                          }}
                        >
                          Stock adjusted
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {o.status === 'Pending Confirmation' && (
                          <>
                            <button onClick={() => confirmOrder(o.id)}>
                              Confirm
                            </button>
                            <button
                              className="delete"
                              onClick={() => cancelOrder(o.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {o.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() =>
                                updateOrderStatus(o.id, 'Preparing')
                              }
                            >
                              Prepare
                            </button>
                            <button
                              className="delete"
                              onClick={() => cancelOrder(o.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(o.status === 'Preparing' ||
                          o.status === 'Ready for Delivery') && (
                          <>
                            <button
                              onClick={() =>
                                updateOrderStatus(o.id, 'Completed')
                              }
                            >
                              Complete
                            </button>
                            <button
                              className="delete"
                              onClick={() => cancelOrder(o.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(o.status === 'Completed' ||
                          o.status === 'Cancelled') && <span>—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">
                      <strong>No orders recorded yet</strong>
                      Your next social order can be added here.
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
