import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth, type AuthUser } from '../store/useAuth';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function useLogin() {
  const setAuth = useAuth((s) => s.setAuth);
  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) =>
      (await api.post<AuthResponse>('/auth/login', creds)).data,
    onSuccess: ({ token, user }) => setAuth(token, user),
  });
}

export function useRegister() {
  const setAuth = useAuth((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) =>
      (await api.post<AuthResponse>('/auth/register', data)).data,
    onSuccess: ({ token, user }) => setAuth(token, user),
  });
}
