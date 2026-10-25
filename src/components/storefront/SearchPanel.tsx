'use client';

import { useRef, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';

export default function SearchPanel() {
  const { state, dispatch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.searchOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      dispatch({ type: 'CLOSE_SEARCH' });
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'Escape') dispatch({ type: 'CLOSE_SEARCH' });
  };

  return (
    <div
      className={`search-panel${state.searchOpen ? ' open' : ''}`}
      id="searchPanel"
      aria-hidden={!state.searchOpen}
    >
      <div className="search-panel-inner">
        <svg viewBox="0 0 24 24" className="search-large" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          ref={inputRef}
          id="globalSearch"
          type="search"
          placeholder="Search earrings, necklaces, sunglasses…"
          aria-label="Search products"
          value={state.searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          onKeyDown={handleKeyDown}
        />
        <button
          id="searchClose"
          className="icon-button"
          aria-label="Close search"
          onClick={() => dispatch({ type: 'CLOSE_SEARCH' })}
        >
          ✕
        </button>
      </div>
      <p>Find your finishing touch.</p>
    </div>
  );
}
