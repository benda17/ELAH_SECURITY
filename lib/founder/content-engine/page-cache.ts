/** Shared by the content-engine route bundles. Writes clear it; reads last 30s. */

const TTL_MS = 30_000;

type Era = "v1" | "v2";

type Slot = { at: number; generation: number; data: unknown };

type CacheState = {
  generation: number;
  v1: Slot | null;
  v2: Slot | null;
};

function state(): CacheState {
  const g = globalThis as typeof globalThis & {
    __elahContentPageCache?: CacheState;
  };
  if (!g.__elahContentPageCache) {
    g.__elahContentPageCache = { generation: 0, v1: null, v2: null };
  }
  return g.__elahContentPageCache;
}

export function invalidateContentEngineCache(): void {
  const current = state();
  current.generation += 1;
  current.v1 = null;
  current.v2 = null;
}

export async function readContentEngineCache<T>(era: Era, load: () => Promise<T>): Promise<T> {
  const current = state();
  const hit = current[era];
  if (
    hit &&
    hit.generation === current.generation &&
    Date.now() - hit.at < TTL_MS
  ) {
    return hit.data as T;
  }

  const started = current.generation;
  const data = await load();
  const latest = state();
  if (latest.generation === started) {
    latest[era] = { at: Date.now(), generation: started, data };
  }
  return data;
}
