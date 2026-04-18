import { useEffect, useRef, useState } from 'react';

// Poll a fetcher on mount + every `refreshMs`. Holds the last-good
// value when a fetch throws or returns null. The `producer` is read
// from a ref each tick so stale closures never fire.
//
// Also gates polling on document visibility — when the tab is hidden
// we don't waste network/CPU polling endpoints the user can't see.
// On visibilitychange → visible, we trigger an immediate tick so the
// data is fresh when the user comes back.
export default function useMarketData(producer, deps = [], refreshMs = 60_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const producerRef = useRef(producer);
  producerRef.current = producer;

  useEffect(() => {
    let alive = true;
    let timerId = null;

    async function tick() {
      try {
        const v = await producerRef.current();
        if (alive && v != null) {
          setData(v);
          setLoading(false);
        }
      } catch (_) { /* ignore; keep last value */ }
    }

    function start() {
      if (timerId != null) return;
      tick();
      if (!refreshMs) return;
      timerId = setInterval(tick, refreshMs);
    }
    function stop() {
      if (timerId != null) {
        clearInterval(timerId);
        timerId = null;
      }
    }
    function onVis() {
      if (document.visibilityState === 'visible') start();
      else stop();
    }

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      start();
    }
    document.addEventListener?.('visibilitychange', onVis);

    return () => {
      alive = false;
      stop();
      document.removeEventListener?.('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Reset loading when deps change so the caller can render a skeleton.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLoading(true); }, deps);

  return { data, loading };
}
