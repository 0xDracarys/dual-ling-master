/**
 * Token Tracker Service
 * 
 * Logs AI token usage to Firestore for cost transparency and billing.
 * Teachers can see exactly how much AI usage costs them.
 * 
 * Pricing (Gemini 2.5 Flash):
 * - Input: $0.075 per 1M tokens
 * - Output: $0.30 per 1M tokens
 * - Cached input: $0.01875 per 1M tokens (75% discount!)
 * 
 * @see https://ai.google.dev/gemini-api/docs/tokens?lang=node
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

const db = getAdminDb();

export interface TokenUsageData {
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  model: string;
  operation: 'course_creation' | 'lesson_generation' | 'chat' | 'batch_processing';
  metadata?: {
    courseId?: string;
    lessonCount?: number;
    batchSize?: number;
    cacheHit?: boolean;
    functionCallCount?: number;
  };
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalCost: number;
  operationBreakdown: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

export class TokenTrackerService {
  /**
   * Calculate cost based on token usage
   * 
   * Pricing:
   * - Input: $0.075 / 1M tokens
   * - Output: $0.30 / 1M tokens
   * - Cached input: $0.01875 / 1M tokens (75% off!)
   */
  private calculateCost(data: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  }): number {
    const INPUT_COST_PER_MILLION = 0.075;
    const OUTPUT_COST_PER_MILLION = 0.30;
    const CACHED_INPUT_COST_PER_MILLION = 0.01875;

    // Regular input tokens (not cached)
    const regularInputCost = ((data.inputTokens - data.cachedTokens) / 1000000) * INPUT_COST_PER_MILLION;
    
    // Cached input tokens (75% discount)
    const cachedInputCost = (data.cachedTokens / 1000000) * CACHED_INPUT_COST_PER_MILLION;
    
    // Output tokens
    const outputCost = (data.outputTokens / 1000000) * OUTPUT_COST_PER_MILLION;

    return regularInputCost + cachedInputCost + outputCost;
  }

  /**
   * Log token usage to Firestore
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param data - Token usage data
   */
  async logUsage(teacherId: string, data: TokenUsageData): Promise<void> {
    const spanId = traceLogger.startSpan('TokenTracker', 'logUsage');

    try {
      if (!teacherId) {
        throw new Error('teacherId is required');
      }

      const cost = this.calculateCost(data);

      await db.collection('ai_token_usage').add({
        teacherId,
        sessionId: data.sessionId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cachedTokens: data.cachedTokens,
        model: data.model,
        operation: data.operation,
        cost,
        metadata: data.metadata || {},
        timestamp: Timestamp.now(),
        createdAt: FieldValue.serverTimestamp()
      });

      traceLogger.log('info', 'TokenTracker', 'Usage logged successfully', {
        teacherId,
        sessionId: data.sessionId,
        totalTokens: data.inputTokens + data.outputTokens,
        cachedTokens: data.cachedTokens,
        cost: cost.toFixed(4)
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'TokenTracker', 'Failed to log usage', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      traceLogger.endSpan(spanId, 'error');
      
      // Don't throw - token tracking is non-critical
      // Chatbot should continue working even if logging fails
    }
  }

  /**
   * Get monthly usage summary for a teacher
   * 
   * @param teacherId - Teacher's Firebase UID
   * @returns Usage summary with breakdown
   */
  async getMonthlyUsage(teacherId: string): Promise<UsageSummary> {
    const spanId = traceLogger.startSpan('TokenTracker', 'getMonthlyUsage');

    try {
      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const snapshot = await db
        .collection('ai_token_usage')
        .where('teacherId', '==', teacherId)
        .where('timestamp', '>=', Timestamp.fromDate(startOfMonth))
        .orderBy('timestamp', 'desc')
        .get();

      if (snapshot.empty) {
        traceLogger.log('info', 'TokenTracker', 'No usage data found', { teacherId });
        traceLogger.endSpan(spanId, 'success');
        
        return {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCachedTokens: 0,
          totalCost: 0,
          operationBreakdown: {},
          dailyUsage: []
        };
      }

      // Aggregate data
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCachedTokens = 0;
      let totalCost = 0;
      
      const operationBreakdown: Record<string, any> = {};
      const dailyUsageMap: Record<string, { tokens: number; cost: number }> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        totalInputTokens += data.inputTokens || 0;
        totalOutputTokens += data.outputTokens || 0;
        totalCachedTokens += data.cachedTokens || 0;
        totalCost += data.cost || 0;

        // Operation breakdown
        const op = data.operation;
        if (!operationBreakdown[op]) {
          operationBreakdown[op] = { count: 0, tokens: 0, cost: 0 };
        }
        operationBreakdown[op].count++;
        operationBreakdown[op].tokens += (data.inputTokens + data.outputTokens);
        operationBreakdown[op].cost += data.cost;

        // Daily usage
        const dateKey = data.timestamp.toDate().toISOString().split('T')[0];
        if (!dailyUsageMap[dateKey]) {
          dailyUsageMap[dateKey] = { tokens: 0, cost: 0 };
        }
        dailyUsageMap[dateKey].tokens += (data.inputTokens + data.outputTokens);
        dailyUsageMap[dateKey].cost += data.cost;
      });

      // Convert daily usage map to array
      const dailyUsage = Object.entries(dailyUsageMap).map(([date, data]) => ({
        date,
        tokens: data.tokens,
        cost: data.cost
      })).sort((a, b) => a.date.localeCompare(b.date));

      traceLogger.log('info', 'TokenTracker', 'Monthly usage retrieved', {
        teacherId,
        totalCost: totalCost.toFixed(4),
        recordCount: snapshot.size
      });

      traceLogger.endSpan(spanId, 'success');

      return {
        totalInputTokens,
        totalOutputTokens,
        totalCachedTokens,
        totalCost,
        operationBreakdown,
        dailyUsage
      };
    } catch (error) {
      traceLogger.log('error', 'TokenTracker', 'Failed to get monthly usage', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Get usage for a specific session
   */
  async getSessionUsage(sessionId: string): Promise<{
    totalTokens: number;
    totalCost: number;
    messageCount: number;
  }> {
    const spanId = traceLogger.startSpan('TokenTracker', 'getSessionUsage');

    try {
      const snapshot = await db
        .collection('ai_token_usage')
        .where('sessionId', '==', sessionId)
        .get();

      let totalTokens = 0;
      let totalCost = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalTokens += (data.inputTokens + data.outputTokens);
        totalCost += data.cost;
      });

      traceLogger.endSpan(spanId, 'success');

      return {
        totalTokens,
        totalCost,
        messageCount: snapshot.size
      };
    } catch (error) {
      traceLogger.log('error', 'TokenTracker', 'Failed to get session usage', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }
}

// Export singleton instance
export const tokenTrackerService = new TokenTrackerService();
