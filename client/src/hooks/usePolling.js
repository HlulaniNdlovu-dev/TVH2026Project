import { useCallback, useEffect, useRef, useState } from 'react';

// Keeps a screen fresh by asking the server again every few seconds (a simple stand-in for websockets).
export function usePolling(fetcher, intervalMs = 4000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load();
    const id = setInterval(() => {
      if (active && !document.hidden) load();
    }, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, load, ...deps]);

  return { data, error, loading, refresh: load, setData };
}
