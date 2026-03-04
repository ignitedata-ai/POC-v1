/**
 * FieldsPanel.jsx
 *
 * Right sidebar component that displays a live list of all unique
 * placeholders found in the current template document. Updates
 * automatically as placeholders are added or removed in the editor.
 */

import React from 'react';

const TYPE_LABELS = {
  text: 'Text',
  date: 'Date',
  number: 'Number',
  select: 'Select',
  multi_select: 'Multi-Select',
};

export default function FieldsPanel({ fields }) {
  if (!fields || fields.length === 0) {
    return (
      <div className="fields-panel">
        <div className="fields-panel-header">
          <h2>Fields</h2>
          <span className="field-count">0</span>
        </div>
        <div className="fields-panel-empty">
          No placeholders in this template. Use "Insert Placeholder" in the toolbar to add one.
        </div>
      </div>
    );
  }

  return (
    <div className="fields-panel">
      <div className="fields-panel-header">
        <h2>Fields</h2>
        <span className="field-count">{fields.length}</span>
      </div>
      <div className="fields-panel-list">
        {fields.map((field) => (
          <div key={field.key} className="field-card">
            <div className="field-card-header">
              <span className="field-label">{field.label}</span>
              {field.required && <span className="field-required-badge">Required</span>}
            </div>
            <div className="field-card-meta">
              <span className="field-key">{field.key}</span>
              <span className="field-type-badge">{TYPE_LABELS[field.type] || field.type}</span>
            </div>
            {field.helpText && (
              <div className="field-help-text">{field.helpText}</div>
            )}
            {field.options && field.options.length > 0 && (
              <div className="field-options">
                <span className="field-options-label">Options: </span>
                {field.options.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
