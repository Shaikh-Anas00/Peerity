import axios, { type InternalAxiosRequestConfig } from 'axios';

/**
 * Reads the value of a browser cookie by name.
 * Returns null if the cookie does not exist.
 */
function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request interceptor — CSRF protection (Item 1).
 *
 * For every state-mutating request (POST, PUT, PATCH, DELETE), read the
 * XSRF-TOKEN cookie that Spring Security sets and attach it as the
 * X-XSRF-TOKEN request header.
 *
 * Spring's CookieCsrfTokenRepository validates this header against the
 * cookie value to confirm same-origin intent.
 *
 * GET / HEAD / OPTIONS are safe methods and do not need the token.
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? '').toUpperCase();
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (mutatingMethods.includes(method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  return config;
});

/**
 * Response interceptor — redirect to login on 401 Unauthorized (session expired).
 * Excludes unauthenticated checks (/auth/me), login attempts (/auth/login),
 * and public routes ('/', '/login', '/register', '/unauthorized').
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Only redirect if an authenticated API call failed while on a protected route
    if (status === 401 && !url.includes('/auth/me') && !url.includes('/auth/login')) {
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/unauthorized'];
      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
