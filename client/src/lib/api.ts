import axios from 'axios';
import { useAuth } from '../store/useAuth';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = axios.create({ baseURL });

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the session so the route guard bounces to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const { token, logout } = useAuth.getState();
      if (token) logout();
    }
    return Promise.reject(error);
  },
);

/** Pull a human-readable message out of an Axios error. */
export function apiError(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { error?: string } | undefined)?.error ?? error.message ?? fallback;
  }
  return fallback;
}
