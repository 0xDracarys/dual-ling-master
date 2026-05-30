# AI Chatbot v3 - Token Usage UI Components

**Version:** 3.0.0  
**Date:** November 20, 2025  
**Focus:** Teacher-facing token usage transparency  
**Goal:** Clear, unobtrusive cost visibility

---

## 🎯 Overview

Teachers need to see:
1. **Per-message cost** (real-time feedback)
2. **Session total** (how much this conversation costs)
3. **Monthly usage** (historical trends, billing)

Design principles:
- ✅ Subtle (doesn't distract from chatbot)
- ✅ Informative (shows tokens + cost)
- ✅ Educational (explains caching savings)
- ✅ Actionable (links to detailed dashboard)

---

## 📦 Phase 5: UI Components

### 5.1 Token Usage Badge (Per-Message)

**File:** `/components/ai-chatbot/token-usage-badge.tsx`

```tsx
/**
 * Token Usage Badge Component
 * 
 * Displays token count and cost for a single AI message.
 * Shows green badge when cached tokens are used (cost savings).
 * 
 * Placement: Bottom-right of each AI response in chat
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenUsageBadgeProps {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  className?: string;
}

export function TokenUsageBadge({
  inputTokens,
  outputTokens,
  cachedTokens,
  className
}: TokenUsageBadgeProps) {
  // Calculate cost
  const INPUT_COST_PER_MILLION = 0.075;
  const OUTPUT_COST_PER_MILLION = 0.30;
  const CACHED_INPUT_COST_PER_MILLION = 0.01875;

  const regularInputCost = ((inputTokens - cachedTokens) / 1000000) * INPUT_COST_PER_MILLION;
  const cachedInputCost = (cachedTokens / 1000000) * CACHED_INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1000000) * OUTPUT_COST_PER_MILLION;
  const totalCost = regularInputCost + cachedInputCost + outputCost;

  // Calculate total tokens
  const totalTokens = inputTokens + outputTokens;

  // Format numbers
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const formatCost = (cost: number): string => {
    if (cost < 0.01) {
      return '<$0.01';
    }
    return `$${cost.toFixed(3)}`;
  };

  // Determine if we have cache savings
  const hasCacheSavings = cachedTokens > 0;
  const savingsPercent = hasCacheSavings 
    ? Math.round((cachedTokens / inputTokens) * 100) 
    : 0;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <Badge 
        variant="outline" 
        className={cn(
          'font-mono',
          hasCacheSavings && 'border-green-500 bg-green-50 dark:bg-green-950'
        )}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {formatTokens(totalTokens)} tokens
        <span className="ml-2 text-muted-foreground">
          {formatCost(totalCost)}
        </span>
      </Badge>

      {hasCacheSavings && (
        <Badge variant="outline" className="border-green-500 bg-green-50 dark:bg-green-950">
          <Zap className="h-3 w-3 mr-1 text-green-600" />
          <span className="text-green-700 dark:text-green-400">
            -{formatTokens(cachedTokens)} cached ({savingsPercent}% saved)
          </span>
        </Badge>
      )}
    </div>
  );
}
```

---

### 5.2 Session Summary Card

**File:** `/components/ai-chatbot/session-summary-card.tsx`

```tsx
/**
 * Session Summary Card
 * 
 * Shows aggregate token usage and cost for entire chat session.
 * Displayed at the top of chat interface (collapsible).
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, TrendingDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SessionSummaryProps {
  sessionId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  messageCount: number;
}

export function SessionSummaryCard({
  sessionId,
  totalInputTokens,
  totalOutputTokens,
  totalCachedTokens,
  messageCount
}: SessionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total cost
  const INPUT_COST_PER_MILLION = 0.075;
  const OUTPUT_COST_PER_MILLION = 0.30;
  const CACHED_INPUT_COST_PER_MILLION = 0.01875;

  const regularInputCost = ((totalInputTokens - totalCachedTokens) / 1000000) * INPUT_COST_PER_MILLION;
  const cachedInputCost = (totalCachedTokens / 1000000) * CACHED_INPUT_COST_PER_MILLION;
  const outputCost = (totalOutputTokens / 1000000) * OUTPUT_COST_PER_MILLION;
  const totalCost = regularInputCost + cachedInputCost + outputCost;

  // Calculate what cost would be without caching
  const uncachedCost = (totalInputTokens / 1000000) * INPUT_COST_PER_MILLION + outputCost;
  const savings = uncachedCost - totalCost;
  const savingsPercent = uncachedCost > 0 ? ((savings / uncachedCost) * 100) : 0;

  const totalTokens = totalInputTokens + totalOutputTokens;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Session Usage
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Row (Always Visible) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold">{(totalTokens / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">tokens used</p>
            </div>
            
            <div>
              <p className="text-2xl font-bold">${totalCost.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground">total cost</p>
            </div>
          </div>

          {totalCachedTokens > 0 && (
            <Badge variant="outline" className="border-green-500 bg-green-50 dark:bg-green-950">
              <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-green-700 dark:text-green-400">
                {savingsPercent.toFixed(0)}% saved
              </span>
            </Badge>
          )}
        </div>

        {/* Detailed Breakdown (Expandable) */}
        {isExpanded && (
          <div className="mt-4 space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Input Tokens</p>
                <p className="font-medium">{totalInputTokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Output Tokens</p>
                <p className="font-medium">{totalOutputTokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cached Tokens</p>
                <p className="font-medium text-green-600">
                  {totalCachedTokens.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Messages</p>
                <p className="font-medium">{messageCount}</p>
              </div>
            </div>

            {savings > 0 && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  💰 Saved ${savings.toFixed(3)} with caching
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Without caching: ${uncachedCost.toFixed(3)} → With caching: ${totalCost.toFixed(3)}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Session ID: <code className="bg-muted px-1 py-0.5 rounded">{sessionId.slice(0, 16)}...</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### 5.3 Monthly Usage Dashboard

**File:** `/app/teacher/ai-usage/page.tsx`

```tsx
/**
 * AI Usage Dashboard
 * 
 * Full-page dashboard showing teacher's monthly AI token usage.
 * Includes summary cards, daily chart, operation breakdown.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, DollarSign, Zap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UsageSummary {
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

export default function AIUsagePage() {
  const { token, user } = useAuth();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch('/api/ai/usage/monthly', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUsage(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load usage:', error);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading usage data...</p>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="container mx-auto p-6">
        <p>No usage data available</p>
      </div>
    );
  }

  const totalTokens = usage.totalInputTokens + usage.totalOutputTokens;
  const cacheSavingsPercent = usage.totalInputTokens > 0
    ? ((usage.totalCachedTokens / usage.totalInputTokens) * 100)
    : 0;

  // Calculate what cost would be without caching
  const INPUT_COST_PER_MILLION = 0.075;
  const OUTPUT_COST_PER_MILLION = 0.30;
  const uncachedCost = (usage.totalInputTokens / 1000000) * INPUT_COST_PER_MILLION
    + (usage.totalOutputTokens / 1000000) * OUTPUT_COST_PER_MILLION;
  const totalSavings = uncachedCost - usage.totalCost;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Usage Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your AI chatbot token usage and costs for November 2025
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(totalTokens / 1000).toFixed(1)}K</p>
            {usage.totalCachedTokens > 0 && (
              <Badge variant="outline" className="mt-2 border-green-500 bg-green-50 dark:bg-green-950">
                <Zap className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-700 dark:text-green-400">
                  {(usage.totalCachedTokens / 1000).toFixed(1)}K cached
                </span>
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${usage.totalCost.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              November 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cache Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${totalSavings.toFixed(2)}
            </p>
            <Badge variant="outline" className="mt-2 border-green-500 bg-green-50 dark:bg-green-950">
              <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-green-700 dark:text-green-400">
                {cacheSavingsPercent.toFixed(0)}% saved
              </span>
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Cost/Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              $
              {(
                usage.totalCost /
                Object.values(usage.operationBreakdown).reduce((sum, op) => sum + op.count, 0)
              ).toFixed(3)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Per AI interaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Operation</CardTitle>
          <CardDescription>
            Breakdown of token usage across different chatbot operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operation</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(usage.operationBreakdown).map(([operation, data]) => (
                <TableRow key={operation}>
                  <TableCell className="font-medium capitalize">
                    {operation.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-right">{data.count}</TableCell>
                  <TableCell className="text-right">
                    {(data.tokens / 1000).toFixed(1)}K
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${data.cost.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Educational Section */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Sparkles className="h-5 w-5" />
            Understanding Your Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-800 dark:text-blue-200">
          <div>
            <p className="font-medium">What are tokens?</p>
            <p className="text-sm">
              Tokens are pieces of text (words, punctuation). On average, 1 token ≈ 4 characters.
              Example: "Hello world!" = 3 tokens
            </p>
          </div>
          
          <div>
            <p className="font-medium">Pricing (Gemini 2.5 Flash)</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Input: $0.075 per 1 million tokens</li>
              <li>Output: $0.30 per 1 million tokens</li>
              <li>Cached input: $0.01875 per 1 million (75% discount!)</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">How caching saves money</p>
            <p className="text-sm">
              The chatbot's system prompt (instructions) is cached for 1 hour. This means you only
              pay once for it, then get 75% off for subsequent messages in the same hour.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 5.4 Create Monthly Usage API

**File:** `/app/api/ai/usage/monthly/route.ts`

```typescript
/**
 * GET /api/ai/usage/monthly
 * 
 * Returns monthly AI token usage summary for authenticated teacher.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { tokenTrackerService } from '@/lib/services/ai/token-tracker.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/ai/usage/monthly');

  try {
    // Verify auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { error: 'Only teachers can view AI usage' },
        { status: 403 }
      );
    }

    const teacherId = decodedToken.uid;

    // Get monthly usage
    const usage = await tokenTrackerService.getMonthlyUsage(teacherId);

    traceLogger.log('info', 'API', 'Monthly usage retrieved', {
      teacherId,
      totalCost: usage.totalCost.toFixed(4)
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(usage);
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to get monthly usage', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    traceLogger.endSpan(spanId, 'error');

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get usage' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Integration with Existing Chat UI

### Update Message List Component

**File:** `/components/ai-chatbot/message-list.tsx`

**Add TokenUsageBadge to AI messages:**

```tsx
import { TokenUsageBadge } from './token-usage-badge';

// In the message rendering loop
{message.role === 'assistant' && message.usageMetadata && (
  <div className="mt-2">
    <TokenUsageBadge
      inputTokens={message.usageMetadata.promptTokenCount || 0}
      outputTokens={message.usageMetadata.candidatesTokenCount || 0}
      cachedTokens={message.usageMetadata.cachedContentTokenCount || 0}
    />
  </div>
)}
```

---

## ✅ Complete Checklist

After implementing all UI components:

- [ ] TokenUsageBadge displays on every AI message
- [ ] SessionSummaryCard shows at top of chat (collapsible)
- [ ] Monthly usage dashboard accessible at `/teacher/ai-usage`
- [ ] Token counts match between UI and Firestore logs
- [ ] Cost calculations are accurate (verified with manual calculation)
- [ ] Cache savings display correctly (green badges)
- [ ] Dashboard charts render without errors
- [ ] Mobile responsive (all components)

---

**Final Step:** Review complete implementation in `v3-refinement-summary.md`
