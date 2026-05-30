import { withExponentialBackoff } from '@/lib/utils/retry';

describe('withExponentialBackoff', () => {
  it('resolves immediately when the operation succeeds on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('ok');
    const result = await withExponentialBackoff(operation, { attempts: 2 });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(1);
  });

  it('retries on transient failures and eventually succeeds', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('success');

    const result = await withExponentialBackoff(operation, {
      attempts: 3,
      baseDelayMs: 1,
      multiplier: 1,
      jitter: false
    });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all attempts and reports via callback', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('boom'));
    const onAttemptError = jest.fn();

    await expect(
      withExponentialBackoff(operation, {
        attempts: 2,
        baseDelayMs: 1,
        multiplier: 1,
        jitter: false,
        onAttemptError
      })
    ).rejects.toThrow('boom');

    expect(operation).toHaveBeenCalledTimes(2);
    expect(onAttemptError).toHaveBeenCalledTimes(2);
    expect(onAttemptError).toHaveBeenCalledWith({ attempt: 1, error: expect.any(Error) });
  });
});
