'use client';

import { useEffect, useRef, useState } from 'react';

// Базовый URL: отдельная переменная для WS или тот же хост, что и API
const RAW_WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8000';

function normalizeWsBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, '');
  let out: string;
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    out = trimmed;
  } else if (trimmed.startsWith('http://')) {
    out = `ws://${trimmed.slice('http://'.length)}`;
  } else if (trimmed.startsWith('https://')) {
    out = `wss://${trimmed.slice('https://'.length)}`;
  } else {
    out = trimmed;
  }
  // Бэкенд ожидает путь /ws/wishlists/{wishlist_id} — если в URL только хост, добавляем путь
  if (!out.includes('/ws/wishlists')) {
    out = out.replace(/\/?$/, '') + '/ws/wishlists';
  }
  return out;
}

const WS_BASE_URL = normalizeWsBaseUrl(RAW_WS_BASE_URL);

export type WishlistSocketEvent =
  | {
      type: 'item_reserved';
      giftId: number;
      userId?: number;
      userName?: string;
    }
  | {
      type: 'contribution_added';
      giftId: number;
      amount: number;
      total: number;
      userId?: number;
      userName?: string;
    }
  | {
      type: 'gift_added';
      giftId: number;
      gift: Record<string, unknown>;
    };

interface UseWishlistSocketResult {
  lastEvent: WishlistSocketEvent | null;
  connected: boolean;
  error: string | null;
}

export function useWishlistSocket(wishlistId: number | null): UseWishlistSocketResult {
  const [lastEvent, setLastEvent] = useState<WishlistSocketEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!wishlistId || wishlistId <= 0) {
      return;
    }

    let isMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000;

    const connect = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      try {
        const url = `${WS_BASE_URL}/${Number(wishlistId)}`;
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) {
            socket.close();
            return;
          }
          setConnected(true);
          setError(null);
          reconnectAttempts = 0;
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setConnected(false);

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) connect();
            }, reconnectDelay * reconnectAttempts);
          } else {
            setError('Не удалось подключиться к серверу');
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setError('Ошибка подключения к WebSocket');
        };

        socket.onmessage = (event: MessageEvent) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'item_reserved') {
              setLastEvent({
                type: 'item_reserved',
                giftId: Number(data.gift_id ?? data.giftId),
                userId: data.user_id != null ? Number(data.user_id) : undefined,
                userName: data.user_name,
              });
            } else if (data?.type === 'contribution_added') {
              setLastEvent({
                type: 'contribution_added',
                giftId: Number(data.gift_id ?? data.giftId),
                amount: Number(data.amount),
                total: Number(data.total),
                userId: data.user_id != null ? Number(data.user_id) : undefined,
                userName: data.user_name,
              });
            } else if (data?.type === 'gift_added' && data.gift) {
              setLastEvent({
                type: 'gift_added',
                giftId: Number(data.gift_id ?? data.giftId ?? data.gift?.id),
                gift: data.gift,
              });
            }
          } catch {
            // игнорируем некорректные сообщения
          }
        };
      } catch (e) {
        if (!isMounted) return;
        setError('Ошибка создания WebSocket соединения');
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [wishlistId]);

  return { lastEvent, connected, error };
}

