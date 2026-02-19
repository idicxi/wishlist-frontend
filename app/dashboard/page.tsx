'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  GiftIcon,
  CalendarIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface User {
  id: number;
  email: string;
  name: string;
}

interface Gift {
  id: number;
  title: string;
  price: number;
  url?: string;
  image_url?: string;
}

interface Wishlist {
  id: number;
  title: string;
  description?: string | null;
  event_date?: string | null;
  slug: string;
  gifts_count?: number;
  gifts?: Gift[];
}

type Mode = 'create' | 'edit';

interface DraftGift {
  id: number;
  title: string;
  link: string;
  price: string;
  imageUrl: string;
  isEditing?: boolean;
  editId?: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentWishlistId, setCurrentWishlistId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [draftGifts, setDraftGifts] = useState<DraftGift[]>([]);

  const [expandedWishlists, setExpandedWishlists] = useState<Set<number>>(new Set());
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);
  const [parsingGiftId, setParsingGiftId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = window.localStorage.getItem('wishlist_token');
    const storedUser = window.localStorage.getItem('wishlist_user');

    if (!storedToken || !storedUser) {
      router.replace('/login');
      return;
    }

    try {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!user || !token) return;

    const fetchWishlists = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/wishlists/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Не удалось загрузить вишлисты');
        }

        const data = await res.json();
        
        const wishlistsWithGifts = await Promise.all(
          data.map(async (wishlist: Wishlist) => {
            try {
              const giftsRes = await fetch(
                `${API_BASE_URL}/wishlists/${wishlist.id}/gifts`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (giftsRes.ok) {
                const gifts = await giftsRes.json();
                return { 
                  ...wishlist, 
                  gifts: gifts,
                  gifts_count: gifts.length 
                };
              }
            } catch (e) {
              console.error('Ошибка загрузки подарков:', e);
            }
            return wishlist;
          })
        );
        
        setWishlists(wishlistsWithGifts);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Ошибка при загрузке вишлистов';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlists();
  }, [user, token]);

  const toggleExpand = (wishlistId: number) => {
    setExpandedWishlists((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wishlistId)) {
        newSet.delete(wishlistId);
      } else {
        newSet.add(wishlistId);
      }
      return newSet;
    });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setEditingWishlist(null);
    setCurrentWishlistId(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setDraftGifts([]);
    setModalOpen(true);
  };

  const openEditModal = (wishlist: Wishlist) => {
    setModalMode('edit');
    setEditingId(wishlist.id);
    setEditingWishlist(wishlist);
    setCurrentWishlistId(null);
    setTitle(wishlist.title);
    setDescription(wishlist.description ?? '');
    setEventDate(wishlist.event_date ?? '');
    setDraftGifts([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingWishlist(null);
    setDraftGifts([]);
    setCurrentWishlistId(null);
  };

  const parseDraftGiftUrl = async (draftId: number, link: string) => {
    const trimmed = link.trim();
    if (!trimmed) return;

    try {
      setParsingGiftId(draftId);

      const res = await fetch('/api/og-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        throw new Error('parse failed');
      }

      const data: { title: string | null; image: string | null; price: number | null } = await res.json();

      setDraftGifts((prev) =>
        prev.map((g) => {
          if (g.id !== draftId) return g;
          return {
            ...g,
            title: g.title || (data.title ?? ''),
            price: g.price || (data.price != null ? String(data.price) : g.price),
            imageUrl: g.imageUrl || (data.image ?? g.imageUrl),
          };
        }),
      );
    } catch (e) {
      alert('Не удалось распарсить ссылку');
    } finally {
      setParsingGiftId(null);
    }
  };

  const handleDeleteGift = async (giftId: number) => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/gifts/${giftId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Не удалось удалить подарок');
      }

      if (editingWishlist) {
        const updatedGifts = editingWishlist.gifts?.filter(g => g.id !== giftId) || [];
        setEditingWishlist({
          ...editingWishlist,
          gifts: updatedGifts,
          gifts_count: updatedGifts.length
        });
      }

      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id === editingWishlist?.id) {
            const updatedGifts = w.gifts?.filter(g => g.id !== giftId) || [];
            return {
              ...w,
              gifts: updatedGifts,
              gifts_count: updatedGifts.length
            };
          }
          return w;
        }),
      );

    } catch (e) {
      console.error('Ошибка при удалении подарка:', e);
      alert('Не удалось удалить подарок');
    }
  };

  const handleUpdateGift = async (giftId: number, updatedGift: DraftGift) => {
    if (!token) return;
  
    try {
      const params = new URLSearchParams();
      params.append('title', updatedGift.title.trim());
      params.append('price', String(Number(updatedGift.price)));
      if (updatedGift.link.trim()) params.append('url', updatedGift.link.trim());
      if (updatedGift.imageUrl.trim()) params.append('image_url', updatedGift.imageUrl.trim());
  
      const res = await fetch(`${API_BASE_URL}/gifts/${giftId}?${params.toString()}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) {
        throw new Error('Не удалось обновить подарок');
      }
  
      const updated = await res.json();
  
      if (editingWishlist) {
        const updatedGifts = editingWishlist.gifts?.map(g => 
          g.id === giftId ? updated : g
        ) || [];
        setEditingWishlist({
          ...editingWishlist,
          gifts: updatedGifts,
        });
      }
  
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id === editingWishlist?.id) {
            const updatedGifts = w.gifts?.map(g => 
              g.id === giftId ? updated : g
            ) || [];
            return {
              ...w,
              gifts: updatedGifts,
            };
          }
          return w;
        }),
      );
  
      setDraftGifts((prev) => prev.filter((g) => g.editId !== giftId));
  
    } catch (e) {
      console.error('Ошибка при обновлении подарка:', e);
      alert('Не удалось обновить подарок');
    }
  };

  const handleSave = async () => {
    if (!user || !token) return;
  
    if (!title.trim()) {
      setError('Введите название вишлиста');
      return;
    }
  
    setError(null);
    const body: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      owner_id: user.id,
    };
    if (eventDate) body.event_date = eventDate;
  
    try {
      const url =
        modalMode === 'create'
          ? `${API_BASE_URL}/wishlists/`
          : `${API_BASE_URL}/wishlists/${editingId}`;
  
      const method = modalMode === 'create' ? 'POST' : 'PUT';
  
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
  
      if (!res.ok) {
        throw new Error(
          modalMode === 'create'
            ? 'Не удалось создать вишлист'
            : 'Не удалось обновить вишлист',
        );
      }
  
      const updated = await res.json();
  
      // ===== СОХРАНЯЕМ ВСЕ НЕСОХРАНЕННЫЕ ПОДАРКИ =====
      const unsavedGifts = draftGifts.filter(g => !g.editId);
      const createdGifts: Gift[] = [];

      if (updated?.id && unsavedGifts.length > 0) {
        for (const gift of unsavedGifts) {
          const trimmedTitle = gift.title.trim();
          if (!trimmedTitle) continue;

          const parsedPrice = Number(gift.price);
          if (Number.isNaN(parsedPrice) || parsedPrice < 0) continue;

          const apiUrl = new URL(`${API_BASE_URL}/gifts/`);
          apiUrl.searchParams.set('title', trimmedTitle);
          apiUrl.searchParams.set('price', String(parsedPrice));
          apiUrl.searchParams.set('wishlist_id', String(updated.id));
          if (gift.link.trim()) {
            apiUrl.searchParams.set('url', gift.link.trim());
          }
          if (gift.imageUrl.trim()) {
            apiUrl.searchParams.set('image_url', gift.imageUrl.trim());
          }

          try {
            const res = await fetch(apiUrl.toString(), { 
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (res.ok) {
              const created = await res.json();
              createdGifts.push(created);
            }
          } catch (e) {
            console.error('Ошибка при создании подарка:', e);
          }
        }
      }

      // Обновляем UI сразу, без перезагрузки
      if (modalMode === 'edit' && editingWishlist) {
        setEditingWishlist({
          ...editingWishlist,
          gifts: [...(editingWishlist.gifts || []), ...createdGifts],
          gifts_count: (editingWishlist.gifts?.length || 0) + createdGifts.length
        });
      }

      // Обновляем общий список wishlists
      setWishlists((prev: Wishlist[]) =>
        prev.map((w) => {
          if (w.id === updated.id) {
            return {
              ...w,
              gifts: [...(w.gifts || []), ...createdGifts],
              gifts_count: (w.gifts?.length || 0) + createdGifts.length
            };
          }
          return w;
        })
      );

      if (modalMode === 'create') {
        setCurrentWishlistId(updated.id);
        closeModal();
        if (updated?.slug) {
          router.push(`/wishlist/${updated.slug}`);
        } else {
          setWishlists((prev) => [...prev, updated]);
        }
      } else {
        setWishlists((prev) =>
          prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)),
        );
        closeModal();
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : modalMode === 'create'
            ? 'Ошибка при создании вишлиста'
            : 'Ошибка при обновлении вишлиста';
      setError(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Удалить этот вишлист?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/wishlists/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Не удалось удалить вишлист');
      }

      setWishlists((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Ошибка при удалении вишлиста';
      setError(message);
    }
  };

  const handleShare = (slug: string) => {
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
  };

  if (!user || !token) {
    return (
      <div className="flex-1 bg-gradient-to-b from-white via-pink-50/30 to-white animate-fade-in">
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
          <div className="text-center animate-slide-up">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-3xl animate-pulse">
              🎁
            </div>
            <p className="mt-4 text-sm text-gray-600">Проверяем авторизацию...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-white via-pink-50/30 to-white pt-8 animate-fade-in">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Приветствие и кнопка */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center animate-slide-up">
          <div>
            <h1 className="font-soledago text-2xl font-bold text-gray-900 sm:text-3xl">
              Личный кабинет
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Привет, <span className="font-medium text-pink-600">{user.name}</span>! Управляй своими вишлистами.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gray-900/95 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="relative z-10">Новый вишлист</span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-12 backdrop-blur-sm animate-card-1">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-2xl animate-bounce">
                🎁
              </div>
              <p className="mt-4 text-sm text-gray-600">Загружаем вишлисты...</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-3xl bg-red-50/80 p-6 text-center backdrop-blur-sm animate-card-1">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && wishlists.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-12 text-center backdrop-blur-sm ring-1 ring-pink-100/50 animate-card">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200">
                <GiftIcon className="h-10 w-10 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Нет вишлистов</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-600">
                Создай первый вишлист, чтобы поделиться им с друзьями и начать собирать подарки!
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="group relative mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900/95 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="relative z-10">Создать вишлист</span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
              </button>
            </div>
          )}

          {!loading && wishlists.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {wishlists.map((w, index) => {
                const isExpanded = expandedWishlists.has(w.id);
                const displayedGifts = isExpanded ? w.gifts : w.gifts?.slice(0, 2);
                const hasMoreGifts = w.gifts && w.gifts.length > 2;

                return (
                  <div
                    key={w.id}
                    className="group relative flex flex-col overflow-hidden rounded-3xl bg-white/90 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ring-1 ring-pink-100/50 backdrop-blur-sm h-fit animate-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
                    
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h2 className="text-xl font-semibold text-gray-900 line-clamp-1 group-hover:text-pink-600 transition-colors">
                            {w.title}
                          </h2>
                          {w.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {w.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200">
                            <span className="text-lg font-semibold text-pink-700">
                              {w.gifts_count ?? 0}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">подарков</span>
                        </div>
                      </div>

                      {w.event_date && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-pink-50/50 rounded-xl px-3 py-2">
                          <CalendarIcon className="h-4 w-4 text-pink-400" />
                          <span className="font-medium">
                            {new Date(w.event_date).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}

                      {w.gifts && w.gifts.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GiftIcon className="h-4 w-4 text-pink-400" />
                              <span className="text-xs font-medium text-gray-700">
                                {isExpanded ? 'Все подарки' : 'Последние подарки'}
                              </span>
                            </div>
                            {hasMoreGifts && (
                              <button
                                onClick={() => toggleExpand(w.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 hover:text-pink-700 transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Свернуть</span>
                                    <ChevronUpIcon className="h-3.5 w-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Все {w.gifts.length}</span>
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className={`space-y-2 ${isExpanded ? 'max-h-[250px] overflow-y-auto pr-1' : ''}`}>
                            {displayedGifts?.map((gift) => (
                              <div
                                key={gift.id}
                                className="flex items-center gap-3 bg-white/80 rounded-xl p-2 border border-pink-100/50 hover:border-pink-200 transition-colors"
                              >
                                {gift.image_url ? (
                                  <img
                                    src={gift.image_url}
                                    alt={gift.title}
                                    className="h-10 w-10 rounded-lg object-cover bg-pink-50"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                                    <PhotoIcon className="h-5 w-5 text-pink-400" />
                                  </div>
                                )}
                               <div className="flex-1 min-w-0">
  <p className="text-xs font-medium text-gray-900 truncate">
    {gift.title}
  </p>
  <p className="text-[11px] text-pink-600 font-medium">
    {typeof gift.price === 'number' ? gift.price.toLocaleString('ru-RU') : '0'} ₽
  </p>
</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/wishlist/${w.slug}`}
                        className="mt-4 inline-flex items-center justify-between w-full rounded-xl bg-gradient-to-r from-pink-50 to-pink-100/50 px-4 py-3 text-sm font-medium text-pink-700 hover:from-pink-100 hover:to-pink-200 transition-all duration-300 group/link"
                      >
                        <span className="flex items-center gap-2">
                          <GiftIcon className="h-4 w-4" />
                          <span>Открыть вишлист</span>
                        </span>
                        <span className="text-pink-500 group-hover/link:translate-x-1 transition-transform">→</span>
                      </Link>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(w)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-pink-200/50 bg-white/80 px-3 py-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300/50 hover:bg-pink-50/80 hover:text-pink-700"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          <span>Ред.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200/50 bg-white/80 px-3 py-2.5 text-xs font-medium text-red-600 shadow-sm transition-all hover:border-red-300/50 hover:bg-red-50/80"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          <span>Удал.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare(w.slug)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200/50 bg-white/80 px-3 py-2.5 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:border-emerald-300/50 hover:bg-emerald-50/80"
                        >
                          <ShareIcon className="h-3.5 w-3.5" />
                          <span>Дел.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-md ring-1 ring-pink-100/50 animate-slide-up">
            
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-pink-400 to-pink-500" />
            
            <div className="p-8 pb-2">
              <h2 className="font-soledago text-2xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Создать вишлист' : 'Редактировать вишлист'}
              </h2>
            </div>
            
            <div className="px-8 overflow-y-auto max-h-[calc(90vh-140px)] pb-4">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Название праздника
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50 transition-all"
                    placeholder="День рождения, Новый год..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="eventDate"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Дата события
                  </label>
                  <input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white/90 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50 transition-all"
                  />
                </div>

                {/* БЛОК ПОДАРКОВ */}
                <div className="space-y-4 pb-2">
                  <div className="flex items-center justify-between sticky top-0 bg-gray-50/80 py-2 z-10 backdrop-blur-sm">
                    <p className="text-xs font-medium text-gray-700">
                      {modalMode === 'create' ? 'Стартовые подарки' : 'Подарки в вишлисте'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftGifts((prev) => [
                          ...prev,
                          {
                            id: Date.now(),
                            title: '',
                            link: '',
                            price: '',
                            imageUrl: '',
                            isEditing: true,
                          },
                        ]);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-900/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-gray-900"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Добавить подарок
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {/* Существующие подарки */}
                    {modalMode === 'edit' && editingWishlist?.gifts && editingWishlist.gifts.length > 0 && (
                      <>
                        <p className="text-[10px] font-medium text-gray-500 mb-2 sticky top-0 bg-white/90 py-1 z-20">
                          Существующие подарки:
                        </p>
                        {editingWishlist.gifts.map((gift) => {
                          const isEditingThisGift = draftGifts.some(g => g.editId === gift.id);
                          const editingGift = draftGifts.find(g => g.editId === gift.id);

                          return (
                            <div key={gift.id}>
                              {isEditingThisGift ? (
                                <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
                                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-gray-800 rounded-full text-[9px] font-medium text-white shadow-sm">
                                    ✏️ Редактирование
                                  </div>
                                  
                                  <div className="absolute right-3 top-3 flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editingGift?.title.trim() && editingGift?.price) {
                                          handleUpdateGift(gift.id, editingGift);
                                          setDraftGifts((prev) =>
                                            prev.filter((g) => g.editId !== gift.id),
                                          );
                                        }
                                      }}
                                      className="p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 rounded-lg hover:bg-emerald-100"
                                      title="Сохранить"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftGifts((prev) =>
                                          prev.filter((g) => g.editId !== gift.id),
                                        )
                                      }
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg hover:bg-red-50"
                                      title="Отменить"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  <div className="mt-6 space-y-3">
                                    <input
                                      type="text"
                                      value={editingGift?.title || ''}
                                      onChange={(e) =>
                                        setDraftGifts((prev) =>
                                          prev.map((g) =>
                                            g.editId === gift.id
                                              ? { ...g, title: e.target.value }
                                              : g,
                                          ),
                                        )
                                      }
                                      className="h-10 w-full rounded-xl border border-gray-200 bg-white/90 px-4 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                      placeholder="Название подарка *"
                                      autoFocus
                                    />
                                    <input
                                      type="url"
                                      value={editingGift?.link || ''}
                                      onChange={(e) =>
                                        setDraftGifts((prev) =>
                                          prev.map((g) =>
                                            g.editId === gift.id
                                              ? { ...g, link: e.target.value }
                                              : g,
                                          ),
                                        )
                                      }
                                      className="h-10 w-full rounded-xl border border-gray-200 bg-white/90 px-4 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                      placeholder="Ссылка на товар"
                                    />
                                    {editingGift && (
                                      <div className="mt-1 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!editingGift.link.trim()) return;
                                            parseDraftGiftUrl(editingGift.id, editingGift.link);
                                          }}
                                          disabled={
                                            !editingGift.link.trim() ||
                                            parsingGiftId === editingGift.id
                                          }
                                          className="text-[10px] font-medium text-pink-600 hover:text-pink-700 disabled:opacity-40"
                                        >
                                          {parsingGiftId === editingGift.id
                                            ? 'Парсим...'
                                            : 'Заполнить по ссылке'}
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex gap-3">
                                      <input
                                        type="number"
                                        min={0}
                                        value={editingGift?.price || ''}
                                        onChange={(e) =>
                                          setDraftGifts((prev) =>
                                            prev.map((g) =>
                                              g.editId === gift.id
                                                ? { ...g, price: e.target.value }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="h-10 w-1/3 rounded-xl border border-gray-200 bg-white/90 px-4 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                        placeholder="Цена *"
                                      />
                                      <input
                                        type="url"
                                        value={editingGift?.imageUrl || ''}
                                        onChange={(e) =>
                                          setDraftGifts((prev) =>
                                            prev.map((g) =>
                                              g.editId === gift.id
                                                ? { ...g, imageUrl: e.target.value }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="h-10 w-2/3 rounded-xl border border-gray-200 bg-white/90 px-4 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                        placeholder="Ссылка на фото"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                  {gift.image_url ? (
                                    <img
                                      src={gift.image_url}
                                      alt={gift.title}
                                      className="h-14 w-14 rounded-xl object-cover bg-gray-50 ring-2 ring-gray-100"
                                    />
                                  ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 ring-2 ring-gray-100">
                                      <PhotoIcon className="h-6 w-6 text-gray-500" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {gift.title}
                                    </p>
                                    <p className="text-xs text-pink-600 font-medium mt-0.5">
  {typeof gift.price === 'number' ? gift.price.toLocaleString('ru-RU') : '0'} ₽
</p>
                                    {gift.url && (
                                      <a 
                                        href={gift.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-gray-500 hover:text-pink-600 truncate block mt-1"
                                      >
                                        {gift.url.replace(/^https?:\/\//, '').substring(0, 30)}...
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraftGifts((prev) => [
                                          ...prev,
                                          {
                                            id: Date.now(),
                                            title: gift.title,
                                            link: gift.url || '',
                                            price: String(gift.price),
                                            imageUrl: gift.image_url || '',
                                            isEditing: true,
                                            editId: gift.id,
                                          },
                                        ]);
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-pink-600 transition-colors bg-white rounded-lg hover:bg-pink-50"
                                      title="Редактировать"
                                    >
                                      <PencilIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Удалить этот подарок?')) {
                                          handleDeleteGift(gift.id);
                                        }
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-red-600 transition-colors bg-white rounded-lg hover:bg-red-50"
                                      title="Удалить"
                                    >
                                      <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Новые подарки */}
                    {draftGifts.filter(g => !g.editId).length > 0 && (
                      <>
                        {modalMode === 'edit' && (
                          <p className="text-[10px] font-medium text-gray-500 mb-3 sticky top-0 z-20">
                            Новые подарки:
                          </p>
                        )}
                        {draftGifts
                          .filter((g) => !g.editId)
                          .map((gift) => {
                            const wishlistId = modalMode === 'create'
                              ? currentWishlistId
                              : editingId;
                            return (
                              <div
                                key={gift.id}
                                className="relative rounded-xl border border-gray-200 bg-gray-50/30 mt-6 p-6 shadow-sm"
                              >
                                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-gray-800 rounded-full text-[9px] font-medium text-white shadow-sm">
                                   Новый подарок
                                </div>
                                
                                {/* Кнопки - показываем ТОЛЬКО при редактировании */}
                                {modalMode === 'edit' && (
                                  <div className="absolute right-4 top-4 flex gap-1">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!gift.title.trim() || !gift.price) {
                                          alert('Введите название и цену');
                                          return;
                                        }

                                        if (!wishlistId) {
                                          alert('Сначала сохраните вишлист');
                                          return;
                                        }

                                        const parsedPrice = Number(gift.price);
                                        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
                                          alert('Некорректная цена');
                                          return;
                                        }

                                        try {
                                          const apiUrl = new URL(`${API_BASE_URL}/gifts/`);
                                          apiUrl.searchParams.set('title', gift.title.trim());
                                          apiUrl.searchParams.set('price', String(parsedPrice));
                                          apiUrl.searchParams.set('wishlist_id', String(wishlistId));
                                          if (gift.link.trim()) {
                                            apiUrl.searchParams.set('url', gift.link.trim());
                                          }
                                          if (gift.imageUrl.trim()) {
                                            apiUrl.searchParams.set('image_url', gift.imageUrl.trim());
                                          }

                                          const res = await fetch(apiUrl.toString(), {
                                            method: 'POST',
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                            },
                                          });

                                          if (!res.ok) {
                                            throw new Error('Не удалось создать подарок');
                                          }

                                          const created = await res.json();

                                          if (modalMode === 'edit' && editingWishlist) {
                                            setEditingWishlist({
                                              ...editingWishlist,
                                              gifts: [...(editingWishlist.gifts || []), created],
                                              gifts_count: (editingWishlist.gifts?.length || 0) + 1
                                            });
                                          }

                                          setWishlists((prev) =>
                                            prev.map((w) => {
                                              if (w.id === wishlistId) {
                                                return {
                                                  ...w,
                                                  gifts: [...(w.gifts || []), created],
                                                  gifts_count: (w.gifts?.length || 0) + 1
                                                };
                                              }
                                              return w;
                                            }),
                                          );

                                          setDraftGifts((prev) => prev.filter((g) => g.id !== gift.id));

                                        } catch (e) {
                                          console.error('Ошибка при создании подарка:', e);
                                          alert('Не удалось создать подарок');
                                        }
                                      }}
                                      className="p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 rounded-lg hover:bg-emerald-100"
                                      title="Сохранить"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftGifts((prev) =>
                                          prev.filter((g) => g.id !== gift.id),
                                        )
                                      }
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg hover:bg-red-50"
                                      title="Отменить"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                                
                                <div className="mt-8 space-y-4">
                                  <div>
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">
                                      Название подарка *
                                    </label>
                                    <input
                                      type="text"
                                      value={gift.title}
                                      onChange={(e) =>
                                        setDraftGifts((prev) =>
                                          prev.map((g) =>
                                            g.id === gift.id
                                              ? { ...g, title: e.target.value }
                                              : g,
                                          ),
                                        )
                                      }
                                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                      placeholder="Например, наушники"
                                      autoFocus
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">
                                      Ссылка на товар
                                    </label>
                                    <input
                                      type="url"
                                      value={gift.link}
                                      onChange={(e) =>
                                        setDraftGifts((prev) =>
                                          prev.map((g) =>
                                            g.id === gift.id
                                              ? { ...g, link: e.target.value }
                                              : g,
                                          ),
                                        )
                                      }
                                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                      placeholder="https://..."
                                    />
                                    <div className="mt-1 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!gift.link.trim()) return;
                                          parseDraftGiftUrl(gift.id, gift.link);
                                        }}
                                        disabled={
                                          !gift.link.trim() ||
                                          parsingGiftId === gift.id
                                        }
                                        className="text-[10px] font-medium text-pink-600 hover:text-pink-700 disabled:opacity-40"
                                      >
                                        {parsingGiftId === gift.id
                                          ? 'Парсим...'
                                          : 'Заполнить по ссылке'}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-3">
                                    <div className="w-1/3">
                                      <label className="block text-[10px] font-medium text-gray-500 mb-1">
                                        Цена *
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={gift.price}
                                        onChange={(e) =>
                                          setDraftGifts((prev) =>
                                            prev.map((g) =>
                                              g.id === gift.id
                                                ? { ...g, price: e.target.value }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div className="w-2/3">
                                      <label className="block text-[10px] font-medium text-gray-500 mb-1">
                                        Ссылка на фото
                                      </label>
                                      <input
                                        type="url"
                                        value={gift.imageUrl}
                                        onChange={(e) =>
                                          setDraftGifts((prev) =>
                                            prev.map((g) =>
                                              g.id === gift.id
                                                ? { ...g, imageUrl: e.target.value }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100/50"
                                        placeholder="https://..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    )}
                    
                    {draftGifts.length === 0 && (modalMode !== 'edit' || !editingWishlist?.gifts?.length) && (
                      <p className="text-center text-xs text-gray-500 py-8 bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                        {modalMode === 'create' 
                          ? ' Добавьте подарки, которые хотите получить' 
                          : ' В этом вишлисте пока нет подарков'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="group relative overflow-hidden rounded-full bg-gray-900/95 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900 hover:shadow-pink-200/50"
                >
                  <span className="relative z-10">
                    {modalMode === 'create' ? 'Создать' : 'Сохранить'}
                  </span>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}