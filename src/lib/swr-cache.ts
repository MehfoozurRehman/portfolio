import type { Cache, State } from "swr";

const CACHE_KEY = "swr-cache";

export function localStorageProvider(): Cache {
  const stored = localStorage.getItem(CACHE_KEY);
  const map = new Map<string, State>(stored ? JSON.parse(stored) : []);

  window.addEventListener("beforeunload", () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(map.entries())));
  });

  return map as Cache;
}
