/**
 * ExportView.jsx
 *
 * Review and export POC content for a session.
 * Features:
 *   - Editable header fields (facility name, address, CLIA ID, etc.)
 *   - Read-only POC text preview per F-Tag
 *   - "Download CMS-2567 PDF" button that generates a filled-in PDF
 *   - "Copy All to Clipboard" for plain text fallback
 */

import React, { useState, useEffect } from 'react';
import {
  exportSession,
  fetchSession,
  downloadExportPdf,
  updateSessionHeader,
} from '../services/api.js';

const HEADER_FIELD_DEFS = [
  { key: 'facilityName', label: 'Facility Name' },
  { key: 'facilityAddress', label: 'Facility Address' },
  { key: 'providerNumber', label: 'Provider/CLIA ID Number' },
  { key: 'dateSurveyCompleted', label: 'Date Survey Completed' },
  { key: 'building', label: 'Building' },
  { key: 'wing', label: 'Wing' },
  { key: 'accreditingOrg', label: 'Accrediting Organization' },
];

export default function ExportView({ sessionId, onBack }) {
  const [data, setData] = useState(null);
  const [header, setHeader] = useState({});
  const [headerDirty, setHeaderDirty] = useState(false);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerSaved, setHeaderSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [exportData, sessionData] = await Promise.all([
          exportSession(sessionId),
          fetchSession(sessionId),
        ]);
        setData(exportData);
        setHeader(sessionData.session.header || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  function handleHeaderChange(key, value) {
    setHeader((prev) => ({ ...prev, [key]: value }));
    setHeaderDirty(true);
    setHeaderSaved(false);
  }

  async function handleSaveHeader() {
    setHeaderSaving(true);
    try {
      await updateSessionHeader(sessionId, header);
      setHeaderDirty(false);
      setHeaderSaved(true);
      setTimeout(() => setHeaderSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setHeaderSaving(false);
    }
  }

  async function handleCopy(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  async function handleDownloadPdf() {
    setPdfLoading(true);
    setError(null);
    try {
      if (headerDirty) {
        await updateSessionHeader(sessionId, header);
        setHeaderDirty(false);
      }
      await downloadExportPdf(sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Preparing export...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-error">
        <p className="error-message">{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="export-view">
      <div className="export-header">
        <div>
          <h2>Review & Export</h2>
          <p className="export-meta">
            {'\uD83D\uDCC4'} {data.fileName}
            {' \u00B7 '}{data.sections.length} F-Tag{data.sections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="export-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            {'\u2190'} Back to Dashboard
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleCopy(data.fullText, 'all')}
          >
            {copiedId === 'all' ? '\u2713 Copied!' : 'Copy All to Clipboard'}
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating PDF...' : '\u2B07 Download POC'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Header fields editor */}
      <div className="export-header-editor">
        <div className="export-header-editor-title">
          <h3>CMS-2567 Header Fields</h3>
          <span className="export-header-hint">
            These fields will appear in the header of the generated PDF. Edit as needed.
          </span>
        </div>
        <div className="header-fields-grid">
          {HEADER_FIELD_DEFS.map((f) => (
            <div key={f.key} className={`header-field ${f.key === 'facilityAddress' || f.key === 'accreditingOrg' ? 'header-field-wide' : ''}`}>
              <label>{f.label}</label>
              <input
                type="text"
                value={header[f.key] || ''}
                onChange={(e) => handleHeaderChange(f.key, e.target.value)}
                placeholder={`Enter ${f.label.toLowerCase()}...`}
              />
            </div>
          ))}
        </div>
        <div className="header-field-actions">
          {headerDirty && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSaveHeader}
              disabled={headerSaving}
            >
              {headerSaving ? 'Saving...' : 'Save Header'}
            </button>
          )}
          {headerSaved && (
            <span className="save-indicator saved">{'\u2713'} Header saved</span>
          )}
        </div>
      </div>

      <div className="disclaimer-banner">
        <strong>Disclaimer:</strong> AI-generated content is provided as guidance only.
        Carefully review and customize all Plans of Correction before submitting to CMS.
      </div>

      <div className="export-sections">
        {data.sections.map((section) => (
          <div key={section.fTag} className="export-section">
            <div className="export-section-header">
              <div className="export-section-ftag">
                <span className="export-ftag-badge">{section.fTag}</span>
                <span className={`export-status-badge status-${section.status}`}>
                  {section.status === 'complete' ? '\u2713 Complete' : section.status === 'drafting' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopy(section.text, section.fTag)}
              >
                {copiedId === section.fTag ? '\u2713 Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="export-section-text">{section.text}</pre>
          </div>
        ))}
      </div>

      <div className="export-footer">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Generating PDF...' : '\u2B07 Download POC'}
        </button>
        <p>
          The generated PDF uses the official CMS-2567 template with your POC content filled into the correct columns.
        </p>
      </div>
    </div>
  );
}
