import type { Cache, State } from "swr";

const CACHE_KEY = "swr-cache";

/**
 * SWR cache provider backed by localStorage. The in-memory Map is hydrated
 * from localStorage on startup and persisted on unload, so previously fetched
 * data (GitHub profile + repos) stays available when the user is offline.
 */
export function localStorageProvider(): Cache {
  const stored = localStorage.getItem(CACHE_KEY);
  const map = new Map<string, State>(stored ? JSON.parse(stored) : []);

  window.addEventListener("beforeunload", () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(map.entries())));
  });

  return map as Cache;
}
