export interface RetryOptions {
  /** Total attempts before failing (default: 3) */
  attempts?: number;
  /** Base delay in milliseconds for the first retry (default: 500ms) */
  baseDelayMs?: number;
  /** Multiplier applied to the delay after each failed attempt (default: 3) */
  multiplier?: number;
  /** Maximum delay allowed across retries (default: 10 seconds) */
  maxDelayMs?: number;
  /** Apply a small random jitter to reduce thundering herd issues (default: true) */
  jitter?: boolean;
  /** Optional callback fired after each failed attempt */
  onAttemptError?: (context: { attempt: number; error: Error }) => void;
}

const defaultOptions: Required<Omit<RetryOptions, 'onAttemptError'>> = {
  attempts: 3,
  baseDelayMs: 500,
  multiplier: 3,
  maxDelayMs: 10_000,
  jitter: true
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with exponential backoff retries.
 * The operation receives the current attempt number (1-indexed).
 */
export async function withExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const merged = { ...defaultOptions, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= merged.attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error('Unknown error');
      lastError = normalizedError;

      merged.onAttemptError?.({ attempt, error: normalizedError });

      if (attempt >= merged.attempts) {
        break;
      }

      const exponentialDelay = Math.min(
        merged.baseDelayMs * Math.pow(merged.multiplier, attempt - 1),
        merged.maxDelayMs
      );
      const jitter = merged.jitter ? Math.floor(Math.random() * 100) : 0;
      await sleep(exponentialDelay + jitter);
    }
  }

  throw lastError ?? new Error('Operation failed after retries');
}
