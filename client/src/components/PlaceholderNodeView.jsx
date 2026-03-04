/**
 * PlaceholderNodeView.jsx
 *
 * React component rendered inside the TipTap editor for each placeholder node.
 * Displays as a colored pill with the placeholder label. Clicking opens an
 * edit popover (rendered via Portal outside the editor DOM) to modify
 * the placeholder's metadata or delete it.
 *
 * The Portal approach is essential because rendering form inputs inside
 * TipTap's contentEditable DOM causes browsers to interfere with focus,
 * click, and keyboard events — making inputs unusable.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NodeViewWrapper } from '@tiptap/react';

const PLACEHOLDER_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-Select' },
];

export default function PlaceholderNodeView({ node, updateAttributes, deleteNode }) {
  const [showPopover, setShowPopover] = useState(false);
  const [editState, setEditState] = useState({});
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);
  const pillRef = useRef(null);

  const { label, key, type, required, helpText, options } = node.attrs;

  // Initialize edit state and position when popover opens
  useEffect(() => {
    if (showPopover) {
      setEditState({
        label: label || '',
        key: key || '',
        type: type || 'text',
        required: required || false,
        helpText: helpText || '',
        options: Array.isArray(options) ? options.join(', ') : '',
      });

      // Position the popover below the pill
      if (pillRef.current) {
        const rect = pillRef.current.getBoundingClientRect();
        setPopoverPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    }
  }, [showPopover, label, key, type, required, helpText, options]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showPopover) return;

    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        pillRef.current &&
        !pillRef.current.contains(event.target)
      ) {
        setShowPopover(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!showPopover || !pillRef.current) return;

    function updatePosition() {
      if (pillRef.current) {
        const rect = pillRef.current.getBoundingClientRect();
        setPopoverPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    }

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showPopover]);

  function handleSave() {
    const parsedOptions =
      editState.type === 'select' || editState.type === 'multi_select'
        ? editState.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];

    updateAttributes({
      label: editState.label,
      key: editState.key,
      type: editState.type,
      required: editState.required,
      helpText: editState.helpText,
      options: parsedOptions,
    });
    setShowPopover(false);
  }

  function handleDelete() {
    setShowPopover(false);
    deleteNode();
  }

  // The popover rendered via Portal — completely outside the editor DOM
  const popoverElement = showPopover
    ? createPortal(
        <div
          ref={popoverRef}
          className="placeholder-popover-portal"
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 1000,
          }}
        >
          <div className="popover-header">
            <h4>Edit Placeholder</h4>
            <button className="popover-close" onClick={() => setShowPopover(false)}>
              &times;
            </button>
          </div>

          <div className="popover-field">
            <label>Label</label>
            <input
              type="text"
              value={editState.label}
              onChange={(e) => setEditState({ ...editState, label: e.target.value })}
            />
          </div>

          <div className="popover-field">
            <label>Key</label>
            <input
              type="text"
              value={editState.key}
              onChange={(e) => setEditState({ ...editState, key: e.target.value })}
            />
          </div>

          <div className="popover-field">
            <label>Type</label>
            <select
              value={editState.type}
              onChange={(e) => setEditState({ ...editState, type: e.target.value })}
            >
              {PLACEHOLDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="popover-field popover-field-checkbox">
            <label>
              <input
                type="checkbox"
                checked={editState.required}
                onChange={(e) =>
                  setEditState({ ...editState, required: e.target.checked })
                }
              />
              Required
            </label>
          </div>

          <div className="popover-field">
            <label>Help Text</label>
            <input
              type="text"
              value={editState.helpText}
              onChange={(e) => setEditState({ ...editState, helpText: e.target.value })}
              placeholder="Optional help text"
            />
          </div>

          {(editState.type === 'select' || editState.type === 'multi_select') && (
            <div className="popover-field">
              <label>Options (comma-separated)</label>
              <input
                type="text"
                value={editState.options}
                onChange={(e) => setEditState({ ...editState, options: e.target.value })}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          <div className="popover-actions">
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <NodeViewWrapper as="span" className="placeholder-node-wrapper">
      <span
        ref={pillRef}
        className={`placeholder-pill ${required ? 'required' : ''}`}
        onClick={() => setShowPopover(!showPopover)}
        title={helpText || `${key} (${type})`}
        contentEditable={false}
      >
        {label || key}
      </span>
      {popoverElement}
    </NodeViewWrapper>
  );
}
