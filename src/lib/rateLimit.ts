/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Works well for single-process deployments (traditional Node server).
 * On Vercel/serverless each function instance has its own memory, so the
 * effective limit is per-instance — still blocks rapid single-client bursts.
 * For true distributed rate-limiting across instances, swap this out for
 * Upstash Redis + @upstash/ratelimit.
 */

interface Window {
  timestamps: number[];
  lastCleanup: number;
}

const store = new Map<string, Window>();

// Prune the global map every 5 minutes to prevent unbounded growth
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPrune = Date.now();

function pruneStore(windowMs: number) {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  const cutoff = now - windowMs;
  for (const [key, win] of store.entries()) {
    if (win.lastCleanup < cutoff) store.delete(key);
  }
}

/**
 * Returns `{ allowed: true }` if the request should proceed,
 * or `{ allowed: false, retryAfterMs }` if the caller is over limit.
 *
 * @param key      Unique identifier — typically the client IP
 * @param limit    Max requests allowed in the window
 * @param windowMs Rolling window size in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  pruneStore(windowMs);

  const win = store.get(key) ?? { timestamps: [], lastCleanup: now };
  // Discard timestamps outside the current window
  win.timestamps = win.timestamps.filter((t) => t > cutoff);

  if (win.timestamps.length >= limit) {
    // Earliest timestamp in window + windowMs = when a slot frees up
    const retryAfterMs = win.timestamps[0] + windowMs - now;
    store.set(key, { ...win, lastCleanup: now });
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  win.timestamps.push(now);
  win.lastCleanup = now;
  store.set(key, win);
  return { allowed: true };
}
