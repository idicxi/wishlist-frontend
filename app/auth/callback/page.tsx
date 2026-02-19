import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50/30 to-white pt-14">
          <p className="text-gray-600">Вход через Google...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}

