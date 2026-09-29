import { useState, useEffect, useCallback, useRef } from 'react';
import { withRetry } from '../utils/api';

const PREFIX = 'cjj-cache:';
const MAX_AGE_MS = 60 * 60 * 1000;
const AUTO_RETRY_DELAYS = [4000, 8000, 15000, 30000];
const memory = new Map();

function readCache(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > MAX_AGE_MS) {
      localStorage.removeItem(PREFIX + key);
      return undefined;
    }
    memory.set(key, v);
    return v;
  } catch {
    return undefined;
  }
}

function writeCache(key, value, persist) {
  memory.set(key, value);
  if (!persist) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {}
}

export function clearDataCache() {
  memory.clear();
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// Affiche immédiatement la dernière valeur connue, puis rafraîchit en arrière-plan.
// Un échec réseau est réessayé en silence ; on ne signale une erreur que si
// l'on n'a vraiment rien à afficher, et on continue de réessayer tout seul.
export function useCachedFetch(key, fetcher, { enabled = true, persist = true } = {}) {
  const initial = enabled && key ? readCache(key) : undefined;
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled && !!key && initial === undefined);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const runId = useRef(0);
  const autoRetry = useRef({ count: 0, timer: null });

  const clearAutoRetry = () => {
    if (autoRetry.current.timer) {
      clearTimeout(autoRetry.current.timer);
      autoRetry.current.timer = null;
    }
  };

  const load = useCallback(async () => {
    if (!enabled || !key) {
      setLoading(false);
      return;
    }
    clearAutoRetry();
    const id = ++runId.current;
    const cached = readCache(key);
    setData(cached);
    setLoading(cached === undefined);
    try {
      const result = await withRetry(() => fetcherRef.current());
      if (id !== runId.current) return;
      writeCache(key, result, persist);
      setData(result);
      setError(null);
      autoRetry.current.count = 0;
    } catch (err) {
      if (id !== runId.current) return;
      const definitive = err?.status && err.status < 500 && err.status !== 429;
      setError(err);
      if (!definitive && readCache(key) === undefined) {
        const n = autoRetry.current.count;
        const delay = AUTO_RETRY_DELAYS[Math.min(n, AUTO_RETRY_DELAYS.length - 1)];
        autoRetry.current.count = n + 1;
        autoRetry.current.timer = setTimeout(() => { if (id === runId.current) load(); }, delay);
      }
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }, [key, enabled, persist]);

  useEffect(() => {
    load();
    return () => { runId.current++; clearAutoRetry(); };
  }, [load]);

  // Retour sur l'app (onglet, PWA) ou retour du réseau : on rafraîchit sans vider l'écran
  useEffect(() => {
    if (!enabled || !key) return;
    let last = Date.now();
    const refresh = (force) => {
      if (document.visibilityState !== 'visible') return;
      if (!force && Date.now() - last < 15000) return;
      last = Date.now();
      load();
    };
    const onVisible = () => refresh(false);
    const onOnline = () => refresh(true);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [load, enabled, key]);

  // failed = rien à afficher ET la dernière tentative a échoué
  const failed = !!error && data === undefined;

  return { data, loading, error, failed, refetch: load, setData };
}
