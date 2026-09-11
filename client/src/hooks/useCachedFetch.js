import { useState, useEffect, useCallback, useRef } from 'react';

const PREFIX = 'cjj-cache:';
const MAX_AGE_MS = 60 * 60 * 1000;
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
export function useCachedFetch(key, fetcher, { enabled = true, persist = true } = {}) {
  const initial = enabled && key ? readCache(key) : undefined;
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled && !!key && initial === undefined);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const runId = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !key) {
      setLoading(false);
      return;
    }
    const id = ++runId.current;
    const cached = readCache(key);
    setData(cached);
    setLoading(cached === undefined);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (id !== runId.current) return;
      writeCache(key, result, persist);
      setData(result);
    } catch (err) {
      if (id === runId.current) setError(err);
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }, [key, enabled, persist]);

  useEffect(() => {
    load();
    return () => { runId.current++; };
  }, [load]);

  return { data, loading, error, refetch: load, setData };
}
