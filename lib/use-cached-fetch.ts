/**
 * useCachedFetch - Lightweight caching wrapper for useFocusEffect.
 *
 * Problem: Every tab switch triggers full API refetches (~21+ calls per
 * Home->Expenses->Groceries->Chores cycle). Data is rarely stale within
 * a few seconds of the last fetch.
 *
 * Solution: Track last-fetched timestamp per screen. On focus, only
 * refetch if data is older than `staleTime`. Pull-to-refresh always
 * bypasses the cache.
 *
 * Usage:
 *   const { refresh, onRefresh, refreshing } = useCachedFetch(fetchData, {
 *     staleTime: 30_000,   // 30 seconds (default)
 *     deps: [household?.id], // re-fetch when these change
 *   });
 *
 * - `refresh` is called automatically on focus (if stale) and can be
 *   called manually.
 * - `onRefresh` is a force-refresh for pull-to-refresh (sets refreshing
 *   state).
 * - The hook returns `refreshing` for RefreshControl.
 */

import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_STALE_TIME = 30_000; // 30 seconds

type CachedFetchOptions = {
  /** How long (ms) before data is considered stale. Default: 30000 (30s) */
  staleTime?: number;
  /** Dependencies that, when changed, invalidate the cache */
  deps?: unknown[];
};

export function useCachedFetch(
  fetchFn: () => Promise<void>,
  options: CachedFetchOptions = {}
) {
  const { staleTime = DEFAULT_STALE_TIME, deps = [] } = options;

  const lastFetchedAt = useRef<number>(0);
  const prevDepsRef = useRef<unknown[]>(deps);
  const [refreshing, setRefreshing] = useState(false);

  // Check if deps have changed (shallow comparison)
  const depsChanged = deps.length !== prevDepsRef.current.length ||
    deps.some((dep, i) => dep !== prevDepsRef.current[i]);

  if (depsChanged) {
    prevDepsRef.current = deps;
    // Invalidate cache when deps change so next focus will refetch
    lastFetchedAt.current = 0;
  }

  // Called on focus - only fetches if stale
  const fetchIfStale = useCallback(async () => {
    const now = Date.now();
    const elapsed = now - lastFetchedAt.current;

    if (elapsed < staleTime) {
      // Data is still fresh, skip fetch
      return;
    }

    lastFetchedAt.current = now;
    await fetchFn();
  }, [fetchFn, staleTime]);

  // Auto-fetch on screen focus (respects staleness)
  useFocusEffect(
    useCallback(() => {
      fetchIfStale();
    }, [fetchIfStale])
  );

  // Force refresh (bypasses cache) - for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchedAt.current = Date.now();
    await fetchFn();
    setRefreshing(false);
  }, [fetchFn]);

  // Manual refresh that also bypasses cache (for use after mutations)
  const refresh = useCallback(async () => {
    lastFetchedAt.current = Date.now();
    await fetchFn();
  }, [fetchFn]);

  // Invalidate cache (forces next focus to refetch)
  const invalidate = useCallback(() => {
    lastFetchedAt.current = 0;
  }, []);

  return { refresh, onRefresh, refreshing, invalidate };
}
