// src/shared/utils/__tests__/retry.test.ts

import { retryWithBackoff, isRetryableError, retryOnRetryableError } from '../retry';

// Mock do logger para evitar logs durante testes
jest.mock('../logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('retry Utils - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('retryWithBackoff', () => {
    describe('Happy Path', () => {
      it('deve executar função com sucesso na primeira tentativa', async () => {
        // Arrange
        const successFn = jest.fn().mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(successFn, {}, 'TestOp');
        const result = await promise;

        // Assert
        expect(result).toBe('success');
        expect(successFn).toHaveBeenCalledTimes(1);
      });

      it('deve retornar resultado correto', async () => {
        // Arrange
        const data = { id: 123, name: 'test' };
        const successFn = jest.fn().mockResolvedValue(data);

        // Act
        const result = await retryWithBackoff(successFn);

        // Assert
        expect(result).toEqual(data);
      });
    });

    describe('Retry Behavior', () => {
      it('deve fazer retry após falha', async () => {
        // Arrange
        const failOnceFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('First fail'))
          .mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(
          failOnceFn,
          { maxAttempts: 3, initialDelay: 100, jitter: false },
          'TestOp'
        );

        // Avançar timers para permitir retry
        jest.runAllTimers();

        const result = await promise;

        // Assert
        expect(result).toBe('success');
        expect(failOnceFn).toHaveBeenCalledTimes(2);
      });

      it('deve fazer retry até sucesso', async () => {
        // Arrange
        const failTwiceFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(
          failTwiceFn,
          { maxAttempts: 3, initialDelay: 100, jitter: false },
          'TestOp'
        );

        jest.runAllTimers();

        const result = await promise;

        // Assert
        expect(result).toBe('success');
        expect(failTwiceFn).toHaveBeenCalledTimes(3);
      });

      it('deve lançar erro após esgotar tentativas', async () => {
        // Arrange
        const alwaysFailFn = jest.fn().mockRejectedValue(new Error('Always fail'));

        // Act
        const promise = retryWithBackoff(
          alwaysFailFn,
          { maxAttempts: 3, initialDelay: 100, jitter: false },
          'TestOp'
        );

        jest.runAllTimers();

        // Assert
        await expect(promise).rejects.toThrow('Always fail');
        expect(alwaysFailFn).toHaveBeenCalledTimes(3);
      });
    });

    describe('Delay Configuration', () => {
      it('deve respeitar initialDelay', async () => {
        // Arrange
        const failOnceFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail'))
          .mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(
          failOnceFn,
          { initialDelay: 1000, jitter: false },
          'TestOp'
        );

        // Não deve ter feito retry ainda
        expect(failOnceFn).toHaveBeenCalledTimes(1);

        // Avançar menos que o delay
        jest.advanceTimersByTime(500);
        await Promise.resolve(); // Process microtasks
        expect(failOnceFn).toHaveBeenCalledTimes(1);

        // Avançar o resto do delay
        jest.advanceTimersByTime(500);
        await Promise.resolve();

        const result = await promise;

        // Assert
        expect(result).toBe('success');
        expect(failOnceFn).toHaveBeenCalledTimes(2);
      });

      it('deve aplicar backoffFactor corretamente', async () => {
        // Arrange
        const failThriceFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockRejectedValueOnce(new Error('Fail 3'))
          .mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(
          failThriceFn,
          {
            maxAttempts: 4,
            initialDelay: 1000,
            backoffFactor: 2,
            jitter: false,
          },
          'TestOp'
        );

        // First attempt fails immediately
        expect(failThriceFn).toHaveBeenCalledTimes(1);

        // Wait for first retry (1000ms)
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(failThriceFn).toHaveBeenCalledTimes(2);

        // Wait for second retry (2000ms due to backoff)
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        expect(failThriceFn).toHaveBeenCalledTimes(3);

        // Wait for third retry (4000ms due to backoff)
        jest.advanceTimersByTime(4000);
        await Promise.resolve();

        const result = await promise;

        // Assert
        expect(result).toBe('success');
        expect(failThriceFn).toHaveBeenCalledTimes(4);
      });

      it('deve respeitar maxDelay', async () => {
        // Arrange
        const failManyFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockResolvedValue('success');

        // Act - backoff seria muito alto, mas maxDelay limita
        const promise = retryWithBackoff(
          failManyFn,
          {
            maxAttempts: 3,
            initialDelay: 5000,
            maxDelay: 6000,
            backoffFactor: 10,
            jitter: false,
          },
          'TestOp'
        );

        // First retry at 5000ms
        jest.advanceTimersByTime(5000);
        await Promise.resolve();

        // Second retry should be capped at maxDelay (6000ms), not 50000ms
        jest.advanceTimersByTime(6000);
        await Promise.resolve();

        const result = await promise;

        // Assert
        expect(result).toBe('success');
      });
    });

    describe('onRetry Callback', () => {
      it('deve chamar onRetry callback', async () => {
        // Arrange
        const onRetry = jest.fn();
        const failOnceFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail'))
          .mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(
          failOnceFn,
          {
            initialDelay: 100,
            jitter: false,
            onRetry,
          },
          'TestOp'
        );

        jest.runAllTimers();
        await promise;

        // Assert
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, expect.any(Number));
      });

      it('onRetry deve receber erro correto', async () => {
        // Arrange
        const error = new Error('Custom error');
        const onRetry = jest.fn();
        const failOnceFn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(
          failOnceFn,
          { onRetry, initialDelay: 100, jitter: false },
          'TestOp'
        );

        jest.runAllTimers();
        await promise;

        // Assert
        expect(onRetry).toHaveBeenCalledWith(error, 1, expect.any(Number));
      });
    });

    describe('Edge Cases', () => {
      it('deve lidar com maxAttempts = 1 (sem retry)', async () => {
        // Arrange
        const failFn = jest.fn().mockRejectedValue(new Error('Fail'));

        // Act
        const promise = retryWithBackoff(failFn, { maxAttempts: 1 }, 'TestOp');

        // Assert
        await expect(promise).rejects.toThrow('Fail');
        expect(failFn).toHaveBeenCalledTimes(1);
      });

      it('deve lidar com delay zero', async () => {
        // Arrange
        const failOnceFn = jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail'))
          .mockResolvedValue('success');

        // Act
        const promise = retryWithBackoff(failOnceFn, { initialDelay: 0, jitter: false }, 'TestOp');

        jest.runAllTimers();
        const result = await promise;

        // Assert
        expect(result).toBe('success');
      });

      it('deve lidar com função que retorna undefined', async () => {
        // Arrange
        const fn = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await retryWithBackoff(fn);

        // Assert
        expect(result).toBeUndefined();
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('deve lidar com função que retorna null', async () => {
        // Arrange
        const fn = jest.fn().mockResolvedValue(null);

        // Act
        const result = await retryWithBackoff(fn);

        // Assert
        expect(result).toBeNull();
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('isRetryableError', () => {
    describe('Retryable Errors', () => {
      it('deve identificar ECONNREFUSED como retryable', () => {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        expect(isRetryableError(error)).toBe(true);
      });

      it('deve identificar ETIMEDOUT como retryable', () => {
        const error = new Error('Timeout');
        (error as any).code = 'ETIMEDOUT';
        expect(isRetryableError(error)).toBe(true);
      });

      it('deve identificar timeout message como retryable', () => {
        const error = new Error('Request timeout exceeded');
        expect(isRetryableError(error)).toBe(true);
      });

      it('deve identificar connection closed como retryable', () => {
        const error = new Error('Connection was closed');
        expect(isRetryableError(error)).toBe(true);
      });

      it('deve identificar connection reset como retryable', () => {
        const error = new Error('Connection was reset by peer');
        expect(isRetryableError(error)).toBe(true);
      });

      it('deve identificar socket hang up como retryable', () => {
        const error = new Error('socket hang up');
        expect(isRetryableError(error)).toBe(true);
      });

      it('deve ser case-insensitive', () => {
        const error1 = new Error('TIMEOUT');
        const error2 = new Error('timeout');
        const error3 = new Error('TimeOut');

        expect(isRetryableError(error1)).toBe(true);
        expect(isRetryableError(error2)).toBe(true);
        expect(isRetryableError(error3)).toBe(true);
      });
    });

    describe('Non-Retryable Errors', () => {
      it('deve identificar validation error como não-retryable', () => {
        const error = new Error('Validation failed');
        expect(isRetryableError(error)).toBe(false);
      });

      it('deve identificar not found como não-retryable', () => {
        const error = new Error('Resource not found');
        expect(isRetryableError(error)).toBe(false);
      });

      it('deve identificar unauthorized como não-retryable', () => {
        const error = new Error('Unauthorized access');
        expect(isRetryableError(error)).toBe(false);
      });

      it('deve identificar business logic error como não-retryable', () => {
        const error = new Error('Invalid operation');
        expect(isRetryableError(error)).toBe(false);
      });

      it('deve lidar com erro sem mensagem', () => {
        const error = new Error();
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('retryOnRetryableError', () => {
    it('deve fazer retry apenas para erros retryable', async () => {
      // Arrange
      const retryableError = new Error('Connection timeout');
      const failOnceFn = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      // Act
      const promise = retryOnRetryableError(
        failOnceFn,
        { initialDelay: 100, jitter: false },
        'TestOp'
      );

      jest.runAllTimers();
      const result = await promise;

      // Assert
      expect(result).toBe('success');
      expect(failOnceFn).toHaveBeenCalledTimes(2);
    });

    it('não deve fazer retry para erros não-retryable', async () => {
      // Arrange
      const nonRetryableError = new Error('Validation failed');
      const failFn = jest.fn().mockRejectedValue(nonRetryableError);

      // Act
      const promise = retryOnRetryableError(
        failFn,
        { maxAttempts: 3, initialDelay: 100 },
        'TestOp'
      );

      jest.runAllTimers();

      // Assert
      await expect(promise).rejects.toThrow('Validation failed');
      // Deve falhar na primeira tentativa sem fazer retry
      expect(failFn).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onRetry callback customizado', async () => {
      // Arrange
      const customOnRetry = jest.fn();
      const retryableError = new Error('timeout');
      const failOnceFn = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      // Act
      const promise = retryOnRetryableError(
        failOnceFn,
        {
          initialDelay: 100,
          jitter: false,
          onRetry: customOnRetry,
        },
        'TestOp'
      );

      jest.runAllTimers();
      await promise;

      // Assert
      expect(customOnRetry).toHaveBeenCalledWith(retryableError, 1, expect.any(Number));
    });
  });
});
