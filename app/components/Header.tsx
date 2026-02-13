'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isAuthPage =
    pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-200 to-pink-300 text-sm font-semibold text-pink-800 shadow-sm">
            WL
          </span>
          <span className="bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-sm font-semibold text-transparent sm:text-base">
            wishlist
          </span>
        </Link>

        <nav className="hidden items-center gap-3 text-sm font-medium sm:flex">
          {!user && !isAuthPage && (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-1.5 text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-pink-400 to-pink-500 px-4 py-1.5 text-white shadow-sm transition hover:from-pink-500 hover:to-pink-600 hover:shadow"
              >
                Регистрация
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-1.5 text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
              >
                Профиль
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-pink-200 px-4 py-1.5 text-gray-700 transition hover:border-pink-300 hover:bg-pink-50"
              >
                Выйти
              </button>
            </>
          )}
        </nav>

        {!isAuthPage && (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-pink-200 text-gray-700 transition hover:bg-pink-50 sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Открыть меню"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-pink-500" />
              <span className="block h-0.5 w-4 rounded-full bg-pink-500" />
              <span className="block h-0.5 w-4 rounded-full bg-pink-500" />
            </div>
          </button>
        )}
      </div>

      {open && !isAuthPage && (
  <div className="fixed left-0 right-0 top-14 border-t border-pink-200/30 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-lg sm:hidden">
    <div className="flex flex-col gap-2">
      {!user && !isAuthPage && (
        <>
          <Link
            href="/login"
            className="rounded-md px-3 py-2.5 transition hover:bg-pink-50 hover:text-pink-600"
            onClick={() => setOpen(false)}
          >
            Вход
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-gradient-to-r from-pink-400 to-pink-500 px-3 py-2.5 text-white transition hover:from-pink-500 hover:to-pink-600"
            onClick={() => setOpen(false)}
          >
            Регистрация
          </Link>
        </>
      )}

      {user && (
        <>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2.5 transition hover:bg-pink-50 hover:text-pink-600"
            onClick={() => setOpen(false)}
          >
            Профиль
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="rounded-md border border-pink-200 px-3 py-2.5 text-left text-gray-700 transition hover:border-pink-300 hover:bg-pink-50"
          >
            Выйти
          </button>
        </>
      )}
    </div>
  </div>
)}
    </header>
  );
}