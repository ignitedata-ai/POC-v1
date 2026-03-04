/**
 * App.jsx
 *
 * Main application for the User App.
 * Page flow:
 *   Landing   → Upload/Resume
 *   Upload    → Extract F-Tags → Analyze → Dashboard
 *   Dashboard → POC Editor per F-Tag
 *   Dashboard → Export/Review
 */

import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage.jsx';
import SessionDashboard from './components/SessionDashboard.jsx';
import POCEditor from './components/POCEditor.jsx';
import ExportView from './components/ExportView.jsx';
import ReportHistory from './components/ReportHistory.jsx';

export default function App() {
  const [page, setPage] = useState('landing');
  const [sessionId, setSessionId] = useState(null);
  const [editingDeficiency, setEditingDeficiency] = useState(null);

  const goToLanding = useCallback(() => {
    setPage('landing');
    setSessionId(null);
    setEditingDeficiency(null);
  }, []);

  const goToDashboard = useCallback((sid) => {
    setSessionId(sid);
    setEditingDeficiency(null);
    setPage('dashboard');
  }, []);

  const goToEditor = useCallback((deficiency) => {
    setEditingDeficiency(deficiency);
    setPage('editor');
  }, []);

  const goToExport = useCallback(() => {
    setPage('export');
  }, []);

  const goToHistory = useCallback(() => {
    setPage('history');
    setEditingDeficiency(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <img src="/tcs-logo.png" alt="TCS Logo" className="app-header-logo" onClick={goToLanding} style={{ cursor: 'pointer' }} />
        <div className="app-header-brand">
          <h1 onClick={goToLanding} style={{ cursor: 'pointer' }}>Plan of Correction</h1>
          <span className="app-header-subtitle">
            {page === 'landing' && 'Upload CMS-2567 & Build Plans of Correction'}
            {page === 'dashboard' && 'Session Dashboard'}
            {page === 'editor' && `Editing POC — ${editingDeficiency?.fTag || ''}`}
            {page === 'export' && 'Review & Export'}
            {page === 'history' && 'Report History & Analytics'}
          </span>
        </div>
        {page !== 'landing' && (
          <button className="btn btn-secondary header-nav-btn" onClick={goToLanding}>
            Home
          </button>
        )}
      </header>

      <main className={`app-main ${page === 'editor' ? 'app-main-wide' : ''}`}>
        {page === 'landing' && (
          <LandingPage onSessionReady={goToDashboard} onHistory={goToHistory} />
        )}

        {page === 'history' && (
          <ReportHistory onViewSession={goToDashboard} onBack={goToLanding} />
        )}

        {page === 'dashboard' && sessionId && (
          <SessionDashboard
            sessionId={sessionId}
            onEditDeficiency={goToEditor}
            onExport={goToExport}
            onBack={goToLanding}
          />
        )}

        {page === 'editor' && editingDeficiency && sessionId && (
          <POCEditor
            deficiency={editingDeficiency}
            sessionId={sessionId}
            onBack={() => goToDashboard(sessionId)}
          />
        )}

        {page === 'export' && sessionId && (
          <ExportView
            sessionId={sessionId}
            onBack={() => goToDashboard(sessionId)}
          />
        )}
      </main>
    </div>
  );
}
