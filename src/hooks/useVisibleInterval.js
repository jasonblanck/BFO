import { useEffect, useRef } from 'react';

// setInterval that only ticks while the tab is visible. When the user
// switches away, the timer clears; when they return, it kicks off
// again (and fires once immediately so state catches up). Use this
// anywhere the UI is running live jitter / streaming / pollers that
// don't need to progress off-screen.
export default function useVisibleInterval(fn, ms) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!ms) return;
    let id = null;
    const tick = () => fnRef.current?.();
    const start = () => {
      if (id != null) return;
      id = setInterval(tick, ms);
    };
    const stop = () => {
      if (id != null) { clearInterval(id); id = null; }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') { tick(); start(); }
      else stop();
    };

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      start();
    }
    document.addEventListener?.('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener?.('visibilitychange', onVis);
    };
  }, [ms]);
}
