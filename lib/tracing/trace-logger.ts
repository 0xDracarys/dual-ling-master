/**
 * Trace Logger
 *
 * Enhanced logger that integrates trace context with the existing DebugLogger.
 * Automatically injects trace IDs into all logs and manages span tracking.
 *
 * Key Features:
 * - Wraps existing DebugLogger (doesn't replace it)
 * - Auto-injects trace context into log metadata
 * - Manages span lifecycle (start, end, duration)
 * - Stores spans in memory for trace aggregation
 * - Cleans up old traces to prevent memory leaks
 */

import { LogLevel, LogCategory } from '@/lib/types/logging';
import { getTraceContext } from './trace-storage';
import { generateSpanId } from './trace-storage';
import { Span } from './trace-context';
import { writeCloudLog, createCloudLogEntry, isCloudLoggingEnabled } from './cloud-logging-adapter';

/**
 * TraceLogger class that integrates with GCP Cloud Logging.
 * NOT a singleton - can be instantiated as needed, but typically used via singleton instance.
 */
export class TraceLogger {
  private spans: Map<string, Span[]>; // traceId -> Span[]
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_TRACE_AGE_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.spans = new Map();
    this.startCleanupTimer();
  }

  /**
   * Log a message with automatic trace context injection.
   *
   * **GCP Cloud Logging Integration:**
   * Automatically adds `trace`, `spanId`, and `traceSampled` fields in the format
   * required by Google Cloud Logging for automatic log-trace correlation.
   *
   * @param level - Log level (debug, info, success, warn, error)
   * @param category - Log category (Auth, Firestore, Storage, etc.)
   * @param message - Log message
   * @param metadata - Additional metadata (trace context will be auto-injected)
   *
   * @example
   * ```typescript
   * traceLogger.log('info', 'Auth', 'User registered successfully', { uid: 'user123' });
   * // Output includes GCP fields:
   * // {
   * //   uid: 'user123',
   * //   trace: 'projects/my-project/traces/550e8400e29b41d4a716446655440000',
   * //   spanId: '550e8400e29b41d4',
   * //   traceSampled: true
   * // }
   * ```
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: any
  ): void {
    const context = getTraceContext();

    // Get GCP project ID from environment
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Merge trace context with provided metadata
    const enhancedMetadata = {
      ...metadata,
      ...(context && {
        // GCP Cloud Logging required fields (for log-trace correlation)
        ...(projectId && {
          trace: `projects/${projectId}/traces/${context.traceId}`,
        }),
        spanId: context.spanId,
        traceSampled: true, // Always true for our use case (we want all traces)
        
        // Custom fields for backwards compatibility and debugging
        traceId: context.traceId, // Keep for easier debugging
        parentSpanId: context.parentSpanId,
        userId: context.userId,
        service: context.service,
        operation: context.operation,
      }),
    };

    // In production/Cloud Run: Write structured JSON logs for Cloud Logging
    // In development: Use console.log for debugging
    if (isCloudLoggingEnabled()) {
      const cloudLogEntry = createCloudLogEntry(level, category, message, enhancedMetadata);
      writeCloudLog(cloudLogEntry);
    } else {
      // Development mode: simple console logging
      const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      logMethod(`[${category}] ${message}`, enhancedMetadata || '');
    }
  }

  /**
   * Start a new span for an operation.
   * Returns the span ID which must be used to end the span.
   *
   * @param service - Service name (Auth, Firestore, Storage, etc.)
   * @param operation - Operation name (registerUser, createDocument, etc.)
   * @param metadata - Additional span metadata
   * @returns Span ID to be used with endSpan()
   *
   * @example
   * ```typescript
   * const spanId = traceLogger.startSpan('Auth', 'registerUser', { email: 'user@example.com' });
   * try {
   *   // ... perform operation
   *   traceLogger.endSpan(spanId, 'success');
   * } catch (error) {
   *   traceLogger.endSpan(spanId, 'error', { message: error.message });
   * }
   * ```
   */
  startSpan(
    service: string,
    operation: string,
    metadata?: Record<string, unknown>
  ): string {
    const context = getTraceContext();
    const spanId = generateSpanId();
    const startTime = new Date().toISOString();

    const span: Span = {
      spanId,
      parentSpanId: context?.spanId,
      service,
      operation,
      startTime,
      status: 'pending',
      metadata,
    };

    // Store span
    if (context) {
      const traceId = context.traceId;
      const existingSpans = this.spans.get(traceId) || [];
      existingSpans.push(span);
      this.spans.set(traceId, existingSpans);
    }

    // Log span start
    this.log('debug', service as LogCategory, `[SPAN START] ${operation}`, {
      spanId,
      parentSpanId: context?.spanId,
      ...metadata,
    });

    return spanId;
  }

  /**
   * End a span and calculate its duration.
   *
   * @param spanId - The span ID returned from startSpan()
   * @param status - Final status of the span (success or error)
   * @param error - Error information if status is 'error'
   *
   * @example
   * ```typescript
   * const spanId = traceLogger.startSpan('Auth', 'loginUser');
   * // ... perform operation
   * traceLogger.endSpan(spanId, 'success');
   * ```
   */
  endSpan(
    spanId: string,
    status: 'success' | 'error',
    error?: { message: string; stack?: string }
  ): void {
    const context = getTraceContext();
    if (!context) return;

    const traceId = context.traceId;
    const spans = this.spans.get(traceId);
    if (!spans) return;

    // Find the span
    const span = spans.find((s) => s.spanId === spanId);
    if (!span) return;

    // Update span
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(span.startTime).getTime();

    span.endTime = endTime;
    span.duration = duration;
    span.status = status;
    if (error) {
      span.error = error;
    }

    // Log span end
    const level: LogLevel = status === 'error' ? 'error' : 'success';
    this.log(level, span.service as LogCategory, `[SPAN END] ${span.operation} (${duration}ms)`, {
      spanId,
      duration,
      status,
      ...(error && { error }),
    });
  }

  /**
   * Get all spans for a specific trace.
   *
   * @param traceId - The trace ID
   * @returns Array of spans for this trace, or undefined if not found
   *
   * @example
   * ```typescript
   * const context = getTraceContext();
   * if (context) {
   *   const trace = traceLogger.getTrace(context.traceId);
   *   console.log('Total spans:', trace?.length);
   * }
   * ```
   */
  getTrace(traceId: string): Span[] | undefined {
    return this.spans.get(traceId);
  }

  /**
   * Get all active traces.
   *
   * @returns Map of traceId to spans
   */
  getAllTraces(): Map<string, Span[]> {
    return new Map(this.spans);
  }

  /**
   * Clear old traces to prevent memory leaks.
   * Removes traces older than MAX_TRACE_AGE_MS.
   */
  clearOldTraces(): void {
    const now = Date.now();
    const tracesToDelete: string[] = [];

    this.spans.forEach((spans, traceId) => {
      // Check if all spans in this trace are old
      const allSpansOld = spans.every((span) => {
        const spanTime = new Date(span.startTime).getTime();
        return now - spanTime > this.MAX_TRACE_AGE_MS;
      });

      if (allSpansOld) {
        tracesToDelete.push(traceId);
      }
    });

    // Delete old traces
    tracesToDelete.forEach((traceId) => {
      this.spans.delete(traceId);
    });

    if (tracesToDelete.length > 0) {
      this.log('debug', 'Performance', `Cleaned up ${tracesToDelete.length} old traces`);
    }
  }

  /**
   * Start periodic cleanup timer.
   * Automatically cleans up old traces every CLEANUP_INTERVAL_MS.
   */
  private startCleanupTimer(): void {
    // Only run cleanup in server environment
    if (typeof window !== 'undefined') return;

    this.cleanupInterval = setInterval(() => {
      this.clearOldTraces();
    }, this.CLEANUP_INTERVAL_MS);

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop the cleanup timer (for testing or shutdown).
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all traces (for testing or manual cleanup).
   */
  clearAllTraces(): void {
    this.spans.clear();
  }

  /**
   * Get trace logger statistics.
   */
  getStats(): {
    totalTraces: number;
    totalSpans: number;
    averageSpansPerTrace: number;
  } {
    const totalTraces = this.spans.size;
    let totalSpans = 0;

    this.spans.forEach((spans) => {
      totalSpans += spans.length;
    });

    return {
      totalTraces,
      totalSpans,
      averageSpansPerTrace: totalTraces > 0 ? totalSpans / totalTraces : 0,
    };
  }
}

/**
 * Singleton instance for convenience.
 * Use this instance throughout the application.
 */
export const traceLogger = new TraceLogger();
