/**
 * Cloud Logging Adapter
 * 
 * Writes structured JSON logs to stdout in the format expected by Google Cloud Logging.
 * This enables automatic log ingestion, severity mapping, and trace correlation.
 * 
 * **Why This Exists:**
 * - DebugLogger uses console.log with formatting (works for dev, not for production)
 * - Cloud Logging expects structured JSON written to stdout
 * - Must include specific fields: severity, trace, spanId, etc.
 * 
 * **Integration:**
 * - Called by TraceLogger to write GCP-compliant logs
 * - Falls back to console.log in development
 * - Used in API routes running on Cloud Run
 */

import { LogLevel, LogCategory } from '@/lib/types/logging';

/**
 * Google Cloud Logging severity levels.
 * Maps to Cloud Logging's severity enum.
 * 
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
 */
export type CloudLoggingSeverity = 
  | 'DEBUG'      // 100
  | 'INFO'       // 200
  | 'NOTICE'     // 300
  | 'WARNING'    // 400
  | 'ERROR'      // 500
  | 'CRITICAL'   // 600
  | 'ALERT'      // 700
  | 'EMERGENCY'; // 800

/**
 * Structured log entry format for Google Cloud Logging.
 * 
 * @see https://cloud.google.com/logging/docs/structured-logging
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
 */
export interface CloudLogEntry {
  // Required Cloud Logging fields
  severity: CloudLoggingSeverity;
  message: string;
  timestamp?: string; // ISO 8601 timestamp (auto-generated if not provided)
  
  // GCP trace correlation fields (for linking logs to traces)
  'logging.googleapis.com/trace'?: string;      // Full trace resource path
  'logging.googleapis.com/spanId'?: string;     // Span ID (16 hex chars)
  'logging.googleapis.com/trace_sampled'?: boolean; // Whether trace is sampled
  
  // Custom fields (application-specific)
  category?: LogCategory;
  traceId?: string;        // Short trace ID (for backward compat)
  userId?: string;
  service?: string;
  operation?: string;
  
  // Additional metadata
  [key: string]: unknown;
}

/**
 * Maps our internal log levels to GCP Cloud Logging severity levels.
 * 
 * @param level - Our internal log level
 * @returns GCP Cloud Logging severity
 */
export function mapLogLevelToSeverity(level: LogLevel): CloudLoggingSeverity {
  const severityMap: Record<LogLevel, CloudLoggingSeverity> = {
    debug: 'DEBUG',
    info: 'INFO',
    success: 'NOTICE', // GCP doesn't have "success", use NOTICE
    warn: 'WARNING',
    error: 'ERROR',
  };
  
  return severityMap[level] || 'INFO';
}

/**
 * Writes a structured JSON log entry to stdout.
 * This is the format Cloud Logging expects.
 * 
 * **How Cloud Logging Works:**
 * 1. Cloud Run captures stdout/stderr
 * 2. If stdout contains valid JSON with specific fields, Cloud Logging parses it
 * 3. Otherwise, treats it as plain text
 * 
 * **Critical Fields:**
 * - `severity`: Maps to log level filter in Cloud Logging UI
 * - `message`: Main log message (searchable)
 * - `logging.googleapis.com/trace`: Links log to trace (enables "View Trace" button)
 * - `logging.googleapis.com/spanId`: Links log to specific span
 * - `logging.googleapis.com/trace_sampled`: Whether trace is sampled
 * 
 * @param entry - Structured log entry
 * 
 * @example
 * ```typescript
 * writeCloudLog({
 *   severity: 'INFO',
 *   message: 'User registered successfully',
 *   'logging.googleapis.com/trace': 'projects/my-project/traces/550e8400e29b41d4a716446655440000',
 *   'logging.googleapis.com/spanId': '550e8400e29b41d4',
 *   'logging.googleapis.com/trace_sampled': true,
 *   userId: 'user123',
 *   category: 'Auth',
 * });
 * ```
 * 
 * Result in Cloud Logging:
 * - ✅ Severity: INFO
 * - ✅ Message: "User registered successfully"
 * - ✅ "View Trace" button appears (links to Cloud Trace)
 * - ✅ Custom fields visible in log details
 */
export function writeCloudLog(entry: CloudLogEntry): void {
  // In production (Cloud Run), write structured JSON to stdout
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_CLOUD_LOGGING === 'true') {
    // Add ISO 8601 timestamp if not provided
    const logEntry: CloudLogEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    
    // Write to stdout as single-line JSON (required by Cloud Logging)
    // IMPORTANT: Must be valid JSON on a single line
    console.log(JSON.stringify(logEntry));
  } else {
    // In development, use formatted console output for readability
    const icon = {
      DEBUG: '🐛',
      INFO: 'ℹ️',
      NOTICE: '✅',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🔥',
      ALERT: '🚨',
      EMERGENCY: '💥',
    }[entry.severity];
    
    console.log(
      `${icon} [${entry.category || 'LOG'}] ${entry.message}`,
      entry
    );
  }
}

/**
 * Creates a Cloud Logging entry from TraceLogger parameters.
 * Handles all the field mapping and formatting.
 * 
 * @param level - Our internal log level
 * @param category - Log category
 * @param message - Log message
 * @param metadata - Additional metadata (trace context, etc.)
 * @returns Structured Cloud Logging entry
 */
export function createCloudLogEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>
): CloudLogEntry {
  const severity = mapLogLevelToSeverity(level);
  
  // Extract GCP trace fields from metadata (added by TraceLogger)
  const traceField = metadata?.['trace'] as string | undefined;
  const spanIdField = metadata?.['spanId'] as string | undefined;
  const traceSampledField = metadata?.['traceSampled'] as boolean | undefined;
  
  // Build structured log entry
  const logEntry: CloudLogEntry = {
    severity,
    message,
    category,
    
    // GCP trace correlation fields (using official field names)
    ...(traceField && {
      'logging.googleapis.com/trace': traceField,
    }),
    ...(spanIdField && {
      'logging.googleapis.com/spanId': spanIdField,
    }),
    ...(traceSampledField !== undefined && {
      'logging.googleapis.com/trace_sampled': traceSampledField,
    }),
    
    // Include all other metadata (flattened)
    ...metadata,
  };
  
  return logEntry;
}

/**
 * Environment detection utilities
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || 
         process.env.K_SERVICE !== undefined || // Cloud Run indicator
         process.env.GOOGLE_CLOUD_PROJECT !== undefined;
}

export function isCloudLoggingEnabled(): boolean {
  return isProductionEnvironment() || 
         process.env.NEXT_PUBLIC_ENABLE_CLOUD_LOGGING === 'true';
}
