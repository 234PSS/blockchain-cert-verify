const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let onUnauthorized = () => {};

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token && !path.includes('/auth/login')) {
      onUnauthorized();
    }
    throw new ApiError(
      data.message || 'Request failed',
      response.status,
      data.errors
    );
  }

  return data;
}

export const authApi = {
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  profile: () => request('/api/auth/profile')
};

export const certificateApi = {
  listAll: () => request('/api/certificates/all'),

  mine: () => request('/api/certificates/me'),

  byStudent: (studentId) => request(`/api/certificates/student/${studentId}`),

  verify: (certificateId) => request(`/api/certificates/verify/${certificateId}`),

  issue: (formData) =>
    request('/api/certificates/issue', {
      method: 'POST',
      body: formData
    }),

  revoke: (certificateId, reason) =>
    request(`/api/certificates/revoke/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    })
};

export const healthApi = {
  check: () => request('/health')
};

export { ApiError };
