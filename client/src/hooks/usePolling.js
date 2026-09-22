import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoredUser } from '../utils/storage.js';

// Keeps a screen fresh by asking the server again every few seconds (a simple stand-in for websockets).
//
// With a `cacheKey`, the last successful result is also kept in sessionStorage (scoped to the logged-in user).
// The next time this page mounts - coming back from another screen - it renders that cached data immediately,
// with no spinner, while a fresh copy loads quietly in the background. This is what makes switching between
// pages feel instant instead of waiting for every screen to load from nothing each time.
function cacheRead(key) {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheWrite(key, value) {
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable: the page still works, it just will not remember this page's last state */
  }
}

export function usePolling(fetcher, intervalMs = 4000, deps = [], cacheKey = null) {
  const storageKey = cacheKey ? `powerlink.cache.${getStoredUser()?.id ?? 'anon'}.${cacheKey}` : null;
  const [data, setData] = useState(() => cacheRead(storageKey));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(() => cacheRead(storageKey) === null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  const inFlight = useRef(false);

  const load = useCallback(async (force) => {
    // A slow response must not pile up more requests behind it (a changed filter, force === true, always loads).
    if (inFlight.current && force !== true) return;
    inFlight.current = true;
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      cacheWrite(storageKeyRef.current, result);
    } catch (err) {
      setError(err);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    // A different page (or a different id within the same page, e.g. another job) may have been cached: show
    // that immediately rather than whatever the previous page left behind.
    const cached = cacheRead(storageKey);
    setData(cached);
    setLoading(cached === null);
    load(true);
    const id = setInterval(() => {
      if (active && !document.hidden) load();
    }, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, load, storageKey, ...deps]);

  return { data, error, loading, refresh: load, setData };
}
