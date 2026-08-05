/**
 * REST API client functions for fetching activity history, stats, and search.
 * Automatically attaches User Sync Key for isolated per-user queries.
 */

const API_BASE = '/api/v1/activity';

function getHeaders() {
  const headers = {};
  const savedKey = localStorage.getItem('userKey');
  if (savedKey) {
    headers['X-User-Key'] = savedKey;
  }
  return headers;
}

function appendUserKeyParam(params) {
  const savedKey = localStorage.getItem('userKey');
  if (savedKey) {
    params.append('user_key', savedKey);
  }
}

/**
 * Fetch paginated activity logs.
 */
export async function fetchActivityHistory({ page = 1, limit = 20, domain = null, category = null } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (domain) params.append('domain', domain);
  if (category) params.append('category', category);
  appendUserKeyParam(params);

  const res = await fetch(`${API_BASE}/history?${params.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

/**
 * Fetch aggregated analytics stats.
 */
export async function fetchActivityStats(days = 7) {
  const params = new URLSearchParams({ days });
  appendUserKeyParam(params);

  const res = await fetch(`${API_BASE}/stats?${params.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

/**
 * Search activity logs by query string.
 */
export async function searchActivities(query) {
  const params = new URLSearchParams({ query });
  appendUserKeyParam(params);

  const res = await fetch(`${API_BASE}/search?${params.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}
