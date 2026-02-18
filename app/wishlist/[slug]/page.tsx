import type { Metadata } from 'next';
import { WishlistClientWrapper } from './WishlistClientWrapper';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface Wishlist {
  id: number;
  title: string;
  description?: string | null;
  owner_id: number;
}

interface Gift {
  id: number;
  title: string;
  price: number;
  url?: string;
  image_url?: string;
  is_reserved: boolean;
  collected: number;
  progress: number;
  reserved_by?: {           // ← ДОБАВЬ ЭТО!
    id: number;
    name: string;
  } | null;
}

async function getWishlistData(slug: string, token: string | undefined) {
  const wishlistRes = await fetch(
    `${API_BASE_URL}/wishlist/${encodeURIComponent(slug)}`,
    { next: { revalidate: 0 } },
  );

  if (!wishlistRes.ok) {
    return { wishlist: null as Wishlist | null, gifts: [] as Gift[] };
  }

  const wishlist: Wishlist | null = await wishlistRes.json();

  if (!wishlist || !wishlist.id) {
    return { wishlist: null, gifts: [] };
  }

  const giftsRes = await fetch(
    `${API_BASE_URL}/wishlists/${wishlist.id}/gifts`,
    {
      next: { revalidate: 0 },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  const gifts = giftsRes.ok ? await giftsRes.json() : [];

  return { wishlist, gifts };
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('wishlist_token')?.value;

  if (!token) return null;

  try {
    const decoded: { sub?: string } = jwtDecode(token);
    const userId = decoded.sub;
    if (!userId) return null;

    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Error getting current user:', e);
  }

  return null;
}

function WishlistNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50/30 to-white">
      <div className="w-full max-w-md px-4">
        <div className="relative overflow-hidden rounded-3xl bg-white/90 p-8 text-center shadow-xl backdrop-blur-md ring-1 ring-pink-100/50 animate-slide-up">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-4xl mx-auto">
            🎁
          </div>
          <h1 className="font-soledago text-2xl font-bold text-gray-900">
            Вишлист не найден
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Возможно, ссылка устарела или вишлист был удалён.
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { wishlist } = await getWishlistData(slug);
    if (!wishlist) {
      return {
        title: 'Вишлист не найден',
      };
    }
    return {
      title: `${wishlist.title} | Социальный вишлист`,
      description: wishlist.description ?? 'Список желаний',
    };
  } catch {
    return {
      title: 'Вишлист | Социальный вишлист',
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('wishlist_token')?.value;
  const currentUser = await getCurrentUser();
  const { wishlist, gifts } = await getWishlistData(slug, token);

  if (!wishlist) {
    return <WishlistNotFound />;
  }

  const isOwner = currentUser?.id === wishlist.owner_id;

  return (
    <div className="flex-1 bg-gradient-to-b from-white via-pink-50/30 to-white pt-14">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        
        {/* Шапка вишлиста */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-white/90 p-6 shadow-lg ring-1 ring-pink-100/50 backdrop-blur-sm sm:p-8 animate-slide-up">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
          
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h1 className="font-soledago text-2xl font-bold text-gray-900 sm:text-3xl">
                {wishlist.title}
              </h1>
              {wishlist.description && (
                <p className="mt-2 text-sm text-gray-600">
                  {wishlist.description}
                </p>
              )}
            </div>
            
            {/* Индикатор владельца */}
            {isOwner && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100/80 px-3 py-1.5 text-xs font-medium text-pink-700 ring-1 ring-pink-200/50 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
                </span>
                Ваш вишлист
              </div>
            )}
          </div>
        </div>

        {/* Клиентский компонент с подарками (обёртка подставляет user из AuthContext для кнопки «Добавить подарок») */}
        <WishlistClientWrapper
          slug={slug}
          initialGifts={gifts}
          ownerId={wishlist.owner_id}
          wishlistId={wishlist.id}
          currentUser={currentUser}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}