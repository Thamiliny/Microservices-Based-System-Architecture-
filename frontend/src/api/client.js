/**
 * Thin fetch wrapper around the backend REST API.
 *
 * The base URL is a relative path: in production nginx proxies `/api` to the
 * backend container, so the browser never talks to the API host directly and
 * no CORS pre-flight is needed.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'fd.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = payload.error || {};
    const message = error.details?.length
      ? `${error.message}: ${error.details.map((d) => `${d.field} - ${d.message}`).join('; ')}`
      : error.message || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, error.details);
  }

  return payload.data;
}

export const api = {
  // health
  health: () => request('/health'),
  healthDb: () => request('/health/db'),

  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),

  // restaurants + menu
  listRestaurants: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    ).toString();
    return request(`/restaurants${qs ? `?${qs}` : ''}`);
  },
  cuisines: () => request('/restaurants/cuisines'),
  getRestaurant: (id) => request(`/restaurants/${id}`),
  getMenu: (id) => request(`/restaurants/${id}/menu`),
  restaurantOrders: (id) => request(`/restaurants/${id}/orders`, { auth: true }),

  // orders
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload, auth: true }),
  myOrders: () => request('/orders', { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true })
};
