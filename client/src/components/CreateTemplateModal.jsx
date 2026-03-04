/**
 * CreateTemplateModal.jsx
 *
 * Unified modal for all 4 template creation flows:
 *   - upload-pdf: File picker + F-Tag code + title
 *   - from-template: F-Tag code + title (loads generic template)
 *   - duplicate: Searchable dropdown of existing templates + F-Tag code + title
 *   - blank: F-Tag code + title only
 *
 * Each flow collects the required inputs, then delegates to the parent
 * via onSubmit callback with the flow type and form data.
 */

import React, { useState, useRef, useEffect } from 'react';

const FLOW_CONFIG = {
  'upload-pdf': {
    title: 'Upload PDF',
    description: 'Import an F-Tag correction packet from a PDF document.',
    showFileUpload: true,
  },
  'from-template': {
    title: 'Create from Template',
    description: 'Start with the standard F-Tag correction packet template. The F-Tag number and title will be auto-filled throughout.',
    showFileUpload: false,
  },
  'duplicate': {
    title: 'Duplicate from Existing',
    description: 'Create a new template by copying an existing one.',
    showDuplicateSelector: true,
  },
  'blank': {
    title: 'Create Blank',
    description: 'Start with an empty document.',
    showFileUpload: false,
  },
};

export default function CreateTemplateModal({
  isOpen,
  flowType,
  onClose,
  onSubmit,
  templates,
  submitting,
}) {
  const [fTagNumber, setFTagNumber] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [duplicateFromId, setDuplicateFromId] = useState(null);
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [showDuplicateDropdown, setShowDuplicateDropdown] = useState(false);
  const fTagRef = useRef(null);
  const fileRef = useRef(null);
  const dropdownRef = useRef(null);

  const config = FLOW_CONFIG[flowType] || {};

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFTagNumber('');
      setTemplateTitle('');
      setPdfFile(null);
      setDuplicateFromId(null);
      setDuplicateSearch('');
      setShowDuplicateDropdown(false);
      // Focus the F-Tag input after a brief delay (for render)
      setTimeout(() => fTagRef.current?.focus(), 100);
    }
  }, [isOpen, flowType]);

  // Close duplicate dropdown on outside click
  useEffect(() => {
    if (!showDuplicateDropdown) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDuplicateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDuplicateDropdown]);

  if (!isOpen || !flowType) return null;

  // Filter templates for duplicate search
  const filteredTemplates = templates.filter((t) => {
    const query = duplicateSearch.toLowerCase();
    return (
      t.f_tag.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query)
    );
  });

  // Find the selected duplicate template for display
  const selectedDuplicate = templates.find((t) => t.id === duplicateFromId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!fTagNumber.trim() || !templateTitle.trim()) return;
    if (flowType === 'upload-pdf' && !pdfFile) return;
    if (flowType === 'duplicate' && !duplicateFromId) return;

    const fTag = `F-${fTagNumber.trim()}`;
    onSubmit({
      flowType,
      fTag,
      fTagNumber: fTagNumber.trim(),
      title: templateTitle.trim(),
      pdfFile,
      duplicateFromId,
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      alert('Please select a PDF file.');
      e.target.value = '';
    }
  }

  function handleSelectDuplicate(templateId) {
    setDuplicateFromId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setDuplicateSearch(tmpl.f_tag + ' - ' + tmpl.title);
    }
    setShowDuplicateDropdown(false);
  }

  const isValid =
    fTagNumber.trim() &&
    templateTitle.trim() &&
    (flowType !== 'upload-pdf' || pdfFile) &&
    (flowType !== 'duplicate' || duplicateFromId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-create" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{config.title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-description">{config.description}</p>

        <form onSubmit={handleSubmit}>
          {/* PDF file upload (only for upload-pdf flow) */}
          {config.showFileUpload && (
            <div className="form-field">
              <label htmlFor="pdf-file">
                PDF Document <span className="required-star">*</span>
              </label>
              <div
                className={`file-upload-area ${pdfFile ? 'has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {pdfFile ? (
                  <div className="file-upload-selected">
                    <span className="file-upload-name">{pdfFile.name}</span>
                    <span className="file-upload-size">
                      {(pdfFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <div className="file-upload-placeholder">
                    <span className="file-upload-icon">{'\u2191'}</span>
                    <span>Click to select a PDF file</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Duplicate source selector (only for duplicate flow) */}
          {config.showDuplicateSelector && (
            <div className="form-field" ref={dropdownRef}>
              <label>
                Source Template <span className="required-star">*</span>
              </label>
              <div className="duplicate-selector">
                <input
                  type="text"
                  className="duplicate-search-input"
                  value={duplicateSearch}
                  onChange={(e) => {
                    setDuplicateSearch(e.target.value);
                    setShowDuplicateDropdown(true);
                    if (!e.target.value) setDuplicateFromId(null);
                  }}
                  onFocus={() => setShowDuplicateDropdown(true)}
                  placeholder="Search for an F-Tag..."
                />
                {showDuplicateDropdown && (
                  <div className="duplicate-dropdown">
                    {filteredTemplates.length === 0 ? (
                      <div className="duplicate-dropdown-empty">No templates found</div>
                    ) : (
                      filteredTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`duplicate-dropdown-item ${
                            duplicateFromId === t.id ? 'selected' : ''
                          }`}
                          onClick={() => handleSelectDuplicate(t.id)}
                        >
                          <span className="duplicate-dropdown-ftag">{t.f_tag}</span>
                          <span className="duplicate-dropdown-title">{t.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedDuplicate && (
                <span className="form-hint">
                  Will duplicate content from: {selectedDuplicate.f_tag} - {selectedDuplicate.title}
                </span>
              )}
            </div>
          )}

          {/* F-Tag Number */}
          <div className="form-field">
            <label htmlFor="ftag-number">
              F-Tag Number <span className="required-star">*</span>
            </label>
            <div className="ftag-input-wrapper">
              <span className="ftag-input-prefix">F-</span>
              <input
                ref={fTagRef}
                id="ftag-number"
                type="text"
                value={fTagNumber}
                onChange={(e) => setFTagNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g., 600"
                maxLength={4}
                required
              />
            </div>
            <span className="form-hint">The numeric F-Tag identifier (e.g., 600 for F-600)</span>
          </div>

          {/* Title */}
          <div className="form-field">
            <label htmlFor="template-title">
              Title <span className="required-star">*</span>
            </label>
            <input
              id="template-title"
              type="text"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              placeholder="e.g., Infection Control"
              required
            />
            <span className="form-hint">Descriptive title for this F-Tag template</span>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || submitting}
            >
              {submitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
