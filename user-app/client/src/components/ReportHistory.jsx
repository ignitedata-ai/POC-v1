/**
 * ReportHistory.jsx
 *
 * Historical dashboard showing all past CMS-2567 reports with analytics.
 * Features:
 *   - Summary stat cards with animated counters
 *   - Completion rate donut chart (SVG)
 *   - F-Tag frequency bar chart with staggered animations
 *   - Severity breakdown
 *   - Sortable/filterable reports table with actions (view, download PDF)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchSessionHistory, downloadExportPdf } from '../services/api.js';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

/** Animated counter hook */
function useAnimatedCount(target, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/** SVG Donut Chart */
function DonutChart({ percentage, size = 120, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const color = percentage >= 80 ? '#059669' : percentage >= 50 ? '#4F46E5' : '#D97706';

  return (
    <svg width={size} height={size} className="donut-chart">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        className="donut-text" fill={color}>
        {percentage}%
      </text>
    </svg>
  );
}

export default function ReportHistory({ onViewSession, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [downloadingId, setDownloadingId] = useState(null);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    fetchSessionHistory()
      .then((d) => { setData(d); setTimeout(() => setBarsVisible(true), 200); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filteredSessions = useMemo(() => {
    if (!data) return [];
    let list = data.sessions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.facilityName || '').toLowerCase().includes(q) ||
          (s.fileName || '').toLowerCase().includes(q) ||
          s.fTags.some((t) => t.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'facilityName' || sortKey === 'fileName') {
        av = (av || '').toLowerCase();
        bv = (bv || '').toLowerCase();
      }
      if (sortKey === 'deficiencyCount' || sortKey === 'completedCount') {
        av = av || 0;
        bv = bv || 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, search, sortKey, sortDir]);

  // Severity breakdown
  const severityBreakdown = useMemo(() => {
    if (!data) return [];
    const counts = {};
    data.sessions.forEach((s) => {
      s.severities.forEach((sev) => {
        counts[sev] = (counts[sev] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  async function handleDownload(e, sessionId) {
    e.stopPropagation();
    setDownloadingId(sessionId);
    try {
      await downloadExportPdf(sessionId);
    } catch (err) {
      alert('PDF download failed: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  const animatedReports = useAnimatedCount(data?.analytics?.totalReports || 0);
  const animatedFTags = useAnimatedCount(data?.analytics?.totalFTags || 0);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading report history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-message">{error}</div>
        <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  if (!data) return null;

  const { analytics } = data;
  const topFTags = analytics.ftagFrequency.slice(0, 10);
  const maxCount = topFTags.length > 0 ? topFTags[0].count : 1;

  const SEVERITY_COLORS = {
    'D': { bg: '#FEF3C7', color: '#92400E', label: 'D - No actual harm, potential for more than minimal harm' },
    'E': { bg: '#FED7AA', color: '#9A3412', label: 'E - No actual harm, potential for more than minimal harm' },
    'F': { bg: '#FECACA', color: '#991B1B', label: 'F - No actual harm, widespread' },
    'G': { bg: '#FCA5A5', color: '#7F1D1D', label: 'G - Actual harm' },
    'J': { bg: '#F87171', color: '#FFFFFF', label: 'J - Immediate jeopardy' },
  };

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-page-header">
        <div>
          <h2>Report History</h2>
          <p className="history-page-subtitle">Overview of all CMS-2567 reports and analytics</p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>{'\u2190'} Back to Home</button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="history-stats">
        <div className="stat-card stat-card-animate" style={{ animationDelay: '0s' }}>
          <div className="stat-card-icon">{'\uD83D\uDCCB'}</div>
          <div className="stat-card-value">{animatedReports}</div>
          <div className="stat-card-label">Total Reports</div>
        </div>
        <div className="stat-card stat-card-animate" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card-icon">{'\uD83C\uDFF7\uFE0F'}</div>
          <div className="stat-card-value">{animatedFTags}</div>
          <div className="stat-card-label">F-Tags Identified</div>
        </div>
        <div className="stat-card stat-card-donut stat-card-animate" style={{ animationDelay: '0.2s' }}>
          <DonutChart percentage={analytics.completionRate} size={100} strokeWidth={10} />
          <div className="stat-card-label">Completion Rate</div>
        </div>
        <div className="stat-card stat-card-animate" style={{ animationDelay: '0.3s' }}>
          <div className="stat-card-icon">{'\uD83D\uDD25'}</div>
          <div className="stat-card-value stat-card-ftag">{analytics.mostCommonFTag || 'N/A'}</div>
          <div className="stat-card-label">Most Common F-Tag</div>
        </div>
      </div>

      {/* Charts row: F-Tag Frequency + Severity Breakdown */}
      <div className="history-charts-row">
        {/* F-Tag Frequency Chart */}
        {topFTags.length > 0 && (
          <div className="history-chart-section history-chart-wide">
            <h3>F-Tag Frequency</h3>
            <div className="history-chart">
              {topFTags.map(({ tag, count }, idx) => (
                <div key={tag} className="chart-row">
                  <span className="chart-label">{tag}</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: barsVisible ? `${(count / maxCount) * 100}%` : '0%',
                        transitionDelay: `${idx * 80}ms`,
                      }}
                    />
                  </div>
                  <span className="chart-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Severity Breakdown */}
        {severityBreakdown.length > 0 && (
          <div className="history-chart-section history-chart-narrow">
            <h3>Severity Levels</h3>
            <div className="severity-list">
              {severityBreakdown.map(({ label, count }) => {
                const sev = SEVERITY_COLORS[label] || { bg: '#F1F5F9', color: '#475569', label };
                return (
                  <div key={label} className="severity-row">
                    <span className="severity-badge" style={{ background: sev.bg, color: sev.color }}>
                      {label}
                    </span>
                    <span className="severity-desc">{sev.label}</span>
                    <span className="severity-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search & Table */}
      <div className="history-table-section">
        <div className="history-table-header">
          <h3>All Reports ({filteredSessions.length})</h3>
          <input
            type="text"
            className="history-search"
            placeholder="Search by facility, file, or F-Tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredSessions.length === 0 ? (
          <div className="history-empty">
            {search ? 'No reports match your search.' : 'No reports yet. Upload a CMS-2567 to get started.'}
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('facilityName')} className="sortable">
                    Facility {sortKey === 'facilityName' && (sortDir === 'asc' ? '\u25B2' : '\u25BC')}
                  </th>
                  <th onClick={() => handleSort('fileName')} className="sortable">
                    File {sortKey === 'fileName' && (sortDir === 'asc' ? '\u25B2' : '\u25BC')}
                  </th>
                  <th onClick={() => handleSort('dateSurveyCompleted')} className="sortable">
                    Survey Date {sortKey === 'dateSurveyCompleted' && (sortDir === 'asc' ? '\u25B2' : '\u25BC')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Uploaded {sortKey === 'createdAt' && (sortDir === 'asc' ? '\u25B2' : '\u25BC')}
                  </th>
                  <th>F-Tags</th>
                  <th onClick={() => handleSort('deficiencyCount')} className="sortable">
                    Progress {sortKey === 'deficiencyCount' && (sortDir === 'asc' ? '\u25B2' : '\u25BC')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s, idx) => {
                  const pct = s.deficiencyCount > 0 ? Math.round((s.completedCount / s.deficiencyCount) * 100) : 0;
                  const allComplete = s.completedCount === s.deficiencyCount && s.deficiencyCount > 0;
                  return (
                    <tr key={s.id} onClick={() => onViewSession(s.id)}
                      className="table-row-animate"
                      style={{ animationDelay: `${idx * 50}ms` }}>
                      <td className="td-facility">{s.facilityName || '\u2014'}</td>
                      <td className="td-file">{s.fileName}</td>
                      <td>{s.dateSurveyCompleted || '\u2014'}</td>
                      <td>{timeAgo(s.createdAt)}</td>
                      <td className="td-ftags">
                        {s.fTags.map((t) => (
                          <span key={t} className="ftag-chip">{t}</span>
                        ))}
                      </td>
                      <td className="td-progress">
                        <div className="table-progress-bar">
                          <div
                            className={`table-progress-fill ${allComplete ? 'complete' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="table-progress-label">{s.completedCount}/{s.deficiencyCount}</span>
                      </td>
                      <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onViewSession(s.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => handleDownload(e, s.id)}
                          disabled={downloadingId === s.id}
                        >
                          {downloadingId === s.id ? '...' : '\u2B07 PDF'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
