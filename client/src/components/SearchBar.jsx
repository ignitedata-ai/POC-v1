/**
 * SearchBar.jsx
 *
 * Search input for filtering the template list in real-time.
 * Matches against F-Tag code and title.
 */

import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search templates...' }) {
  return (
    <div className="search-bar">
      <span className="search-bar-icon">{'\u2315'}</span>
      <input
        type="text"
        className="search-bar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="search-bar-clear"
          onClick={() => onChange('')}
          title="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
}
