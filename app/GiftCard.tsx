'use client';

import { useState } from 'react';
import { PhotoIcon, UserIcon, UsersIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Gift {
  id: number;
  title: string;
  price: number;
  url?: string;
  image_url?: string;
  is_reserved: boolean;
  collected: number;
  progress: number;
  reserved_by?: {
    id: number;
    name: string;
  } | null;
  contributors?: Array<{
    id: number;        // ← ДОБАВЬ ЭТО!
    user_id: number;
    user_name: string;
    amount: number;
  }>;
  has_contributions?: boolean;
}

interface GiftCardProps {
  gift: Gift;
  isOwner: boolean;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onReserve?: () => void;
  onContribute?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GiftCard({
  gift,
  isOwner,
  isAuthenticated,
  onRequireAuth,
  onReserve,
  onContribute,
  onEdit,
  onDelete,
}: GiftCardProps) {
  const [isContributing, setIsContributing] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canSeeProgress = isAuthenticated && !isOwner;
  const canSeeWhoReserved = isAuthenticated && !isOwner;
  const canSeeContributors = isAuthenticated && !isOwner;
  
  const canReserve = isAuthenticated && !isOwner && !gift.is_reserved && !gift.has_contributions;
  const canContribute = isAuthenticated && !isOwner && !gift.is_reserved;

  const handleReserveClick = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setIsLoading(true);
    if (onReserve) await onReserve();
    setIsLoading(false);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/90 p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ring-1 ring-pink-100/50 backdrop-blur-sm">
      {/* Розовая полоска сверху */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-400 to-pink-500" />

      {/* Кнопки автора: Изменить / Удалить */}
      {isOwner && (onEdit != null || onDelete != null) && (
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          {onEdit != null && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onEdit(); }}
              className="rounded-lg bg-white/90 p-2 shadow-sm ring-1 ring-gray-200/50 transition-colors hover:bg-pink-50 hover:ring-pink-200"
              title="Изменить"
            >
              <PencilIcon className="h-4 w-4 text-gray-600" />
            </button>
          )}
          {onDelete != null && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              className="rounded-lg bg-white/90 p-2 shadow-sm ring-1 ring-gray-200/50 transition-colors hover:bg-red-50 hover:ring-red-200"
              title="Удалить"
            >
              <TrashIcon className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      )}

      {/* Изображение */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50">
        {gift.image_url ? (
          <img
            src={gift.image_url}
            alt={gift.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-pink-300" />
          </div>
        )}
      </div>
      
      {/* Информация о подарке */}
      <div className="mt-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {gift.title}
          </h3>
          <span className="text-sm font-bold text-pink-600 whitespace-nowrap">
            {gift.price.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        
        {gift.url && (
          <a
            href={gift.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[10px] text-gray-500 hover:text-pink-600 truncate w-full"
          >
            {gift.url.replace(/^https?:\/\//, '').substring(0, 40)}...
          </a>
        )}
        
        {/* Прогресс-бар */}
        {canSeeProgress && gift.progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">Собрано</span>
              <span className="font-medium text-pink-600">
                {gift.collected.toLocaleString('ru-RU')} / {gift.price.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
                style={{ width: `${gift.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Кто забронировал */}
        {canSeeWhoReserved && gift.is_reserved && gift.reserved_by && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2 py-1 text-[10px] text-pink-700">
            <UserIcon className="h-3 w-3" />
            <span className="font-medium">Забронировал(а):</span>
            <span>{gift.reserved_by.name}</span>
          </div>
        )}
        
        {/* Кто скинулся */}
        {canSeeContributors && gift.contributors && gift.contributors.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowContributors(!showContributors)}
              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-pink-600 transition-colors"
            >
              <UsersIcon className="h-3 w-3" />
              <span>Скинулись {gift.contributors.length} {getDeclension(gift.contributors.length)}</span>
              <svg
                className={`h-3 w-3 transition-transform ${showContributors ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showContributors && (
              <div className="mt-2 space-y-1.5 rounded-lg bg-pink-50/50 p-2">
               {gift.contributors.map((c) => (
  <div 
    key={c.id}  // ← ТЕПЕРЬ ИСПОЛЬЗУЕМ УНИКАЛЬНЫЙ ID!
    className="flex items-center justify-between text-[10px]"
  >
    <span className="font-medium text-gray-700">{c.user_name}</span>
    <span className="text-pink-600 font-medium">{c.amount.toLocaleString('ru-RU')} ₽</span>
  </div>
))}
              </div>
            )}
          </div>
        )}
        
      </div>
      
      {/* Кнопки действий */}
      <div className="mt-4 flex flex-col gap-2">
        {!gift.is_reserved && canReserve && (
          <button
            onClick={handleReserveClick}
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-pink-400 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:from-pink-600 hover:to-pink-500 disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : '🎁 Забронировать'}
          </button>
        )}
        
        {!gift.is_reserved && canContribute && (
          <button
            onClick={onContribute}
            className="w-full rounded-lg border border-pink-200/50 bg-white/80 px-3 py-2 text-xs font-medium text-pink-700 transition-all hover:border-pink-300 hover:bg-pink-50/80"
          >
            💰 Скинуться
          </button>
        )}
        
        {!gift.is_reserved && gift.has_contributions && isAuthenticated && !isOwner && (
          <div className="text-center text-[10px] text-amber-600 mt-1">
            Идет сбор средств
          </div>
        )}
      </div>
    </div>
  );
}

// Вспомогательная функция для склонения
function getDeclension(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return 'человек';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'человека';
  return 'человек';
}