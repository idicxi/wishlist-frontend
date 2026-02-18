'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';


export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Заполните Email и пароль');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Некорректный Email');
      return;
    }

    setLoading(true);
    try {
    await login(email, password);
      router.push('/dashboard');
    } catch (e) {
      const message =
      e instanceof Error ? e.message : 'Неверный email или пароль';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col bg-gradient-to-b from-white via-pink-50/30 to-white pt-14 sm:min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 p-5 shadow-xl backdrop-blur-md ring-1 ring-pink-100/50 sm:rounded-3xl sm:p-6 md:p-8">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />

            <div className="text-center">
              <h1 className="font-soledago text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                Вход в аккаунт
              </h1>
              <p className="mt-1.5 text-xs text-gray-600 sm:mt-2 sm:text-sm">
                Управляй своими вишлистами и подарками.
              </p>
            </div>

            <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-pink-200/50 bg-white/90 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/50 sm:h-11 sm:px-4"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-pink-200/50 bg-white/90 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/50 sm:h-11 sm:px-4"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50/80 px-3.5 py-2.5 text-xs text-red-600 sm:px-4 sm:py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-3 inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gray-900/95 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-4 sm:px-6 sm:py-3"
              >
                <span className="relative z-10">{loading ? 'Входим...' : 'Войти'}</span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
              </button>

              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    onClick={() => {
                      const uri = `${window.location.origin}/auth/callback`;
                      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(uri)}&response_type=code&scope=email%20profile%20openid`;
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Войти через Google
                  </button>
                </div>
              )}

            </form>

            <div className="mt-5 text-center text-xs sm:mt-6 sm:text-sm">
              <span className="text-gray-600">Нет аккаунта? </span>
              <Link href="/register" className="font-medium text-pink-600 transition-colors hover:text-pink-700">
                Зарегистрироваться
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 text-xs text-gray-400 sm:mt-6">
              <div className="h-px flex-1 bg-pink-200/50" />
              <span className="font-soledago text-sm">wishlist</span>
              <div className="h-px flex-1 bg-pink-200/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
