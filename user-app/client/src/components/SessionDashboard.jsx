/**
 * SessionDashboard.jsx
 *
 * Displays all F-Tag deficiencies from a session as a card grid.
 * Each card shows the F-Tag, a summary, status, and clicking opens the POC Editor.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { fetchSession } from '../services/api.js';

const STATUS_CONFIG = {
  pending: { label: 'Not Started', className: 'status-pending', icon: '\u25CB' },
  drafting: { label: 'In Progress', className: 'status-drafting', icon: '\u25D4' },
  complete: { label: 'Complete', className: 'status-complete', icon: '\u2713' },
};

export default function SessionDashboard({ sessionId, onEditDeficiency, onExport, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchSession(sessionId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p className="error-message">{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  if (!data) return null;

  const { session, deficiencies } = data;
  const total = deficiencies.length;
  const complete = deficiencies.filter((d) => d.status === 'complete').length;
  const allComplete = total > 0 && complete === total;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Session Dashboard</h2>
          <p className="dashboard-meta">
            {'\uD83D\uDCC4'} {session.fileName}
            {' \u00B7 '}{total} F-Tag{total !== 1 ? 's' : ''}
            {' \u00B7 '}{complete}/{total} complete
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            {'\u2190'} Back
          </button>
          <button
            className={`btn ${allComplete ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onExport}
          >
            {allComplete ? 'Export All' : 'Preview Export'}
            {' \u2192'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="dashboard-progress">
        <div className="dashboard-progress-bar">
          <div
            className="dashboard-progress-fill"
            style={{ width: `${total ? (complete / total) * 100 : 0}%` }}
          />
        </div>
        <span className="dashboard-progress-label">
          {total ? Math.round((complete / total) * 100) : 0}% complete
        </span>
      </div>

      {/* Deficiency cards */}
      <div className="deficiency-grid">
        {deficiencies.map((def, idx) => {
          const statusInfo = STATUS_CONFIG[def.status] || STATUS_CONFIG.pending;
          const stepsComplete = def.steps.filter((s) => s.status === 'completed').length;
          const narrativePreview = def.narrative
            ? def.narrative.slice(0, 150) + (def.narrative.length > 150 ? '...' : '')
            : 'No narrative extracted';

          return (
            <div
              key={def.id}
              className={`deficiency-card ${statusInfo.className}`}
              onClick={() => onEditDeficiency(def)}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="deficiency-card-top">
                <span className="deficiency-ftag">{def.fTag}</span>
                <span className={`deficiency-status ${statusInfo.className}`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
              </div>

              {def.severity && (
                <div className="deficiency-severity">
                  Severity: {def.severity}
                  {def.scope && ` \u00B7 ${def.scope}`}
                </div>
              )}

              <p className="deficiency-narrative-preview">{narrativePreview}</p>

              <div className="deficiency-card-footer">
                <div className="deficiency-steps-progress">
                  <div className="mini-progress">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`mini-progress-dot ${
                          def.steps[i]?.status === 'completed'
                            ? 'dot-complete'
                            : def.steps[i]?.status === 'in_progress'
                            ? 'dot-active'
                            : 'dot-pending'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="deficiency-steps-label">{stepsComplete}/4 steps</span>
                </div>
                <span className="deficiency-card-arrow">{'\u2192'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Disclaimer */}
      <div className="disclaimer-banner">
        <strong>Disclaimer:</strong> AI-generated suggestions are provided as guidance only.
        Review and customize all content for your facility's specific circumstances before submission.
      </div>
    </div>
  );
}
