/**
 * UploadSection.jsx
 *
 * Upload area with drag-and-drop PDF upload and a text paste fallback.
 * Calls the parent's onExtract callback with the API response.
 */

import React, { useState, useRef } from 'react';
import { uploadPdf, extractFromText } from '../services/api.js';

export default function UploadSection({ onExtract, loading, setLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await uploadPdf(file);
      onExtract(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaste() {
    if (!pasteText.trim()) {
      setError('Please enter some text.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await extractFromText(pasteText);
      onExtract(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  return (
    <div className="upload-section">
      <h2>Upload CMS-2567 Report</h2>
      <p className="upload-description">
        Upload a CMS-2567 Statement of Deficiencies (PDF) to automatically extract all cited F-Tags.
      </p>

      {!pasteMode ? (
        <>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${loading ? 'disabled' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileRef.current?.click()}
          >
            <div className="drop-zone-icon">{loading ? '\u23F3' : '\uD83D\uDCC4'}</div>
            <div className="drop-zone-text">
              {loading ? 'Analyzing your document...' : 'Drag & drop your CMS-2567 PDF here'}
            </div>
            <div className="drop-zone-hint">
              {loading ? 'Extracting F-Tags from left column' : 'or click to browse \u00B7 PDF files only \u00B7 max 20MB'}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <button
            className="paste-toggle"
            onClick={() => setPasteMode(true)}
            disabled={loading}
          >
            Or paste text manually
          </button>
        </>
      ) : (
        <div className="paste-section">
          <textarea
            className="paste-textarea"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste CMS-2567 text here..."
            rows={8}
            disabled={loading}
          />
          <div className="paste-actions">
            <button
              className="btn btn-primary"
              onClick={handlePaste}
              disabled={loading || !pasteText.trim()}
            >
              {loading ? 'Extracting...' : 'Extract F-Tags'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setPasteMode(false); setPasteText(''); setError(null); }}
              disabled={loading}
            >
              Back to Upload
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
