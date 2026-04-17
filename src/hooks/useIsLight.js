import { useEffect, useState } from 'react';

// Track the current theme by observing the data-theme attribute on <html>.
// Returns true when light mode is active. Use this for imperative styling
// that can't be expressed through Tailwind / CSS selectors (e.g. Recharts
// stroke/fill props, SVG `stroke="..."` attributes).
export default function useIsLight() {
  const [light, setLight] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'light'
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const sync = () => setLight(el.dataset.theme === 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  return light;
}
