'use client';

import { useEffect, useRef, useState } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const POLL_INTERVAL_MS = 30000;

function getWsUrl(base: string): string {
  const u = base.replace(/\/$/, '');
  if (u.startsWith('https://')) return `wss://${u.slice(8)}`;
  if (u.startsWith('http://')) return `ws://${u.slice(7)}`;
  return u;
}

interface Stats {
  total_collected: number;
  total_goal: number;
  recent_contributors: { name: string }[];
}

function getInitial(name: string): string {
  const n = (name || '').trim();
  return n ? n[0].toUpperCase() : '?';
}

export function LandingStatsCard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          total_collected: Number(data.total_collected ?? 0),
          total_goal: Number(data.total_goal ?? 0),
          recent_contributors: Array.isArray(data.recent_contributors)
            ? data.recent_contributors
            : [],
        });
      }
    } catch {
      setStats({
        total_collected: 0,
        total_goal: 0,
        recent_contributors: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchStats();

    const wsUrl = `${getWsUrl(API_BASE_URL)}/ws/landing`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === 'stats_updated') fetchStats();
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch {
      wsRef.current = null;
    }

    const t = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => {
      clearInterval(t);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const collected = stats?.total_collected ?? 0;
  const goal = stats?.total_goal ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
  const contributors = stats?.recent_contributors ?? [];

  return (
    <div className="group animate-card-2 rounded-2xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
        <CurrencyDollarIcon className="h-5 w-5 text-pink-600" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        Покупайте подарки друзьям вместе
      </h3>
      <p className="text-xs leading-relaxed text-gray-600">
        Скидывайтесь на подарки с прогресс-баром и понятной суммой — сколько уже
        собрано по всем вишлистам.
      </p>
      <div className="mt-2">
        <div className="flex items-center justify-between text-[9px] text-gray-500">
          <span>Собрано</span>
          {loading ? (
            <span className="font-semibold text-pink-600">…</span>
          ) : (
            <span className="font-semibold text-pink-600">
              {collected.toLocaleString('ru-RU')} / {goal.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {contributors.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {contributors.slice(0, 5).map((c, i) => (
              <div
                key={`${c.name}-${i}`}
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-pink-100 to-pink-200 text-[8px] font-medium text-pink-700"
                title={c.name}
              >
                {getInitial(c.name)}
              </div>
            ))}
          </div>
          <span className="text-[9px] text-gray-500">
            {contributors.length === 1
              ? '1 человек уже скинулся'
              : [2, 3, 4].includes(contributors.length % 10) && ![12, 13, 14].includes(contributors.length % 100)
                ? `${contributors.length} человека уже скинулись`
                : `${contributors.length} человек уже скинулись`}
          </span>
        </div>
      )}
    </div>
  );
}
