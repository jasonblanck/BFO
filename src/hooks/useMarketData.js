import { useEffect, useRef, useState } from 'react';

// Poll a fetcher on mount + every `refreshMs`. Holds the last-good
// value when a fetch throws or returns null. The `producer` is read
// from a ref each tick so stale closures never fire — callers don't
// have to worry about re-creating the arrow fn on every render.
export default function useMarketData(producer, deps = [], refreshMs = 60_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const producerRef = useRef(producer);
  producerRef.current = producer;

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const v = await producerRef.current();
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
