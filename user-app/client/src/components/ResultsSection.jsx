/**
 * ResultsSection.jsx
 *
 * Displays extracted F-Tags with occurrence counts, raw forms,
 * context snippets, and template availability from the admin API.
 * When multiple templates exist for a single F-Tag, shows a picker.
 */

import React, { useState } from 'react';

export default function ResultsSection({ result, adminTemplates, onContinue, onReset }) {
  const { fileName, textStats, tags } = result;

  // Build a map of F-Tag → array of templates for lookup
  const templateMap = {};
  for (const t of adminTemplates || []) {
    if (!templateMap[t.f_tag]) templateMap[t.f_tag] = [];
    templateMap[t.f_tag].push(t);
  }

  // Track user selections for F-Tags with multiple templates
  const [selections, setSelections] = useState({});

  function handleSelect(fTag, templateId) {
    setSelections((prev) => ({ ...prev, [fTag]: templateId }));
  }

  return (
    <div className="results-section">
      {/* Summary header */}
      <div className="results-header">
        <div>
          <h2>Extracted F-Tags</h2>
          <p className="results-meta">
            From: <strong>{fileName}</strong> &middot;{' '}
            {textStats.words.toLocaleString()} words &middot;{' '}
            {tags.length} unique F-Tag{tags.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="results-actions">
          <button className="btn btn-secondary" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      {/* No tags found */}
      {tags.length === 0 ? (
        <div className="no-tags">
          <p>No F-Tags were found in the uploaded document.</p>
          <p className="no-tags-hint">
            Ensure the document is a CMS-2567 Statement of Deficiencies with F-Tag citations.
          </p>
        </div>
      ) : (
        <>
          {/* Tag list */}
          <div className="tag-list">
            {tags.map((tag) => (
              <TagRow
                key={tag.normalized}
                tag={tag}
                templates={templateMap[tag.normalized] || []}
                adminLoaded={adminTemplates !== null}
                selectedTemplateId={selections[tag.normalized] || null}
                onSelectTemplate={(templateId) => handleSelect(tag.normalized, templateId)}
              />
            ))}
          </div>

          {/* Continue section */}
          <div className="continue-section">
            <div className="continue-summary">
              Identified: {tags.map((t) => t.normalized).join(', ')}
            </div>
            <button className="btn btn-primary btn-lg" onClick={onContinue}>
              Continue <span className="btn-arrow">&rarr;</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TagRow({ tag, templates, adminLoaded, selectedTemplateId, onSelectTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const hasTemplates = templates.length > 0;
  const hasMultiple = templates.length > 1;

  return (
    <div className="tag-row">
      <div className="tag-row-main">
        <div className="tag-row-left">
          <span className="tag-normalized">{tag.normalized}</span>
          <span className="tag-count">{tag.count} occurrence{tag.count !== 1 ? 's' : ''}</span>
          {adminLoaded && (
            <span className={`tag-availability ${hasTemplates ? 'available' : 'missing'}`}>
              {hasTemplates
                ? templates.length === 1
                  ? '\u2713 Template Available'
                  : `\u2713 ${templates.length} Templates`
                : '\u26A0 No Template'}
            </span>
          )}
        </div>
        <div className="tag-row-right">
          <span className={`tag-confidence confidence-${tag.confidence.toLowerCase()}`}>
            {tag.confidence}
          </span>
        </div>
      </div>

      <div className="tag-raw-forms">
        Forms found: {tag.rawForms.map((form, i) => (
          <code key={i} className="raw-form">{form}</code>
        ))}
      </div>

      {/* Template picker — only shown when multiple templates exist */}
      {hasMultiple && (
        <div className="template-picker">
          <p className="template-picker-label">Select a template:</p>
          <div className="template-picker-options">
            {templates.map((tpl) => (
              <label key={tpl.id} className="template-option">
                <input
                  type="radio"
                  name={`template-${tag.normalized}`}
                  value={tpl.id}
                  checked={selectedTemplateId === tpl.id}
                  onChange={() => onSelectTemplate(tpl.id)}
                />
                <span className="template-option-title">{tpl.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Show first context snippet, expandable for more */}
      <div className="tag-context">
        <div className="context-snippet">{tag.matches[0].context}</div>
        {tag.matches.length > 1 && (
          <>
            {expanded && tag.matches.slice(1).map((m, i) => (
              <div key={i} className="context-snippet">{m.context}</div>
            ))}
            <button
              className="context-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : `View all ${tag.matches.length} occurrences`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
