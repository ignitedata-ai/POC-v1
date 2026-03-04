/**
 * api.js
 *
 * API client for communicating with the backend Express server.
 * All template CRUD operations go through these functions.
 * The Vite dev server proxies /api requests to localhost:3001.
 */

// In Docker, the admin app is served at /admin/ so API calls go to /admin/api
// In dev, Vite proxies /api to localhost:3001
const basePath = import.meta.env.BASE_URL || '/';
const BASE_URL = `${basePath}api`.replace('//', '/');

/**
 * Fetch the list of all templates (id, f_tag, title, updated_at).
 */
export async function fetchTemplates() {
  const response = await fetch(`${BASE_URL}/templates`);
  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch a single template by its numeric ID.
 * Returns { template, version } with full content_json and field_schema_json.
 */
export async function fetchTemplate(id) {
  const response = await fetch(`${BASE_URL}/templates/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch template ${id}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Create a new template.
 * @param {Object} data - { f_tag, title, content_json }
 */
export async function createTemplate(data) {
  const response = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create template: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Update an existing template by its numeric ID.
 * @param {number} id - The template ID
 * @param {Object} data - { title?, content_json }
 */
export async function updateTemplate(id, data) {
  const response = await fetch(`${BASE_URL}/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update template: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch the generic template with F-Tag number and title substituted.
 * Used by "Create from Template" flow.
 * @param {string} fTagNumber - e.g., "600"
 * @param {string} title - e.g., "Infection Control"
 */
export async function fetchGenericTemplate(fTagNumber, title) {
  const params = new URLSearchParams({ fTagNumber, title });
  const response = await fetch(`${BASE_URL}/templates/generic?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch generic template: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Soft-delete a template by its numeric ID.
 * Sets deleted_at in the database; the template is excluded from all queries.
 * @param {number} id - The template ID
 */
export async function deleteTemplate(id) {
  const response = await fetch(`${BASE_URL}/templates/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete template: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Upload a PDF file and create a template from it.
 * @param {File} pdfFile - The PDF file object
 * @param {string} fTag - e.g., "F-600"
 * @param {string} title - e.g., "Infection Control"
 */
export async function uploadPdfTemplate(pdfFile, fTag, title) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  formData.append('f_tag', fTag);
  formData.append('title', title);

  const response = await fetch(`${BASE_URL}/templates/upload-pdf`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to upload PDF template: ${response.statusText}`);
  }
  return response.json();
}
