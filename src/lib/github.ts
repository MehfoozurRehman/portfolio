// Fetches the contribution calendar at build time so the page ships it as
// static SVG: no client JS, no third-party request, no layout shift.

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

const API = 'https://github-contributions-api.jogruber.de/v4';

type Contributions = { days: Day[]; total: number } | null;
const cache = new Map<string, Promise<Contributions>>();

/** Memoised so several components can use the data with a single request per build. */
export function getContributions(username: string): Promise<Contributions> {
  if (!cache.has(username)) cache.set(username, fetchContributions(username));
  return cache.get(username)!;
}

async function fetchContributions(username: string): Promise<Contributions> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API}/${username}?y=last`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { contributions: Day[]; total?: Record<string, number> };
    const days = json.contributions;
    if (!Array.isArray(days) || days.length === 0) return null;
    const total = days.reduce((sum, d) => sum + d.count, 0);
    return { days, total };
  } catch (err) {
    console.warn('[github] contribution fetch failed, rendering fallback:', err instanceof Error ? err.message : err);
    return null;
  }
}
