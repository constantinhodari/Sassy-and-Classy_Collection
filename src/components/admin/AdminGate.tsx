'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
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
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const admin = state.admin;

  if (!state.adminChecked) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card" style={{ maxWidth: 460 }}>
          <div className="admin-login-header">
            <p className="admin-login-subline">Connecting to MongoDB…</p>
            <h1 className="admin-login-title">Checking session</h1>
            <div className="admin-login-divider" aria-hidden="true" />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>
              Checking the database connection and your admin session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!admin?.mongoConfigured) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card" style={{ maxWidth: 520 }}>
          <div className="admin-login-header">
            <p className="admin-login-subline">Database Setup</p>
            <h1 className="admin-login-title">MongoDB is not configured</h1>
            <div className="admin-login-divider" aria-hidden="true" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 14 }}>
            This admin workspace stores every product image and record in MongoDB.
          </p>
          <div className="admin-warning-card">
            Copy <code>.env.example</code> to <code>.env.local</code>, set{' '}
            <code>MONGODB_URI</code> (and <code>MONGODB_DB</code>), then restart the dev
            server. See <strong>README.md</strong> for the full MongoDB Atlas walkthrough.
          </div>
          <div className="admin-login-footer">
            <Link href="/" className="admin-login-back-link">
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!admin.adminAuthConfigured) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card" style={{ maxWidth: 520 }}>
          <div className="admin-login-header">
            <p className="admin-login-subline">Security Setup</p>
            <h1 className="admin-login-title">Administrator access required</h1>
            <div className="admin-login-divider" aria-hidden="true" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 14 }}>
            Upload and delete endpoints are intentionally disabled until you set an
            administrator password.
          </p>
          <div className="admin-warning-card">
            Add <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> to{' '}
            <code>.env.local</code>, then restart the server. Without them, no one can
            sign in and no uploads are accepted.
          </div>
          <div className="admin-login-footer">
            <Link href="/" className="admin-login-back-link">
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!admin.authenticated) {
    return (
      <div className="admin-login-wrapper">
        <section
          className={`admin-login-card ${shake ? 'admin-card-shake' : ''} ${
            isSuccess ? 'admin-card-success' : ''
          }`}
          aria-labelledby="adminLoginHeading"
        >
          {/* Brand Wordmark & Header */}
          <div className="admin-login-header admin-stagger-1">
            <div className="admin-login-brand">
              <img
                src="/images/brand-logo.jpg"
                alt="Sassy & Classy Collections Logo"
                className="brand-logo-img"
                width={48}
                height={48}
              />
              <div className="brand-copy">
                <span className="brand-name">
                  SASSY <i>&amp;</i> CLASSY
                </span>
                <span className="brand-subtitle">COLLECTIONS</span>
              </div>
            </div>
            <p className="admin-login-subline">Store Administration</p>
            <h1 id="adminLoginHeading" className="admin-login-title">
              Welcome back
            </h1>
            <div className="admin-login-divider" aria-hidden="true" />
          </div>

          {/* Form */}
          <form
            className="admin-stagger-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!password || busy) return;
              setError(null);
              setBusy(true);

              const ok = await login(password);
              setBusy(false);

              if (ok) {
                setIsSuccess(true);
                await new Promise((r) => setTimeout(r, 380));
                setPassword('');
              } else {
                setError('Incorrect password. Please try again.');
                setShake(true);
                setTimeout(() => setShake(false), 500);
              }
            }}
          >
            {error && (
              <div role="alert" id="adminLoginError" className="admin-login-error">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Password field with floating label & expanding underline */}
            <div
              className={`admin-floating-field ${
                isFocused || password ? 'active' : ''
              } ${error ? 'has-error' : ''}`}
            >
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="admin-floating-input"
                placeholder=" "
                aria-invalid={!!error}
                aria-describedby={error ? 'adminLoginError' : undefined}
              />
              <label htmlFor="adminPassword" className="admin-floating-label">
                Store password
              </label>

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>

              <span className="admin-floating-line" aria-hidden="true" />
            </div>

            {/* Submit Button with Hover Shine & Loading State */}
            <button
              className="admin-login-submit-btn admin-stagger-3"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="admin-login-spinner" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note & back link */}
          <div className="admin-login-footer admin-stagger-4">
            <Link href="/" className="admin-login-back-link">
              ← Back to store
            </Link>
            <p className="admin-login-auth-note">
              Authorised personnel only
            </p>
          </div>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
