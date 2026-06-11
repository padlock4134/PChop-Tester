import axios, { AxiosError } from 'axios';
import { redirectToLogin } from '@wristband/react-client-auth';

/**
 * This API client is used for most API calls to Netlify functions. It passes along the CSRF token
 * in the request.
 */
const netlifyApiClient = axios.create({
  baseURL: '/.netlify/functions',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  xsrfCookieName: 'CSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-TOKEN',
  withCredentials: true,
  withXSRFToken: true,
});

// Automatically redirect to login when session expires (401/403 errors)
// This happens when the session cookie has expired and/or the CSRF cookie/header are missing
netlifyApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      redirectToLogin('/.netlify/functions/auth-login');
      window.location.href = '/.netlify/functions/auth-login'; // Force reload to login page
    }
    return Promise.reject(error);
  }
);

export { netlifyApiClient };
