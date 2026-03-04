/**
 * LandingPage.jsx
 *
 * Entry point for the User App. Two sections:
 *   1. Upload a new CMS-2567 (PDF or paste) → extract F-Tags → analyze → go to dashboard
 *   2. Resume a previous session from the database
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  uploadPdf,
  extractFromText,
  fetchAdminTemplates,
  analyzeDeficiencies,
  fetchSessions,
  deleteSession,
} from '../services/api.js';

export default function LandingPage({ onSessionReady, onHistory }) {
  const [sessions, setSessions] = useState([]);
  const [adminTemplates, setAdminTemplates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    fetchSessions().then(setSessions).catch(() => {});
    fetchAdminTemplates().then(setAdminTemplates).catch(() => {});
  }, []);

  async function processExtraction(extractionPromise) {
    setError(null);
    setLoading(true);
    setStatusMsg('Extracting F-Tags...');

    try {
      const result = await extractionPromise;

      if (!result.tags || result.tags.length === 0) {
        setError('No F-Tags found in the document. Please ensure this is a CMS-2567.');
        setLoading(false);
        setStatusMsg('');
        return;
      }

      // Match tags to admin templates
      const templateMap = {};
      for (const t of adminTemplates || []) {
        if (!templateMap[t.f_tag]) templateMap[t.f_tag] = [];
        templateMap[t.f_tag].push(t);
      }

      const tagsWithTemplates = result.tags.map((tag) => {
        const matches = templateMap[tag.normalized] || [];
        return {
          ...tag,
          adminTemplateId: matches.length === 1 ? matches[0].id : null,
        };
      });

      setLoading(false);
      setAnalyzing(true);
      setStatusMsg('Analyzing deficiency narratives with AI...');

      const analyzeResult = await analyzeDeficiencies(
        result.fullText,
        tagsWithTemplates,
        result.fileName
      );

      setAnalyzing(false);
      setStatusMsg('');
      onSessionReady(analyzeResult.session.id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setAnalyzing(false);
      setStatusMsg('');
    }
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    await processExtraction(uploadPdf(file));
  }

  async function handlePaste() {
    if (!pasteText.trim()) {
      setError('Please enter some text.');
      return;
    }
    await processExtraction(extractFromText(pasteText));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleDeleteSession(e, sessionId) {
    e.stopPropagation();
    if (!confirm('Delete this session and all its POC drafts?')) return;
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err.message);
    }
  }

  const isProcessing = loading || analyzing;

  return (
    <div className="landing-page">
      {/* Upload section */}
      <div className="landing-upload">
        <h2>Upload CMS-2567 Report</h2>
        <p className="upload-description">
          Upload a CMS-2567 Statement of Deficiencies to extract F-Tags and build Plans of Correction with AI assistance.
        </p>

        {!pasteMode ? (
          <>
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${isProcessing ? 'disabled' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileRef.current?.click()}
            >
              <div className="drop-zone-icon">
                {isProcessing ? '\u23F3' : '\uD83D\uDCC4'}
              </div>
              <div className="drop-zone-text">
                {isProcessing ? statusMsg : 'Drag & drop your CMS-2567 PDF here'}
              </div>
              <div className="drop-zone-hint">
                {isProcessing
                  ? (analyzing ? 'This may take 15-30 seconds...' : 'Parsing document...')
                  : 'or click to browse \u00B7 PDF files only \u00B7 max 20MB'}
              </div>
              {isProcessing && <div className="processing-bar" />}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
            />
            <div className="paste-actions">
              <button
                className="btn btn-primary"
                onClick={handlePaste}
                disabled={isProcessing || !pasteText.trim()}
              >
                {isProcessing ? statusMsg : 'Extract & Analyze'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setPasteMode(false); setPasteText(''); setError(null); }}
                disabled={isProcessing}
              >
                Back to Upload
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Report History link */}
      {sessions.length > 0 && (
        <div className="landing-history-link">
          <a href="#" onClick={(e) => { e.preventDefault(); onHistory(); }} className="history-link">
            {'\uD83D\uDCCA'} View Report History & Analytics
            <span className="history-link-arrow">{'\u2192'}</span>
          </a>
        </div>
      )}

      {/* Previous sessions */}
      {sessions.length > 0 && (
        <div className="landing-sessions">
          <h3>Resume Previous Session</h3>
          <div className="session-list">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="session-card"
                onClick={() => onSessionReady(s.id)}
              >
                <div className="session-card-main">
                  <span className="session-card-icon">{'\uD83D\uDCC1'}</span>
                  <div className="session-card-info">
                    <span className="session-card-name">{s.fileName}</span>
                    <span className="session-card-meta">
                      {s.completedCount}/{s.deficiencyCount} F-Tags complete
                      {' \u00B7 '}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="session-card-actions">
                  <div className="session-card-progress">
                    <div
                      className="session-card-progress-fill"
                      style={{ width: `${s.deficiencyCount ? (s.completedCount / s.deficiencyCount) * 100 : 0}%` }}
                    />
                  </div>
                  <button
                    className="session-delete-btn"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    title="Delete session"
                  >
                    {'\u2715'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
