// src/infrastructure/database/retry/__tests__/RetryPolicy.test.ts

import {
  RetryPolicy,
  defaultRetryPolicy,
  aggressiveRetryPolicy,
  conservativeRetryPolicy,
  noRetryPolicy,
} from '../RetryPolicy';
import {
  MaxRetriesExceededError,
  RetryableError,
  NonRetryableError,
} from '@shared/errors/RetryErrors';
import { ValidationError, ItemNotFoundError } from '@shared/errors/errors';

describe('RetryPolicy', () => {
  let policy: RetryPolicy;

  beforeEach(() => {
    // Policy com jitter = 0 para testes determinísticos
    policy = new RetryPolicy({
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 0, // Desabilita jitter para testes previsíveis
    });
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const defaultPolicy = new RetryPolicy();
      const config = defaultPolicy.getConfig();

      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelayMs).toBe(100);
      expect(config.maxDelayMs).toBe(5000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.jitterMs).toBe(50);
      expect(config.retryableErrors).toContain('ETIMEDOUT');
      expect(config.retryableErrors).toContain('ECONNRESET');
    });

    it('should override default config with partial config', () => {
      const customPolicy = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 50,
      });

      const config = customPolicy.getConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.initialDelayMs).toBe(50);
      expect(config.maxDelayMs).toBe(5000); // Default
      expect(config.backoffMultiplier).toBe(2); // Default
    });
  });

  describe('execute - successful execution', () => {
    it('should return result on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await policy.execute(fn, 'test-conn');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry when function succeeds', async () => {
      const fn = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await policy.execute(fn, 'test-conn');

      expect(result).toEqual({ data: 'test' });
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute - retryable errors', () => {
    it('should retry on ETIMEDOUT error', async () => {
      const error = new Error('Connection timeout');
      (error as any).code = 'ETIMEDOUT';

      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await policy.execute(fn, 'test-conn');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should retry on ECONNRESET error', async () => {
      const error = new Error('Connection reset');
      (error as any).code = 'ECONNRESET';

      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await policy.execute(fn, 'test-conn');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on ECONNREFUSED error', async () => {
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';

      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      await policy.execute(fn, 'test-conn');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on TimeoutError in message', async () => {
      const error = new Error('TimeoutError: Request timeout exceeded');

      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      await policy.execute(fn, 'test-conn');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on ConnectionError message', async () => {
      const error = new Error('ConnectionError: Failed to connect');

      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      await policy.execute(fn, 'test-conn');

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('execute - non-retryable errors', () => {
    it('should not retry on ValidationError', async () => {
      const fn = jest.fn().mockRejectedValue(new ValidationError('Invalid input'));

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow(ValidationError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on ItemNotFoundError', async () => {
      const fn = jest.fn().mockRejectedValue(new ItemNotFoundError('123'));

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow(ItemNotFoundError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on NonRetryableError', async () => {
      const fn = jest.fn().mockRejectedValue(new NonRetryableError('Permanent failure', 500));

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow(NonRetryableError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on unknown error types', async () => {
      const customError = new Error('Unknown error');
      customError.name = 'CustomError';

      const fn = jest.fn().mockRejectedValue(customError);

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow('Unknown error');

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute - exponential backoff', () => {
    it('should increase delay exponentially', async () => {
      const error = new Error('ETIMEDOUT');
      (error as any).code = 'ETIMEDOUT';

      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const start = Date.now();
      await policy.execute(fn, 'test-conn');
      const elapsed = Date.now() - start;

      // Delays esperados (sem jitter): 100ms + 200ms = 300ms
      // Com margem de erro de ±50ms para timing
      expect(elapsed).toBeGreaterThanOrEqual(250);
      expect(elapsed).toBeLessThan(400);
    });

    it('should cap delay at maxDelayMs', async () => {
      const shortPolicy = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 1500, // Cap pequeno
        backoffMultiplier: 2,
        jitterMs: 0,
      });

      const error = new Error('ETIMEDOUT');
      (error as any).code = 'ETIMEDOUT';

      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const start = Date.now();
      await shortPolicy.execute(fn, 'test-conn');
      const elapsed = Date.now() - start;

      // Delays: 1000ms, 1500ms (capped), 1500ms (capped), 1500ms (capped) = 5500ms
      // Com margem de erro
      expect(elapsed).toBeGreaterThanOrEqual(5000);
      expect(elapsed).toBeLessThan(6000);
    });
  });

  describe('execute - max retries exceeded', () => {
    it('should throw MaxRetriesExceededError after max attempts', async () => {
      const error = new Error('ETIMEDOUT');
      (error as any).code = 'ETIMEDOUT';

      const fn = jest.fn().mockRejectedValue(error);

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow(MaxRetriesExceededError);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should include original error in MaxRetriesExceededError', async () => {
      const originalError = new Error('Original timeout');
      (originalError as any).code = 'ETIMEDOUT';

      const fn = jest.fn().mockRejectedValue(originalError);

      try {
        await policy.execute(fn, 'test-conn');
        fail('Should have thrown MaxRetriesExceededError');
      } catch (error) {
        expect(error).toBeInstanceOf(MaxRetriesExceededError);
        const retryError = error as MaxRetriesExceededError;
        expect(retryError.originalError).toBe(originalError);
        expect(retryError.message).toContain('Failed after 3 attempts');
      }
    });

    it('should include context in MaxRetriesExceededError', async () => {
      const error = new Error('ETIMEDOUT');
      (error as any).code = 'ETIMEDOUT';

      const fn = jest.fn().mockRejectedValue(error);

      try {
        await policy.execute(fn, 'DtsPrdEmp');
        fail('Should have thrown');
      } catch (error) {
        const retryError = error as MaxRetriesExceededError;
        expect(retryError.context).toMatchObject({
          connectionId: 'DtsPrdEmp',
          attempts: 3,
        });
        expect(retryError.context?.elapsedTime).toBeGreaterThan(0);
      }
    });
  });

  describe('getConfig', () => {
    it('should return read-only config', () => {
      const config = policy.getConfig();

      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelayMs).toBe(100);

      // Tentar modificar (TypeScript previne, mas test em runtime)
      expect(() => {
        (config as any).maxAttempts = 10;
      }).toThrow();
    });
  });

  describe('pre-defined policies', () => {
    it('defaultRetryPolicy should have balanced config', () => {
      const config = defaultRetryPolicy.getConfig();

      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelayMs).toBe(100);
      expect(config.maxDelayMs).toBe(5000);
    });

    it('aggressiveRetryPolicy should have more attempts', () => {
      const config = aggressiveRetryPolicy.getConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.initialDelayMs).toBe(50);
      expect(config.maxDelayMs).toBe(3000);
    });

    it('conservativeRetryPolicy should have fewer attempts', () => {
      const config = conservativeRetryPolicy.getConfig();

      expect(config.maxAttempts).toBe(2);
      expect(config.initialDelayMs).toBe(200);
      expect(config.maxDelayMs).toBe(2000);
    });

    it('noRetryPolicy should not retry', () => {
      const config = noRetryPolicy.getConfig();

      expect(config.maxAttempts).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle sync exceptions thrown during execution', async () => {
      const fn = jest.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow('Sync error');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined errors', async () => {
      const fn = jest.fn().mockRejectedValue(null);

      await expect(policy.execute(fn, 'test-conn')).rejects.toBeDefined();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should convert non-Error rejections to Error', async () => {
      const fn = jest.fn().mockRejectedValue('string error');

      await expect(policy.execute(fn, 'test-conn')).rejects.toBeInstanceOf(Error);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle very fast retries without negative delays', async () => {
      const fastPolicy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 0,
        jitterMs: 0,
      });

      const error = new Error('ETIMEDOUT');
      (error as any).code = 'ETIMEDOUT';

      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const start = Date.now();
      await fastPolicy.execute(fn, 'test-conn');
      const elapsed = Date.now() - start;

      // Deve ser quase instantâneo (< 50ms)
      expect(elapsed).toBeLessThan(50);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle intermittent network issues', async () => {
      const error = new Error('Network error');
      (error as any).code = 'ECONNRESET';

      let attempt = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempt++;
        if (attempt <= 2) {
          throw error;
        }
        return { data: 'recovered' };
      });

      const result = await policy.execute(fn, 'test-conn');

      expect(result).toEqual({ data: 'recovered' });
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry database constraint violations', async () => {
      const error = new Error('Unique constraint violation');
      error.name = 'DatabaseError';

      const fn = jest.fn().mockRejectedValue(error);

      await expect(policy.execute(fn, 'test-conn')).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry pool exhaustion errors', async () => {
      const error = new Error('PoolError: No connections available');

      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue({ success: true });

      const result = await policy.execute(fn, 'test-conn');

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance', () => {
    it('should complete fast retries in reasonable time', async () => {
      const fastPolicy = new RetryPolicy({
        maxAttempts: 10,
        initialDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 1.5,
        jitterMs: 0,
      });

      const error = new Error('ETIMEDOUT');
      (error as any).code = 'ETIMEDOUT';

      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 10) {
          throw error;
        }
        return 'success';
      });

      const start = Date.now();
      await fastPolicy.execute(fn, 'test-conn');
      const elapsed = Date.now() - start;

      // 9 retries com delays pequenos devem ser < 200ms
      expect(elapsed).toBeLessThan(200);
      expect(fn).toHaveBeenCalledTimes(10);
    });
  });
});
