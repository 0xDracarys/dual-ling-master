export interface FunctionCallResult {
  name: string;
  response?: {
    success?: boolean;
    data?: Record<string, unknown>;
    error?: string;
  };
}

export interface FunctionResultSummary {
  total: number;
  successCount: number;
  failureCount: number;
  hasPartialSuccess: boolean;
  successes: Array<{ name: string; title?: string }>;
  failures: Array<{ name: string; error?: string }>;
}

export function summarizeFunctionResults(results: FunctionCallResult[]): FunctionResultSummary {
  const summary: FunctionResultSummary = {
    total: results.length,
    successCount: 0,
    failureCount: 0,
    hasPartialSuccess: false,
    successes: [],
    failures: []
  };

  if (results.length === 0) {
    return summary;
  }

  for (const result of results) {
    const success = result.response?.success === true;

    if (success) {
      summary.successCount += 1;
      summary.successes.push({
        name: result.name,
        title: (result.response?.data as { title?: string } | undefined)?.title
      });
    } else {
      summary.failureCount += 1;
      summary.failures.push({
        name: result.name,
        error: result.response?.error
      });
    }
  }

  summary.hasPartialSuccess = summary.successCount > 0 && summary.failureCount > 0;
  return summary;
}
