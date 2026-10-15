/**
 * Process-wide cache for the founder roadmap snapshot.
 * Stored on globalThis so Next.js route bundles share one copy.
 * Writes call invalidateRoadmapCache(); reads expire after a minute
 * even if a write path forgets to invalidate.
 */

const TTL_MS = 60_000;

type Entry = { at: number; generation: number; data: unknown };

type CacheState = {
  generation: number;
  cached: Entry | null;
  inflight: { generation: number; promise: Promise<unknown> } | null;
};

function state(): CacheState {
  const g = globalThis as typeof globalThis & {
    __elahRoadmapPageCache?: CacheState;
  };
  if (!g.__elahRoadmapPageCache) {
    g.__elahRoadmapPageCache = { generation: 0, cached: null, inflight: null };
  }
  return g.__elahRoadmapPageCache;
}

export function invalidateRoadmapCache(): void {
  const current = state();
  current.generation += 1;
  current.cached = null;
  current.inflight = null;
}

export async function readRoadmapCache<T>(load: () => Promise<T>): Promise<T> {
  const current = state();
  const now = Date.now();
  if (current.cached && now - current.cached.at < TTL_MS) {
    return current.cached.data as T;
  }

  const started = current.generation;
  if (!current.inflight || current.inflight.generation !== started) {
    const promise = load().then((data) => {
      const latest = state();
      if (latest.generation === started) {
        latest.cached = { at: Date.now(), generation: started, data };
      }
      return data;
    });
    current.inflight = { generation: started, promise };
    void promise.finally(() => {
      const latest = state();
      if (latest.inflight?.promise === promise) latest.inflight = null;
    });
  }

  return current.inflight.promise as Promise<T>;
}
