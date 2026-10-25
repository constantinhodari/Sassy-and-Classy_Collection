'use client';

import { useState, type ReactNode } from 'react';
import { useStore } from '@/context/StoreContext';

/**
 * Client-side gate for the admin workspace.
 *
 * This is a convenience guard only — every mutating API route independently
 * verifies the admin session server-side, so the endpoints stay protected even
 * if this component is bypassed.
 */
export default function AdminGate({ children }: { children: ReactNode }) {
  const { state, login } = useStore();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const admin = state.admin;

  if (!state.adminChecked) {
    return (
      <div className="admin-overlay admin-standalone">
        <div className="admin-card" style={{ maxWidth: 520, margin: '12vh auto' }}>
          <div className="admin-page-heading" style={{ marginBottom: 8 }}>
            <div>
              <h2>Connecting to MongoDB…</h2>
              <p>Checking the database connection and your admin session.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!admin?.mongoConfigured) {
    return (
      <div className="admin-overlay admin-standalone">
        <div className="admin-card" style={{ maxWidth: 640, margin: '10vh auto' }}>
          <div className="admin-page-heading" style={{ marginBottom: 8 }}>
            <div>
              <h2>MongoDB is not configured</h2>
              <p>
                This admin workspace stores every product image and record in MongoDB.
              </p>
            </div>
          </div>
          <div className="admin-warning-card">
            Copy <code>.env.example</code> to <code>.env.local</code>, set{' '}
            <code>MONGODB_URI</code> (and <code>MONGODB_DB</code>), then restart the dev
            server. See <strong>README.md</strong> for the full MongoDB Atlas walkthrough.
          </div>
        </div>
      </div>
    );
  }

  if (!admin.adminAuthConfigured) {
    return (
      <div className="admin-overlay admin-standalone">
        <div className="admin-card" style={{ maxWidth: 640, margin: '10vh auto' }}>
          <div className="admin-page-heading" style={{ marginBottom: 8 }}>
            <div>
              <h2>Administrator access is not configured</h2>
              <p>
                Upload and delete endpoints are intentionally disabled until you set an
                administrator password.
              </p>
            </div>
          </div>
          <div className="admin-warning-card">
            Add <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> to{' '}
            <code>.env.local</code>, then restart the server. Without them, no one can
            sign in and no uploads are accepted.
          </div>
        </div>
      </div>
    );
  }

  if (!admin.authenticated) {
    return (
      <div className="admin-overlay admin-standalone">
        <div className="admin-card" style={{ maxWidth: 460, margin: '14vh auto' }}>
          <div className="admin-page-heading" style={{ marginBottom: 4 }}>
            <div>
              <p className="eyebrow">STORE STUDIO</p>
              <h2>Administrator sign in</h2>
              <p>Enter the store password to manage products, images and orders.</p>
            </div>
          </div>
          <form
            className="admin-product-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!password) return;
              setBusy(true);
              const ok = await login(password);
              setBusy(false);
              if (ok) setPassword('');
            }}
          >
            <div className="form-grid">
              <label className="form-field span-two">
                Store password
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="button button-dark" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'} <span>↗</span>
              </button>
            </div>
          </form>
          <p style={{ fontSize: 11, color: '#899198', marginTop: 12 }}>
            Signed in as a shared store administrator. Data is stored in the configured
            MongoDB database.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
