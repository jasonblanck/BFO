import { useSyncExternalStore } from 'react';

// Single shared MutationObserver for the whole tree. Previously each
// consumer installed its own observer on <html> + tracked its own state,
// which meant a theme flip triggered N observers firing + N setState
// calls across the tree. Now it's one observer, one source of truth,
// and every consumer subscribes via React's external-store primitive.

let listeners = new Set();
let observer = null;

function read() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.theme === 'light';
}

function emit() {
  listeners.forEach((l) => l());
}

function ensureObserver() {
  if (observer || typeof document === 'undefined') return;
  observer = new MutationObserver(emit);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

function subscribe(cb) {
  ensureObserver();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

export default function useIsLight() {
  // useSyncExternalStore ships a single snapshot to all consumers, so
  // the React scheduler can batch their updates into one tick.
  return useSyncExternalStore(subscribe, read, () => false);
}

// Back-compat hook — some legacy useEffect-based consumers relied on
// the boolean flipping via state. useSyncExternalStore is strictly
// better (synchronous, tear-free) so just re-export as default.
export { useIsLight };
