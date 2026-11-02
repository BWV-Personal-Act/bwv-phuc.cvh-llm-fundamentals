const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with full jitter: delay = random(0, min(cap, base * 2^(attempt-1)))
export async function withRetry(fn, {
  maxAttempts = 3,
  baseMs = 500,
  capMs = 8000,
  isRetryable = () => true,
  onRetry = () => {},
  sleepFn = sleep,
  random = Math.random,
} = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryable(error)) throw error;
      const delayMs = Math.round(random() * Math.min(capMs, baseMs * 2 ** (attempt - 1)));
      onRetry({ attempt, delayMs, error });
      await sleepFn(delayMs);
    }
  }
}
