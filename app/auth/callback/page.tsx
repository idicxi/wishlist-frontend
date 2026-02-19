'use client';

import { useAuth } from '../../auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Выносим логику в отдельный внутренний компонент, который использует useSearchParams
function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Нет кода от Google');
      setStatus('error');
      return;
    }
    const redirectUri =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '';
    if (!redirectUri) {
      setStatus('loading');
      return;
    }
    fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token && data.user) {
          loginWithToken(data.user, data.access_token);
          setStatus('ok');
          router.replace('/dashboard');
        } else {
          setError(data.detail || 'Ошибка входа через Google');
          setStatus('error');
        }
      })
      .catch((e) => {
        setError(e.message || 'Ошибка сети');
        setStatus('error');
      });
  }, [searchParams, loginWithToken, router]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50/30 to-white pt-14">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-4 rounded-full bg-gray-900 px-6 py-2 text-sm text-white"
          >
            На страницу входа
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50/30 to-white pt-14">
      <p className="text-gray-600">Вход через Google...</p>
    </div>
  );
}

// Основной экспортируемый компонент оборачивает AuthCallbackHandler в Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50/30 to-white pt-14">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500 mx-auto" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
