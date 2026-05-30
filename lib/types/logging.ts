/**
 * Shared Logging Types
 * 
 * Type definitions for logging levels and categories used across the application.
 * These types are used by GCP Cloud Logging and trace-logger utilities.
 */

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

export type LogCategory = 
  | 'Auth' 
  | 'Firestore' 
  | 'Storage' 
  | 'API' 
  | 'UI' 
  | 'Performance' 
  | 'Error'
  | string; // Allow custom categories
