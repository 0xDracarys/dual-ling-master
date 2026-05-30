/**
 * Firebase Cloud Functions Entry Point
 * 
 * Exports all Cloud Functions for the DualLing platform.
 */

import { recordingCleanup } from './recordingCleanup';

// Export all functions
export { recordingCleanup };
