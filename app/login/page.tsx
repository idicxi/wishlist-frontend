'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Неверный email или пароль');
      }

      const data = await res.json();
      if (!data?.access_token || !data?.user) {
        throw new Error('Некорректный ответ сервера при входе');
      }

      login(data.user, data.access_token);
      router.push('/dashboard');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Ошибка при входе, попробуйте ещё раз';
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