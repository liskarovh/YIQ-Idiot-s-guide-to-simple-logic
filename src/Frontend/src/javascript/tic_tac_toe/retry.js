// Placeholder for future backoff/retry. For now: pass-through.
export async function withRetry(fn /*, { retries = 0, baseMs = 200 } = {} */) {
  return await fn();
}
