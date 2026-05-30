/**
 * Trace Storage
 *
 * Manages trace context using AsyncLocalStorage for request-scoped storage.
 * This allows trace context to propagate automatically through async operations
 * without explicitly passing it as a parameter.
 *
 * NOTE: This is server-side only (Node.js runtime).
 * - AsyncLocalStorage is NOT available in Edge Runtime or browser
 * - Use Web Crypto API for UUID generation (works in both runtimes)
 */

import { TraceContext } from './trace-context';

// Conditional import for AsyncLocalStorage (Node.js runtime only)
let AsyncLocalStorage: any;
let traceStorageInstance: any;

try {
  // Only import in Node.js runtime (not Edge Runtime)
  if (typeof process !== 'undefined' && process.versions?.node) {
    AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;
    traceStorageInstance = new AsyncLocalStorage();
  }
} catch (e) {
  // Edge Runtime or browser - AsyncLocalStorage not available
}

/**
 * Singleton AsyncLocalStorage instance for storing trace context.
 * This storage is request-scoped and automatically propagates through
 * async operations within the same request.
 *
 * Only available in Node.js runtime (API routes).
 * Will be undefined in Edge Runtime (middleware).
 */
export const traceStorage = traceStorageInstance;

/**
 * Gets the current trace context from AsyncLocalStorage.
 *
 * @returns The current trace context, or undefined if not in a traced context
 *
 * @example
 * ```typescript
 * const context = getTraceContext();
 * if (context) {
 *   console.log('Current trace ID:', context.traceId);
 * }
 * ```
 */
export function getTraceContext(): TraceContext | undefined {
  if (!traceStorage) return undefined;
  return traceStorage.getStore();
}

/**
 * Generates a unique trace ID using Web Crypto API.
 * Works in both Node.js and Edge Runtime.
 *
 * **GCP Format Compliance:**
 * Returns 32-character hexadecimal string (no hyphens) as required by
 * Google Cloud Trace. This enables proper log-trace correlation in Cloud Logging.
 *
 * @returns A unique trace ID string (32 hex chars, GCP-compliant)
 *
 * @example
 * ```typescript
 * const traceId = generateTraceId();
 * // Returns: "550e8400e29b41d4a716446655440000" (GCP format)
 * ```
 */
export function generateTraceId(): string {
  // Use Web Crypto API (available in both Node.js and Edge Runtime)
  // Remove hyphens to match GCP's 32-character hex format
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Generates a unique span ID using a shortened UUID.
 * Span IDs are shorter than trace IDs for efficiency.
 *
 * **GCP Format Compliance:**
 * Returns 16-character hexadecimal string (no hyphens) representing a 64-bit value
 * as required by Google Cloud Trace. This enables proper span hierarchy visualization.
 *
 * @returns A unique span ID string (16 hex chars, GCP-compliant)
 *
 * @example
 * ```typescript
 * const spanId = generateSpanId();
 * // Returns: "550e8400e29b41d4" (GCP format, 16 hex chars)
 * ```
 */
export function generateSpanId(): string {
  // Generate UUID and remove hyphens to get 32 hex chars
  const uuid = crypto.randomUUID().replace(/-/g, '');
  // Take first 16 chars (64 bits) for GCP span ID format
  return uuid.substring(0, 16);
}

/**
 * Creates a new trace context with the provided options.
 * If traceId is not provided, a new one is generated.
 * If spanId is not provided, a new one is generated.
 *
 * @param options - Partial trace context options
 * @returns A complete trace context object
 *
 * @example
 * ```typescript
 * const context = createTraceContext({
 *   service: 'Auth',
 *   operation: 'registerUser',
 *   userId: 'user123',
 * });
 *
 * // Use with traceStorage.run():
 * traceStorage.run(context, async () => {
 *   // All async operations here have access to the context
 *   await someAsyncOperation();
 * });
 * ```
 */
export function createTraceContext(
  options: Partial<TraceContext> & Pick<TraceContext, 'service' | 'operation'>
): TraceContext {
  return {
    traceId: options.traceId || generateTraceId(),
    spanId: options.spanId || generateSpanId(),
    parentSpanId: options.parentSpanId,
    userId: options.userId,
    service: options.service,
    operation: options.operation,
    startTime: options.startTime || new Date().toISOString(),
    metadata: options.metadata || {},
  };
}
