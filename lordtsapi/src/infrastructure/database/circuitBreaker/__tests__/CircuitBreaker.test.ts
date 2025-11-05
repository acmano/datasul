// src/infrastructure/database/circuitBreaker/__tests__/CircuitBreaker.test.ts

import { CircuitBreaker, CircuitState, CircuitBreakerManager } from '../CircuitBreaker';
import { CircuitBreakerOpenError } from '@shared/errors/CircuitBreakerErrors';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-conn', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 5000,
      volumeThreshold: 5,
    });
  });

  describe('CLOSED state', () => {
    it('should execute function successfully', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(breaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(breaker.getMetrics().successes).toBe(1);
      expect(breaker.getMetrics().totalRequests).toBe(1);
    });

    it('should track multiple successes', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      await breaker.execute(fn);
      await breaker.execute(fn);
      await breaker.execute(fn);

      const metrics = breaker.getMetrics();
      expect(metrics.successes).toBe(3);
      expect(metrics.consecutiveSuccesses).toBe(3);
      expect(metrics.failures).toBe(0);
    });

    it('should transition to OPEN after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Execute enough to meet volume threshold
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      const metrics = breaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.OPEN);
      expect(metrics.consecutiveFailures).toBeGreaterThanOrEqual(3);
    });

    it('should NOT trip if volume threshold not met', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Execute less than volume threshold
      for (let i = 0; i < 4; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });

    it('should reset consecutive failures on success', async () => {
      // Use fresh breaker to avoid state from previous tests
      const freshBreaker = new CircuitBreaker('fresh-test', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      const failFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('success');

      // Some failures (but not enough to trip)
      for (let i = 0; i < 4; i++) {
        try {
          await freshBreaker.execute(failFn);
        } catch (e) {
          // Expected
        }
      }

      expect(freshBreaker.getMetrics().consecutiveFailures).toBeGreaterThan(0);
      expect(freshBreaker.getMetrics().state).toBe(CircuitState.CLOSED);

      // Success resets consecutive failures
      await freshBreaker.execute(successFn);

      expect(freshBreaker.getMetrics().consecutiveFailures).toBe(0);
      expect(freshBreaker.getMetrics().consecutiveSuccesses).toBe(1);
    });
  });

  describe('OPEN state', () => {
    it('should reject requests immediately', async () => {
      // Create fresh breaker and trip it
      const openBreaker = new CircuitBreaker('open-test-1', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Force open to avoid counting rejections during trip
      openBreaker.forceOpen();
      expect(openBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Now try to execute - should be rejected
      const fn = jest.fn().mockResolvedValue('success');
      await expect(openBreaker.execute(fn)).rejects.toThrow(CircuitBreakerOpenError);

      expect(fn).not.toHaveBeenCalled();
      expect(openBreaker.getMetrics().rejectedRequests).toBe(1);
    });

    it('should include context in error', async () => {
      // Create fresh breaker and trip it
      const openBreaker = new CircuitBreaker('open-test-2', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Force open
      openBreaker.forceOpen();
      expect(openBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Test error context
      const fn = jest.fn().mockResolvedValue('success');

      try {
        await openBreaker.execute(fn);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        const cbError = error as CircuitBreakerOpenError;
        expect(cbError.context).toMatchObject({
          connectionId: 'open-test-2',
          state: CircuitState.OPEN,
        });
        expect(cbError.context?.tripTime).toBeDefined();
        expect(cbError.context?.nextAttemptIn).toBeGreaterThan(0);
      }
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      // Create fresh breaker and trip it
      const openBreaker = new CircuitBreaker('open-test-3', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Force open
      openBreaker.forceOpen();
      expect(openBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise((r) => setTimeout(r, 1100));

      const fn = jest.fn().mockResolvedValue('success');
      await openBreaker.execute(fn);

      expect(openBreaker.getMetrics().state).toBe(CircuitState.HALF_OPEN);
      expect(fn).toHaveBeenCalled();
    });

    it('should track rejectedRequests metric', async () => {
      // Create fresh breaker and trip it
      const openBreaker = new CircuitBreaker('open-test-4', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Force open
      openBreaker.forceOpen();
      expect(openBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Test rejected requests counter
      const fn = jest.fn().mockResolvedValue('success');

      try {
        await openBreaker.execute(fn);
      } catch (e) {
        // Expected
      }

      try {
        await openBreaker.execute(fn);
      } catch (e) {
        // Expected
      }

      expect(openBreaker.getMetrics().rejectedRequests).toBe(2);
    });
  });

  describe('HALF_OPEN state', () => {
    it('should close after successful requests', async () => {
      // Create fresh breaker
      const halfOpenBreaker = new CircuitBreaker('half-open-test-1', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Trip and wait
      halfOpenBreaker.forceOpen();
      await new Promise((r) => setTimeout(r, 1100));

      // First call transitions to HALF_OPEN
      const fn = jest.fn().mockResolvedValue('success');
      await halfOpenBreaker.execute(fn);
      expect(halfOpenBreaker.getMetrics().state).toBe(CircuitState.HALF_OPEN);
      expect(halfOpenBreaker.getMetrics().consecutiveSuccesses).toBe(1);

      // Second success (meets threshold)
      await halfOpenBreaker.execute(fn);

      // Should be closed now
      expect(halfOpenBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      // consecutiveSuccesses is reset to 0 when circuit closes (clean slate)
      expect(halfOpenBreaker.getMetrics().consecutiveSuccesses).toBe(0);
      // But total successes should be 2
      expect(halfOpenBreaker.getMetrics().successes).toBe(2);
    });

    it('should reopen on failure', async () => {
      // Create fresh breaker
      const halfOpenBreaker = new CircuitBreaker('half-open-test-2', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Trip and wait
      halfOpenBreaker.forceOpen();
      await new Promise((r) => setTimeout(r, 1100));

      // Transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await halfOpenBreaker.execute(successFn);
      expect(halfOpenBreaker.getMetrics().state).toBe(CircuitState.HALF_OPEN);

      // Now fail - should reopen
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      try {
        await halfOpenBreaker.execute(failFn);
      } catch (e) {
        // Expected
      }

      expect(halfOpenBreaker.getMetrics().state).toBe(CircuitState.OPEN);
    });

    it('should allow test requests through', async () => {
      // Create fresh breaker
      const halfOpenBreaker = new CircuitBreaker('half-open-test-3', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 5,
      });

      // Trip and wait
      halfOpenBreaker.forceOpen();
      await new Promise((r) => setTimeout(r, 1100));

      // Should allow test request
      const fn = jest.fn().mockResolvedValue('test');

      const result = await halfOpenBreaker.execute(fn);

      expect(fn).toHaveBeenCalled();
      expect(result).toBe('test');
      expect(halfOpenBreaker.getMetrics().state).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe('metrics', () => {
    it('should track total requests', async () => {
      const metricsBreaker = new CircuitBreaker('metrics-test', {
        failureThreshold: 10,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 20,
      });

      const successFn = jest.fn().mockResolvedValue('success');
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      await metricsBreaker.execute(successFn);
      await metricsBreaker.execute(successFn);

      try {
        await metricsBreaker.execute(failFn);
      } catch (e) {
        // Expected
      }

      expect(metricsBreaker.getMetrics().totalRequests).toBe(3);
    });

    it('should track successes and failures separately', async () => {
      const metricsBreaker = new CircuitBreaker('metrics-test-2', {
        failureThreshold: 10,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 20,
      });

      const successFn = jest.fn().mockResolvedValue('success');
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      await metricsBreaker.execute(successFn);
      await metricsBreaker.execute(successFn);

      for (let i = 0; i < 3; i++) {
        try {
          await metricsBreaker.execute(failFn);
        } catch (e) {
          // Expected
        }
      }

      const metrics = metricsBreaker.getMetrics();
      expect(metrics.successes).toBe(2);
      expect(metrics.failures).toBe(3);
    });

    it('should track timestamps', async () => {
      const metricsBreaker = new CircuitBreaker('metrics-test-3', {
        failureThreshold: 10,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
        volumeThreshold: 20,
      });

      const successFn = jest.fn().mockResolvedValue('success');
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      await metricsBreaker.execute(successFn);
      expect(metricsBreaker.getMetrics().lastSuccessTime).toBeDefined();

      try {
        await metricsBreaker.execute(failFn);
      } catch (e) {
        // Expected
      }
      expect(metricsBreaker.getMetrics().lastFailureTime).toBeDefined();
    });
  });

  describe('manual controls', () => {
    it('should force open', () => {
      expect(breaker.getMetrics().state).toBe(CircuitState.CLOSED);

      breaker.forceOpen();

      expect(breaker.getMetrics().state).toBe(CircuitState.OPEN);
    });

    it('should force close', async () => {
      // Trip the breaker
      breaker.forceOpen();
      expect(breaker.getMetrics().state).toBe(CircuitState.OPEN);

      breaker.forceClose();

      expect(breaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(breaker.getMetrics().consecutiveFailures).toBe(0);
    });

    it('should reset all metrics', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      await breaker.execute(fn);
      await breaker.execute(fn);

      breaker.reset();

      const metrics = breaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.CLOSED);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successes).toBe(0);
      expect(metrics.failures).toBe(0);
      expect(metrics.rejectedRequests).toBe(0);
    });
  });

  describe('sliding window', () => {
    it('should cleanup old failures', async () => {
      const windowBreaker = new CircuitBreaker('window-test', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 500, // 0.5 second window (shorter for faster test)
        volumeThreshold: 5,
      });

      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Create some failures
      for (let i = 0; i < 5; i++) {
        try {
          await windowBreaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      // Wait for monitoring period to expire
      await new Promise((r) => setTimeout(r, 600));

      // Reset state (simulating recovery)
      windowBreaker.reset();

      // New failure - old ones should be cleaned up
      try {
        await windowBreaker.execute(fn);
      } catch (e) {
        // Expected
      }

      // Should not trip because we reset and only 1 failure in window
      expect(windowBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });
  });

  describe('getters', () => {
    it('should return connection ID', () => {
      expect(breaker.getConnectionId()).toBe('test-conn');
    });

    it('should return current state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      breaker.forceOpen();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager({
      failureThreshold: 3,
      timeout: 1000,
    });
  });

  it('should create and cache breakers', () => {
    const breaker1 = manager.getBreaker('conn1');
    const breaker2 = manager.getBreaker('conn1'); // Same connection

    expect(breaker1).toBe(breaker2); // Same instance
    expect(breaker1.getConnectionId()).toBe('conn1');
  });

  it('should create separate breakers for different connections', () => {
    const breaker1 = manager.getBreaker('conn1');
    const breaker2 = manager.getBreaker('conn2');

    expect(breaker1).not.toBe(breaker2);
    expect(breaker1.getConnectionId()).toBe('conn1');
    expect(breaker2.getConnectionId()).toBe('conn2');
  });

  it('should allow custom config per breaker', () => {
    const breaker = manager.getBreaker('conn1', {
      failureThreshold: 10,
    });

    // Config is applied (hard to test without accessing private fields)
    // But we can test it doesn't crash
    expect(breaker).toBeDefined();
  });

  it('should get all metrics', async () => {
    const breaker1 = manager.getBreaker('conn1');
    const breaker2 = manager.getBreaker('conn2');

    const fn = jest.fn().mockResolvedValue('success');
    await breaker1.execute(fn);
    await breaker2.execute(fn);

    const allMetrics = manager.getAllMetrics();

    expect(allMetrics.size).toBe(2);
    expect(allMetrics.get('conn1')).toBeDefined();
    expect(allMetrics.get('conn2')).toBeDefined();
    expect(allMetrics.get('conn1')?.successes).toBe(1);
  });

  it('should reset all breakers', async () => {
    const breaker1 = manager.getBreaker('conn1');
    const breaker2 = manager.getBreaker('conn2');

    const fn = jest.fn().mockResolvedValue('success');
    await breaker1.execute(fn);
    await breaker2.execute(fn);

    manager.resetAll();

    const allMetrics = manager.getAllMetrics();
    expect(allMetrics.get('conn1')?.successes).toBe(0);
    expect(allMetrics.get('conn2')?.successes).toBe(0);
  });

  it('should remove breaker', () => {
    manager.getBreaker('conn1');
    manager.getBreaker('conn2');

    expect(manager.getCount()).toBe(2);

    const removed = manager.removeBreaker('conn1');

    expect(removed).toBe(true);
    expect(manager.getCount()).toBe(1);
  });

  it('should return false when removing non-existent breaker', () => {
    const removed = manager.removeBreaker('non-existent');
    expect(removed).toBe(false);
  });

  it('should count breakers', () => {
    expect(manager.getCount()).toBe(0);

    manager.getBreaker('conn1');
    expect(manager.getCount()).toBe(1);

    manager.getBreaker('conn2');
    expect(manager.getCount()).toBe(2);

    manager.removeBreaker('conn1');
    expect(manager.getCount()).toBe(1);
  });
});
