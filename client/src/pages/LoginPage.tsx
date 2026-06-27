import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import AuthShell from '../components/auth/AuthShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLogin } from '../hooks/useAuthMutations';
import { apiError } from '../lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) =>
    login.mutate(values, { onSuccess: () => navigate('/', { replace: true }) });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to close your rings."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-ink underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {login.isError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {apiError(login.error, 'Could not sign in')}
          </p>
        )}

        <Button type="submit" disabled={login.isPending} className="mt-1">
          {login.isPending && <Loader2 size={16} className="animate-spin" />}
          Sign in
        </Button>

        <button
          type="button"
          className="text-xs font-medium text-ink-3 transition-colors hover:text-ink"
          onClick={() => {
            setValue('email', 'demo@cadence.app');
            setValue('password', 'password123');
          }}
        >
          Fill demo credentials
        </button>
      </form>
    </AuthShell>
  );
}
