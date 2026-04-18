import { useSyncExternalStore } from 'react';
import { getAll, subscribe } from '../data/accountsStore';

// Live view of the manual-accounts store. Components re-render whenever
// the store mutates (add / edit / delete / archive / cross-tab edit).
//
// Pass `{ includeArchived: true }` to see archived rows too — the
// management page wants them, the dashboard panels do not.
export default function useManualAccounts(options = {}) {
  const { includeArchived = false } = options;
  return useSyncExternalStore(
    subscribe,
    () => getAll({ includeArchived }),
    () => [],
  );
}
