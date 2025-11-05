// src/infrastructure/chaos/__tests__/ChaosInjector.test.ts

/**
 * Chaos Injector Unit Tests
 *
 * @description
 * Tests for chaos engineering functionality.
 * Validates that chaos is injected correctly based on configuration.
 */

import { ChaosInjector, ChaosType, ChaosConfig } from '../ChaosInjector';

describe('ChaosInjector', () => {
  let injector: ChaosInjector;

  beforeEach(() => {
    // Create fresh instance for each test
    injector = new ChaosInjector();
  });

  afterEach(() => {
    // Clean up
    injector.getActiveExperimentsList().forEach((name) => {
      injector.unregisterExperiment(name);
    });
  });

  describe('registerExperiment', () => {
    it('should register experiment successfully', () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.LATENCY,
        probability: 0.5,
        minLatencyMs: 100,
        maxLatencyMs: 200,
      };

      injector.registerExperiment('test', config);

      const active = injector.getActiveExperimentsList();
      expect(active).toContain('test');
    });

    it('should not register disabled experiment', () => {
      const config: ChaosConfig = {
        enabled: false,
        type: ChaosType.LATENCY,
        probability: 0.5,
      };

      injector.registerExperiment('test', config);

      const active = injector.getActiveExperimentsList();
      expect(active).not.toContain('test');
    });

    it('should block production without override', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.CHAOS_PRODUCTION_OVERRIDE;

      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.ERROR,
        probability: 1.0,
      };

      expect(() => {
        injector.registerExperiment('test', config);
      }).toThrow('CHAOS ENGINEERING BLOCKED IN PRODUCTION');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('injectChaos', () => {
    it('should execute operation without chaos when no experiments', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await injector.injectChaos('test-conn', operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should inject latency', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.LATENCY,
        probability: 1.0,
        minLatencyMs: 50,
        maxLatencyMs: 100,
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');
      const start = Date.now();

      const result = await injector.injectChaos('test-conn', operation);

      const duration = Date.now() - start;

      expect(result).toBe('success');
      expect(duration).toBeGreaterThanOrEqual(50);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should inject timeout error', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.TIMEOUT,
        probability: 1.0,
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      await expect(injector.injectChaos('test-conn', operation)).rejects.toThrow('ETIMEDOUT');
    });

    it('should inject random error', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.ERROR,
        probability: 1.0,
        errorTypes: ['ECONNREFUSED'],
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      await expect(injector.injectChaos('test-conn', operation)).rejects.toThrow();
    });

    it('should respect probability', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.ERROR,
        probability: 0.0, // Never inject
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      // Should never fail with 0 probability
      for (let i = 0; i < 10; i++) {
        const result = await injector.injectChaos('test-conn', operation);
        expect(result).toBe('success');
      }

      expect(operation).toHaveBeenCalledTimes(10);
    });

    it('should respect target connections', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.ERROR,
        probability: 1.0,
        targetConnections: ['target-conn'],
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      // Should not affect other connections
      const result = await injector.injectChaos('other-conn', operation);
      expect(result).toBe('success');

      // Should affect target connection
      await expect(injector.injectChaos('target-conn', operation)).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should track statistics', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.LATENCY,
        probability: 1.0,
        minLatencyMs: 10,
        maxLatencyMs: 20,
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      await injector.injectChaos('test-conn', operation);
      await injector.injectChaos('test-conn', operation);

      const stats = injector.getStats('test');

      expect(stats).toBeDefined();
      expect(stats!.totalCalls).toBe(2);
      expect(stats!.chaosInjected).toBe(2);
      expect(stats!.latencyInjected).toBe(2);
    });

    it('should reset statistics', async () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.LATENCY,
        probability: 1.0,
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      await injector.injectChaos('test-conn', operation);

      let stats = injector.getStats('test');
      expect(stats!.totalCalls).toBe(1);

      injector.resetStats('test');

      stats = injector.getStats('test');
      expect(stats!.totalCalls).toBe(0);
    });
  });

  describe('unregisterExperiment', () => {
    it('should remove experiment', () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.LATENCY,
        probability: 0.5,
      };

      injector.registerExperiment('test', config);
      expect(injector.getActiveExperimentsList()).toContain('test');

      injector.unregisterExperiment('test');
      expect(injector.getActiveExperimentsList()).not.toContain('test');
    });
  });

  describe('isEnabled', () => {
    it('should return false when no experiments', () => {
      expect(injector.isEnabled()).toBe(false);
    });

    it('should return true when experiments active', () => {
      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.LATENCY,
        probability: 0.5,
      };

      injector.registerExperiment('test', config);
      expect(injector.isEnabled()).toBe(true);
    });
  });

  describe('schedule', () => {
    it('should respect time schedule', async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Schedule for current time +/- 1 hour
      const startHour = currentHour === 0 ? 23 : currentHour - 1;
      const endHour = currentHour === 23 ? 0 : currentHour + 1;

      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.ERROR,
        probability: 1.0,
        schedule: {
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
        },
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      // Should inject (within schedule)
      await expect(injector.injectChaos('test-conn', operation)).rejects.toThrow();
    });

    it('should respect day of week schedule', async () => {
      const now = new Date();
      const today = now.getDay();

      const config: ChaosConfig = {
        enabled: true,
        type: ChaosType.ERROR,
        probability: 1.0,
        schedule: {
          daysOfWeek: [today], // Only today
        },
      };

      injector.registerExperiment('test', config);

      const operation = jest.fn().mockResolvedValue('success');

      // Should inject (today matches)
      await expect(injector.injectChaos('test-conn', operation)).rejects.toThrow();
    });
  });
});
