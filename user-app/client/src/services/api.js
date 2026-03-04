/**
 * api.js
 *
 * API client for the User App backend.
 * Vite proxies /api requests to localhost:3002.
 */

const BASE_URL = '/api';

// ---------------------------------------------------------------------------
// Existing: F-Tag extraction
// ---------------------------------------------------------------------------

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/2567/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function extractFromText(text) {
  const response = await fetch(`${BASE_URL}/2567/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Extraction failed');
  return data;
}

export async function fetchAdminTemplates() {
  const response = await fetch(`${BASE_URL}/admin/templates`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch admin templates');
  return data;
}

// ---------------------------------------------------------------------------
// New: POC module
// ---------------------------------------------------------------------------

export async function analyzeDeficiencies(fullText, tags, fileName) {
  const response = await fetch(`${BASE_URL}/2567/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullText, tags, fileName }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Analysis failed');
  return data;
}

export async function fetchSessions() {
  const response = await fetch(`${BASE_URL}/sessions`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch sessions');
  return data;
}

export async function fetchSession(sessionId) {
  const response = await fetch(`${BASE_URL}/sessions/${sessionId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch session');
  return data;
}

export async function deleteSession(sessionId) {
  const response = await fetch(`${BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete session');
  return data;
}

export async function generatePocDraft(deficiencyId) {
  const response = await fetch(`${BASE_URL}/poc/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deficiencyId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Draft generation failed');
  return data;
}

export async function generateStepDraft(deficiencyId, stepNumber) {
  const response = await fetch(`${BASE_URL}/poc/draft-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deficiencyId, stepNumber }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Step draft generation failed');
  return data;
}

export async function saveDeficiencyCompletionDate(deficiencyId, completionDate) {
  const response = await fetch(`${BASE_URL}/deficiencies/${deficiencyId}/completion-date`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completionDate }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to save completion date');
  return data;
}

export async function saveStep(stepId, { userContent, completionDate, status }) {
  const response = await fetch(`${BASE_URL}/poc/steps/${stepId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userContent, completionDate, status }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to save step');
  return data;
}

export async function exportSession(sessionId) {
  const response = await fetch(`${BASE_URL}/poc/export/${sessionId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Export failed');
  return data;
}

export async function fetchAdminTemplate(templateId) {
  const response = await fetch(`${BASE_URL}/admin/templates/${templateId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch template');
  return data;
}

export async function fetchTemplateGuidance(deficiencyId) {
  const response = await fetch(`${BASE_URL}/poc/template-guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deficiencyId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch template guidance');
  return data;
}

// ---------------------------------------------------------------------------
// AI Assist
// ---------------------------------------------------------------------------

export async function fetchAssistQuestions(deficiencyId, stepNumber) {
  const response = await fetch(`${BASE_URL}/poc/assist-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deficiencyId, stepNumber }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch assist questions');
  return data;
}

export async function generateAssistedDraft(deficiencyId, stepNumber, answers) {
  const response = await fetch(`${BASE_URL}/poc/assist-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deficiencyId, stepNumber, answers }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Assisted draft generation failed');
  return data;
}

// ---------------------------------------------------------------------------
// PDF Export
// ---------------------------------------------------------------------------

export async function downloadExportPdf(sessionId) {
  const response = await fetch(`${BASE_URL}/poc/export-pdf/${sessionId}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'PDF download failed');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CMS-2567-POC.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchSessionHistory() {
  const response = await fetch(`${BASE_URL}/sessions/history`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch history');
  return data;
}

export async function updateSessionHeader(sessionId, headerData) {
  const response = await fetch(`${BASE_URL}/sessions/${sessionId}/header`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(headerData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update header');
  return data;
}
