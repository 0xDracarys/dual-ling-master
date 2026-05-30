/**
 * Token Usage Badge Component
 * 
 * Displays cumulative token count and cost across conversation
 * Minimal, transparent design for cost awareness without distraction
 */

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TokenUsageBadgeProps {
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  model?: string;
  cumulativeTokens?: number; // Running total across all messages
  cumulativeCost?: number; // Running total cost in EUR
  showCurrency?: boolean; // Flag to show/hide currency (default: true)
}

/**
 * Calculate cost based on Gemini 2.5 Flash pricing (converted to EUR)
 * - Input: €0.070 per 1M tokens (~$0.075)
 * - Output: €0.28 per 1M tokens (~$0.30)
 * - Cached: €0.0175 per 1M tokens (~$0.01875, 75% off)
 * 
 * Using EUR/USD rate: 1 EUR = ~1.07 USD
 */
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): number {
  const INPUT_COST = 0.070 / 1000000; // EUR
  const OUTPUT_COST = 0.28 / 1000000; // EUR
  const CACHED_COST = 0.0175 / 1000000; // EUR

  const regularInputCost = (inputTokens - cachedTokens) * INPUT_COST;
  const cachedInputCost = cachedTokens * CACHED_COST;
  const outputCost = outputTokens * OUTPUT_COST;

  return regularInputCost + cachedInputCost + outputCost;
}

/**
 * Format token count for display (e.g., 1234 → "1.2K")
 */
function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 10000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${Math.round(tokens / 1000)}K`;
}

export function TokenUsageBadge({
  inputTokens,
  outputTokens,
  cachedTokens = 0,
  model = 'gemini-2.5-flash',
  cumulativeTokens,
  cumulativeCost,
  showCurrency = true
}: TokenUsageBadgeProps) {
  const totalTokens = inputTokens + outputTokens;
  const messageCost = calculateCost(inputTokens, outputTokens, cachedTokens);
  
  // Use cumulative values if provided, otherwise use message values
  const displayTokens = cumulativeTokens ?? totalTokens;
  const displayCost = cumulativeCost ?? messageCost;

  // Don't show if no tokens (shouldn't happen, but safety check)
  if (displayTokens === 0) return null;

  return (
    <Badge 
      variant="outline" 
      className="text-[10px] px-1.5 py-0.5 font-normal text-muted-foreground border-muted-foreground/20"
    >
      <Sparkles className="h-2.5 w-2.5 mr-1 opacity-60" />
      {formatTokens(displayTokens)} tokens
      {cachedTokens > 0 && (
        <span className="text-green-600 dark:text-green-400 ml-1">
          (-{formatTokens(cachedTokens)} cached)
        </span>
      )}
      {showCurrency && (
        <span className="ml-1.5 opacity-70">
          ~€{displayCost < 0.001 ? '<0.001' : displayCost.toFixed(3)}
        </span>
      )}
    </Badge>
  );
}
