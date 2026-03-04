/**
 * InsertPlaceholderModal.jsx
 *
 * Modal dialog for inserting a new placeholder node into the editor.
 * The user fills in: key, label, type, required, helpText, and options
 * (for select types). On submit, the placeholder is inserted at the
 * current cursor position in the TipTap editor.
 */

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const PLACEHOLDER_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-Select' },
];

const INITIAL_STATE = {
  key: '',
  label: '',
  type: 'text',
  required: false,
  helpText: '',
  options: '',
};

export default function InsertPlaceholderModal({ isOpen, onClose, onInsert }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const keyRef = useRef(null);

  // Focus the key field when modal opens
  useEffect(() => {
    if (isOpen && keyRef.current) {
      keyRef.current.focus();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_STATE);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.key.trim()) return;

    const parsedOptions =
      form.type === 'select' || form.type === 'multi_select'
        ? form.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];

    onInsert({
      id: uuidv4(),
      key: form.key.trim(),
      label: form.label.trim() || form.key.trim(),
      type: form.type,
      required: form.required,
      helpText: form.helpText.trim(),
      options: parsedOptions,
    });

    setForm(INITIAL_STATE);
    onClose();
  }

  // Auto-generate label from key if label is empty
  function handleKeyChange(value) {
    const newForm = { ...form, key: value };
    if (!form.label || form.label === keyToLabel(form.key)) {
      newForm.label = keyToLabel(value);
    }
    setForm(newForm);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Insert Placeholder</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="ph-key">
              Key <span className="required-star">*</span>
            </label>
            <input
              ref={keyRef}
              id="ph-key"
              type="text"
              value={form.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="e.g., completion_date"
              required
            />
            <span className="form-hint">Unique identifier (snake_case recommended)</span>
          </div>

          <div className="form-field">
            <label htmlFor="ph-label">Label</label>
            <input
              id="ph-label"
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g., Completion Date"
            />
            <span className="form-hint">Display name shown in the editor pill</span>
          </div>

          <div className="form-field">
            <label htmlFor="ph-type">Type</label>
            <select
              id="ph-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {PLACEHOLDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field form-field-checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm({ ...form, required: e.target.checked })}
              />
              Required field
            </label>
          </div>

          <div className="form-field">
            <label htmlFor="ph-help">Help Text</label>
            <input
              id="ph-help"
              type="text"
              value={form.helpText}
              onChange={(e) => setForm({ ...form, helpText: e.target.value })}
              placeholder="Optional guidance for the user filling this in"
            />
          </div>

          {(form.type === 'select' || form.type === 'multi_select') && (
            <div className="form-field">
              <label htmlFor="ph-options">Options (comma-separated)</label>
              <input
                id="ph-options"
                type="text"
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!form.key.trim()}>
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Convert a snake_case key to a Title Case label.
 * e.g., "completion_date" -> "Completion Date"
 */
function keyToLabel(key) {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
