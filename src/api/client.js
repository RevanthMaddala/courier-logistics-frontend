// Thin fetch wrapper around the Spring Boot API. Errors carry the backend's ErrorResponse body.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
    // { fieldName: message } for showing validation errors next to inputs
    this.fieldErrors = Object.fromEntries((body?.fieldErrors || []).map((e) => [e.field, e.message]));
  }
}

function toQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request(method, path, { body, params } = {}) {
  let response;
  try {
    response = await fetch(BASE_URL + path + toQuery(params), {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: 'Cannot reach the server. Is the backend running?' });
  }

  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? safeJson(text) : null;
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body, params) => request('POST', path, { body, params }),
  put: (path, body, params) => request('PUT', path, { body, params }),
  patch: (path, body, params) => request('PATCH', path, { body, params }),
  del: (path) => request('DELETE', path),
};
