import { summarizeFunctionResults } from '@/lib/utils/function-results';

describe('summarizeFunctionResults', () => {
  it('handles empty arrays gracefully', () => {
    const summary = summarizeFunctionResults([]);
    expect(summary.total).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(0);
    expect(summary.hasPartialSuccess).toBe(false);
  });

  it('tracks successes and failures', () => {
    const summary = summarizeFunctionResults([
      { name: 'createCourse', response: { success: true, data: { title: 'Course' } } },
      { name: 'createLesson', response: { success: false, error: 'validation' } }
    ]);

    expect(summary.total).toBe(2);
    expect(summary.successCount).toBe(1);
    expect(summary.failureCount).toBe(1);
    expect(summary.hasPartialSuccess).toBe(true);
    expect(summary.successes[0]).toMatchObject({ name: 'createCourse', title: 'Course' });
    expect(summary.failures[0]).toMatchObject({ name: 'createLesson', error: 'validation' });
  });
});
