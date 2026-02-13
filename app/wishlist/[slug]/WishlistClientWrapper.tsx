'use client';

import { useAuth } from '../../auth/AuthContext';
import { WishlistClient } from './WishlistClient';

interface Gift {
  id: number;
  title: string;
  price: number;
  url?: string;
  image_url?: string;
  is_reserved: boolean;
  collected: number;
  progress: number;
  reserved_by?: { id: number; name: string } | null;
}

interface WishlistClientWrapperProps {
  slug: string;
  initialGifts: Gift[];
  ownerId: number;
  wishlistId: number;
  currentUser: { id: number; email?: string; name?: string } | null;
  isOwner: boolean;
}

/**
 * Обёртка, которая подставляет пользователя из AuthContext (localStorage),
 * чтобы кнопка «Добавить подарок» и isOwner работали даже если cookie не попал на сервер.
 */
export function WishlistClientWrapper({
  slug,
  initialGifts,
  ownerId,
  wishlistId,
  currentUser: serverUser,
  isOwner: serverIsOwner,
}: WishlistClientWrapperProps) {
  const { user: clientUser } = useAuth();

  const currentUser = clientUser ?? serverUser;
  const isOwner = currentUser != null && currentUser.id === ownerId;

  return (
    <WishlistClient
      slug={slug}
      initialGifts={initialGifts}
      ownerId={ownerId}
      wishlistId={wishlistId}
      currentUser={currentUser}
      isOwner={isOwner}
    />
  );
}
