'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlistSocket } from '../../useWishlistSocket';
import { GiftCard } from '../../GiftCard';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
  contributors?: Array<{ id: number; user_id: number; user_name: string; amount: number }>;
  has_contributions?: boolean;
}

interface WishlistClientProps {
  slug: string;
  initialGifts: Gift[];
  ownerId: number;
  wishlistId: number;
  currentUser: any;
  isOwner: boolean;
}

interface WebSocketEvent {
  type: 'item_reserved' | 'contribution_added' | 'connected' | 'gift_added';  // ← ДОБАВИЛИ!
  giftId: number;
  userId?: number;
  userName?: string;
  total?: number;
  amount?: number;
  wishlist_id?: number;
  gift?: Gift;  // ← ДЛЯ НОВОГО ПОДАРКА
}

export function WishlistClient({
  slug,
  initialGifts,
  ownerId,
  wishlistId,
  currentUser,
  isOwner,
}: WishlistClientProps) {
  const [gifts, setGifts] = useState(initialGifts);
  const { lastEvent: rawEvent } = useWishlistSocket(wishlistId);
  const lastEvent = rawEvent as WebSocketEvent;
  const router = useRouter();

  const isAuthenticated = !!currentUser;
  const user = currentUser;

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [savingGift, setSavingGift] = useState(false);
  const [parsingAdd, setParsingAdd] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [parsingEdit, setParsingEdit] = useState(false);

  // Состояния для модалки складчины
  const [contributeOpen, setContributeOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  useEffect(() => {
    if (!lastEvent) return;
    
    setGifts((prev: Gift[]) => {
      // Новый подарок (realtime)
      if (lastEvent.type === 'gift_added' && lastEvent.gift) {
        const g = lastEvent.gift as unknown as Record<string, unknown>;
        const newId = Number(g.id);
        if (prev.some((x) => x.id === newId)) return prev;
        const newGift: Gift = {
          id: newId,
          title: String(g.title ?? ''),
          price: Number(g.price ?? 0),
          url: g.url != null ? String(g.url) : undefined,
          image_url: g.image_url != null ? String(g.image_url) : undefined,
          is_reserved: Boolean(g.is_reserved),
          collected: Number(g.collected ?? 0),
          progress: Number(g.progress ?? 0),
          reserved_by: undefined,
        };
        return [...prev, newGift];
      }

      const eventGiftId = Number(lastEvent.giftId);
      return prev.map((g) => {
        if (g.id !== eventGiftId) return g;
  
        if (lastEvent.type === 'item_reserved') {
          const reservedBy = lastEvent.userId != null && lastEvent.userName ? {
            id: lastEvent.userId,
            name: lastEvent.userName
          } : null;
          return {
            ...g,
            is_reserved: true,
            reserved_by: reservedBy,
          };
        }
  
        if (lastEvent.type === 'contribution_added') {
          const collected = lastEvent.total ?? 0;
          const progress = Math.min(100, Math.round((collected / g.price) * 100));
          const amount = Number(lastEvent.amount ?? 0);
          const existing = g.contributors ?? [];
          const newContributor =
            lastEvent.userId != null && lastEvent.userName != null
              ? {
                  id: (lastEvent.userId * 1000000 + existing.length * 1000 + Math.round(amount)) | 0,
                  user_id: lastEvent.userId,
                  user_name: lastEvent.userName,
                  amount,
                }
              : null;
          const contributors = newContributor
            ? [...existing, newContributor]
            : existing;
          return {
            ...g,
            collected,
            progress,
            is_reserved: g.price != null && collected >= g.price ? true : g.is_reserved,
            contributors,
            has_contributions: contributors.length > 0,
          };
        }
  
        return g;
      });
    });
  }, [lastEvent]);

  const requireAuth = () => {
    router.push('/login');
  };

  const handleDeleteGift = async (giftId: number) => {
    if (!confirm('Удалить этот подарок?')) return;
    try {
      const token = localStorage.getItem('wishlist_token');
      const res = await fetch(`${API_BASE_URL}/gifts/${giftId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Не удалось удалить');
      setGifts((prev) => prev.filter((g) => g.id !== giftId));
    } catch (e) {
      console.error(e);
      alert('Не удалось удалить подарок');
    }
  };

  const handleParseFromUrl = async (mode: 'add' | 'edit') => {
    const rawUrl = mode === 'add' ? link : editLink;
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    try {
      if (mode === 'add') {
        setParsingAdd(true);
        setAddError(null);
      } else {
        setParsingEdit(true);
        setEditError(null);
      }

      const res = await fetch('/api/og-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        throw new Error('parse failed');
      }

      const data: { title: string | null; image: string | null; price: number | null } = await res.json();

      if (mode === 'add') {
        if (!title.trim() && data.title) {
          setTitle(data.title);
        }
        if (!price && data.price != null) {
          setPrice(String(data.price));
        }
        if (!imageUrl && data.image) {
          setImageUrl(data.image);
        }
      } else {
        if (!editTitle.trim() && data.title) {
          setEditTitle(data.title);
        }
        if (!editPrice && data.price != null) {
          setEditPrice(String(data.price));
        }
        if (!editImageUrl && data.image) {
          setEditImageUrl(data.image);
        }
      }
    } catch (e) {
      if (mode === 'add') {
        setAddError('Не удалось распарсить ссылку');
      } else {
        setEditError('Не удалось распарсить ссылку');
      }
    } finally {
      if (mode === 'add') {
        setParsingAdd(false);
      } else {
        setParsingEdit(false);
      }
    }
  };

  const openEditGift = (gift: Gift) => {
    setEditingGift(gift);
    setEditTitle(gift.title);
    setEditLink(gift.url ?? '');
    setEditPrice(String(gift.price));
    setEditImageUrl(gift.image_url ?? '');
    setEditError(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGift) return;
    if (!editTitle.trim() || !editPrice) {
      setEditError('Введите название и цену');
      return;
    }
    const parsedPrice = Number(editPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setEditError('Некорректная цена');
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const apiUrl = new URL(`${API_BASE_URL}/gifts/${editingGift.id}`);
      apiUrl.searchParams.set('title', editTitle.trim());
      apiUrl.searchParams.set('price', String(parsedPrice));
      apiUrl.searchParams.set('url', editLink.trim());
      apiUrl.searchParams.set('image_url', editImageUrl.trim());
      const token = localStorage.getItem('wishlist_token');
      const res = await fetch(apiUrl.toString(), {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Не удалось сохранить');
      const updated = await res.json();
      setGifts((prev) =>
        prev.map((g) =>
          g.id === editingGift.id
            ? { ...g, title: updated.title, price: updated.price, url: updated.url ?? g.url, image_url: updated.image_url ?? g.image_url }
            : g
        )
      );
      setEditOpen(false);
      setEditingGift(null);
    } catch (e) {
      setEditError('Ошибка при сохранении');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReserve = async (giftId: number) => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
  
    try {
      const token = localStorage.getItem('wishlist_token');
      
      const response = await fetch(`${API_BASE_URL}/gifts/${giftId}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`❌ ${data.error || 'Не удалось забронировать подарок'}`);
        return;
      }
      
    } catch (e) {
      console.error('❌ Ошибка соединения:', e);
      alert('Ошибка соединения с сервером');
    }
  };

  const openContributeModal = (gift: any) => {
    setSelectedGift(gift);
    setContributionAmount('');
    setContributeOpen(true);
  };

  const handleContribute = async () => {
    if (!selectedGift) return;
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    const amount = Number(contributionAmount);
    const remaining = selectedGift.price - selectedGift.collected;
    
    if (!amount || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    if (amount > remaining) {
      alert(`Максимальная сумма: ${remaining.toLocaleString('ru-RU')} ₽`);
      return;
    }

    const minAmount = Math.ceil(selectedGift.price / 3);
    
    if (remaining < minAmount) {
      if (amount !== remaining) {
        alert(`Осталось внести только ${remaining.toLocaleString('ru-RU')} ₽`);
        return;
      }
    } else {
      if (amount < minAmount) {
        alert(`Минимальная сумма взноса: ${minAmount.toLocaleString('ru-RU')} ₽ (1/3 стоимости подарка)`);
        return;
      }
    }

    setContributing(true);
    try {
      const token = localStorage.getItem('wishlist_token');
      
      const url = new URL(`${API_BASE_URL}/gifts/${selectedGift.id}/contribute`);
      url.searchParams.set('amount', String(amount));

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось внести вклад');
      }

      setContributeOpen(false);
      setContributionAmount('');
      setSelectedGift(null);
    } catch (e) {
      console.error('Error contributing to gift:', e);
      alert('Не удалось внести вклад');
    } finally {
      setContributing(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        {isOwner ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gray-900/95 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50"
          >
            <span className="relative z-10"> Добавить подарок</span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={() => {
            if (typeof window === 'undefined') return;
            const url = `${window.location.origin}/wishlist/${slug}`;
            navigator.clipboard
              .writeText(url)
              .then(() => {
                alert(' Ссылка скопирована!');
              })
              .catch(() => {
                alert(' Не удалось скопировать ссылку');
              });
          }}
          className="inline-flex items-center gap-2 rounded-full border border-pink-200/50 bg-white/80 px-6 py-3 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:border-pink-300/50 hover:bg-pink-50/80"
        >
          <span> Поделиться</span>
        </button>
      </div>

      {gifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-12 text-center backdrop-blur-sm ring-1 ring-pink-100/50">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-4xl">
            🎁
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isOwner ? 'Добавьте первый подарок' : 'Здесь пока нет подарков'}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-600">
            {isOwner
              ? 'Соберите идеи подарков, чтобы друзья точно знали, что вам подарить.'
              : 'Владелец ещё не добавил подарки в этот вишлист.'}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="group relative mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900/95 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50"
            >
              <span className="relative z-10"> Добавить подарок</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gifts.map((gift, index) => (
            <div
              key={gift.id}
              className="animate-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <GiftCard
                gift={gift}
                isOwner={isOwner}
                isAuthenticated={isAuthenticated}
                onRequireAuth={requireAuth}
                onReserve={() => handleReserve(gift.id)}
                onContribute={() => openContributeModal(gift)}
                onEdit={isOwner ? () => openEditGift(gift) : undefined}
                onDelete={isOwner ? () => handleDeleteGift(gift.id) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Модалка добавления подарка */}
      {addOpen && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-xl backdrop-blur-md ring-1 ring-pink-100/50">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
            <div className="p-8">
              <h2 className="font-soledago text-xl font-bold text-gray-900">
                Добавить подарок
              </h2>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Ссылка на товар
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="https://..."
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleParseFromUrl('add')}
                      disabled={parsingAdd || !link.trim()}
                      className="text-[11px] font-medium text-pink-600 hover:text-pink-700 disabled:opacity-40"
                    >
                      {parsingAdd ? 'Парсим...' : 'Заполнить по ссылке'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="Например, наушники"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Цена *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Ссылка на картинку
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="https://..."
                  />
                </div>
                {addError && (
                  <div className="rounded-xl bg-red-50/80 px-4 py-3 text-xs text-red-600">
                    {addError}
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setAddError(null);
                    setTitle('');
                    setLink('');
                    setPrice('');
                    setImageUrl('');
                  }}
                  className="rounded-full px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={savingGift || !title.trim() || !price}
                onClick={async () => {
  if (!title.trim() || !price) {
    setAddError('Введите название и цену');
    return;
  }
  setSavingGift(true);
  setAddError(null);
  try {
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setAddError('Некорректная цена');
      setSavingGift(false);
      return;
    }
    const apiUrl = new URL(`${API_BASE_URL}/gifts/`);
    apiUrl.searchParams.set('title', title.trim());
    apiUrl.searchParams.set('price', String(parsedPrice));
    apiUrl.searchParams.set('wishlist_id', String(wishlistId));
    if (link) apiUrl.searchParams.set('url', link);
    if (imageUrl) apiUrl.searchParams.set('image_url', imageUrl);

    const token = localStorage.getItem('wishlist_token');
    const res = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Не удалось сохранить подарок');
    await res.json();
    setAddOpen(false);
    setTitle('');
    setLink('');
    setPrice('');
    setImageUrl('');
  } catch (e) {
    setAddError('Ошибка при сохранении подарка');
  } finally {
    setSavingGift(false);
  }
}}
                  className="group relative overflow-hidden rounded-full bg-gray-900/95 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10">
                    {savingGift ? 'Сохраняем...' : '✨ Сохранить'}
                  </span>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования подарка */}
      {editOpen && editingGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-xl backdrop-blur-md ring-1 ring-pink-100/50">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
            <div className="p-8">
              <h2 className="font-soledago text-xl font-bold text-gray-900">
                Изменить подарок
              </h2>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Ссылка на товар
                  </label>
                  <input
                    type="url"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="https://..."
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleParseFromUrl('edit')}
                      disabled={parsingEdit || !editLink.trim()}
                      className="text-[11px] font-medium text-pink-600 hover:text-pink-700 disabled:opacity-40"
                    >
                      {parsingEdit ? 'Парсим...' : 'Заполнить по ссылке'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="Например, наушники"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Цена *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Ссылка на картинку
                  </label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                    placeholder="https://..."
                  />
                </div>
                {editError && (
                  <div className="rounded-xl bg-red-50/80 px-4 py-3 text-xs text-red-600">
                    {editError}
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingGift(null);
                    setEditError(null);
                  }}
                  className="rounded-full px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={savingEdit || !editTitle.trim() || !editPrice}
                  onClick={handleSaveEdit}
                  className="group relative overflow-hidden rounded-full bg-gray-900/95 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10">
                    {savingEdit ? 'Сохраняем...' : 'Сохранить'}
                  </span>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка складчины */}
      {contributeOpen && selectedGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur-md ring-1 ring-pink-100/50">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
            <h2 className="font-soledago text-xl font-bold text-gray-900">
              Скинуться на подарок
            </h2>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">{selectedGift.title}</p>
              <p className="text-xs text-gray-600 mt-1">
                Цена: {selectedGift.price.toLocaleString('ru-RU')} ₽
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Уже собрано</span>
                  <span className="font-medium text-pink-600">
                    {selectedGift.collected.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500"
                    style={{ width: `${selectedGift.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Осталось: {(selectedGift.price - selectedGift.collected).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Сумма взноса
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  max={selectedGift.price - selectedGift.collected}
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                  placeholder="Введите сумму"
                />
                <button
                  type="button"
                  onClick={() => {
                    const remaining = selectedGift.price - selectedGift.collected;
                    setContributionAmount(String(remaining));
                  }}
                  className="px-4 py-2 text-xs font-medium text-pink-600 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors"
                >
                  Всё
                </button>
              </div>
              {selectedGift.price - selectedGift.collected >= Math.ceil(selectedGift.price / 3) ? (
                <p className="text-[10px] text-gray-500 mt-2">
                  Минимальная сумма: {Math.ceil(selectedGift.price / 3).toLocaleString('ru-RU')} ₽ (1/3 подарка)
                </p>
              ) : (
                <p className="text-[10px] text-amber-600 mt-2">
                  Осталось внести только {(selectedGift.price - selectedGift.collected).toLocaleString('ru-RU')} ₽
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setContributeOpen(false);
                  setSelectedGift(null);
                  setContributionAmount('');
                }}
                className="rounded-full px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={contributing || !contributionAmount || Number(contributionAmount) <= 0}
                onClick={handleContribute}
                className="group relative overflow-hidden rounded-full bg-gray-900/95 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative z-10">
                  {contributing ? 'Отправляем...' : '💰 Внести вклад'}
                </span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
