/**
 * Trace Context Interfaces
 *
 * Defines the core types for the distributed tracing system.
 * These interfaces enable request tracking across services and components.
 */

/**
 * Trace context that flows through the entire request lifecycle.
 * Stored in AsyncLocalStorage and accessible throughout the request.
 */
export interface TraceContext {
  /** Unique identifier for this trace (shared across all operations in a request) */
  traceId: string;

  /** Current span identifier */
  spanId: string;

  /** Parent span identifier (for nested operations) */
  parentSpanId?: string;

  /** User ID associated with this request (if authenticated) */
  userId?: string;

  /** Service generating this trace (Auth, Course, Storage, etc.) */
  service: string;

  /** Operation being performed (registerUser, loginWithEmail, etc.) */
  operation: string;

  /** Timestamp when the trace started (ISO 8601) */
  startTime: string;

  /** Additional metadata for this trace */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a single operation span within a trace.
 * Multiple spans can exist within one trace.
 */
export interface Span {
  /** Unique identifier for this span */
  spanId: string;

  /** Parent span identifier (if this is a nested span) */
  parentSpanId?: string;

  /** Service executing this span */
  service: string;

  /** Operation name for this span */
  operation: string;

  /** Timestamp when the span started (ISO 8601) */
  startTime: string;

  /** Timestamp when the span ended (ISO 8601) */
  endTime?: string;

  /** Duration in milliseconds (calculated when span ends) */
  duration?: number;

  /** Status of the span (success, error, pending) */
  status: 'success' | 'error' | 'pending';

  /** Error information if span failed */
  error?: {
    message: string;
    stack?: string;
  };

  /** Additional metadata for this span */
  metadata?: Record<string, unknown>;
}

/**
 * Complete trace record containing all spans for a request.
 * Used for trace aggregation and analysis.
 */
export interface Trace {
  /** Unique identifier for this trace */
  traceId: string;

  /** User ID associated with this trace (if authenticated) */
  userId?: string;

  /** HTTP route that initiated this trace */
  route?: string;

  /** HTTP method (GET, POST, etc.) */
  method?: string;

  /** HTTP status code of the response */
  statusCode?: number;

  /** All spans belonging to this trace */
  spans: Span[];

  /** Timestamp when the trace started (ISO 8601) */
  startTime: string;

  /** Timestamp when the trace ended (ISO 8601) */
  endTime?: string;

  /** Total duration of the entire trace in milliseconds */
  totalDuration?: number;

  /** Overall status of the trace */
  status: 'success' | 'error' | 'pending';
}
