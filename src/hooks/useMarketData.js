import { useEffect, useState } from 'react';

// Thin hook: calls a fetcher on mount + every `refreshMs`, keeps the
// previous value while the next one resolves. If a fetcher throws or
// returns null we hold the last good value.
export default function useMarketData(producer, deps = [], refreshMs = 60_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const v = await producer();
        if (alive && v != null) {
          setData(v);
          setLoading(false);
        }
      } catch (_) { /* ignore; keep last value */ }
    }
    tick();
    if (!refreshMs) return () => { alive = false; };
    const t = setInterval(tick, refreshMs);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
