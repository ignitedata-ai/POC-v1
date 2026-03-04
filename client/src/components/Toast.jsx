/**
 * Toast.jsx
 *
 * Simple toast notification component for success/error messages.
 * Auto-dismisses after a configurable duration.
 */

import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span className="toast-message">{message}</span>
      <button className="toast-close">&times;</button>
    </div>
  );
}
