/**
 * TemplateList.jsx
 *
 * Left sidebar component that displays a list of all F-Tag templates.
 * Clicking a template loads it into the editor. The currently selected
 * template is highlighted.
 */

import React from 'react';

export default function TemplateList({ templates, selectedId, onSelect, loading }) {
  return (
    <div className="template-list">
      <div className="template-list-header">
        <h2>Templates</h2>
      </div>
      <div className="template-list-items">
        {loading ? (
          <div className="template-list-loading">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="template-list-empty">No templates found</div>
        ) : (
          templates.map((template) => (
            <button
              key={template.id}
              className={`template-list-item ${
                selectedId === template.id ? 'selected' : ''
              }`}
              onClick={() => onSelect(template.id)}
            >
              <span className="template-ftag">{template.f_tag}</span>
              <span className="template-title">{template.title}</span>
              {template.updated_at && (
                <span className="template-updated">
                  {new Date(template.updated_at).toLocaleDateString()}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
