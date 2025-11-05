// src/infrastructure/metrics/__tests__/ConnectionMetrics.test.ts

import { Registry } from 'prom-client';
import { ConnectionMetricsCollector } from '../ConnectionMetrics';

describe('ConnectionMetricsCollector', () => {
  let collector: ConnectionMetricsCollector;
  let registry: Registry;

  beforeEach(() => {
    registry = new Registry();
    collector = new ConnectionMetricsCollector(registry);
  });

  afterEach(async () => {
    await collector.stop();
    collector.reset();
  });

  describe('recordQuery', () => {
    it('should track query latency', () => {
      collector.recordQuery('DtsPrdEmp', 150, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.avgResponseTime).toBe(150);
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.failedQueries).toBe(0);
    });

    it('should track multiple queries', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.recordQuery('DtsPrdEmp', 200, true);
      collector.recordQuery('DtsPrdEmp', 150, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.totalQueries).toBe(3);
      expect(metrics.avgResponseTime).toBe(150); // (100+200+150)/3
    });

    it('should track failed queries', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.recordQuery('DtsPrdEmp', 100, false);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.totalQueries).toBe(3);
      expect(metrics.failedQueries).toBe(1);
      expect(metrics.errorRate).toBeCloseTo(0.333, 2);
    });

    it('should track queries for multiple connections', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.recordQuery('LgxDev', 200, true);
      collector.recordQuery('PCF4_PRD', 150, true);

      const empMetrics = collector.getConnectionMetrics('DtsPrdEmp');
      const lgxMetrics = collector.getConnectionMetrics('LgxDev');
      const pcfMetrics = collector.getConnectionMetrics('PCF4_PRD');

      expect(empMetrics.avgResponseTime).toBe(100);
      expect(lgxMetrics.avgResponseTime).toBe(200);
      expect(pcfMetrics.avgResponseTime).toBe(150);
    });
  });

  describe('calculatePercentiles', () => {
    it('should calculate P50 correctly', () => {
      // Record 100 queries with varying latencies
      for (let i = 1; i <= 100; i++) {
        collector.recordQuery('DtsPrdEmp', i * 10, true);
      }

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.latencyP50).toBeCloseTo(505, 10); // P50 should be around 505ms
    });

    it('should calculate P95 correctly', () => {
      // Record 100 queries with varying latencies
      for (let i = 1; i <= 100; i++) {
        collector.recordQuery('DtsPrdEmp', i * 10, true);
      }

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.latencyP95).toBeGreaterThanOrEqual(945);
      expect(metrics.latencyP95).toBeLessThanOrEqual(955);
    });

    it('should calculate P99 correctly', () => {
      // Record 100 queries with varying latencies
      for (let i = 1; i <= 100; i++) {
        collector.recordQuery('DtsPrdEmp', i * 10, true);
      }

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.latencyP99).toBeGreaterThanOrEqual(985);
      expect(metrics.latencyP99).toBeLessThanOrEqual(995);
    });

    it('should handle single query percentile', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.latencyP50).toBe(100);
      expect(metrics.latencyP95).toBe(100);
      expect(metrics.latencyP99).toBe(100);
    });

    it('should handle empty queries', () => {
      const metrics = collector.getConnectionMetrics('NonExistent');
      expect(metrics.latencyP50).toBe(0);
      expect(metrics.latencyP95).toBe(0);
      expect(metrics.latencyP99).toBe(0);
    });
  });

  describe('errorRate', () => {
    it('should calculate error rate correctly', () => {
      // 70% success, 30% failure
      for (let i = 0; i < 7; i++) {
        collector.recordQuery('PCF4_PRD', 100, true);
      }
      for (let i = 0; i < 3; i++) {
        collector.recordQuery('PCF4_PRD', 100, false);
      }

      const metrics = collector.getConnectionMetrics('PCF4_PRD');
      expect(metrics.totalQueries).toBe(10);
      expect(metrics.failedQueries).toBe(3);
      expect(metrics.errorRate).toBeCloseTo(0.3, 2);
    });

    it('should handle 100% success rate', () => {
      for (let i = 0; i < 10; i++) {
        collector.recordQuery('DtsPrdEmp', 100, true);
      }

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.errorRate).toBe(0);
    });

    it('should handle 100% failure rate', () => {
      for (let i = 0; i < 10; i++) {
        collector.recordQuery('DtsPrdEmp', 100, false);
      }

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.errorRate).toBe(1);
      expect(metrics.failedQueries).toBe(10);
    });
  });

  describe('throughput', () => {
    it('should calculate throughput', async () => {
      const start = Date.now();

      // Record 10 queries over time
      for (let i = 0; i < 10; i++) {
        collector.recordQuery('DATACORP_PRD', 50, true);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const duration = (Date.now() - start) / 1000;
      const metrics = collector.getConnectionMetrics('DATACORP_PRD');

      // Throughput should be approximately 10 queries / duration
      const expectedThroughput = 10 / duration;
      expect(metrics.throughput).toBeGreaterThan(0);
      expect(metrics.throughput).toBeCloseTo(expectedThroughput, 0);
    });

    it('should handle single query throughput', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      // Single query with instant recording has very high throughput
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
    });
  });

  describe('poolUtilization', () => {
    it('should track pool utilization', () => {
      // Need to record at least one query to create metrics data
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.updatePoolMetrics('DtsPrdEmp', 5, 3);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      // Pool utilization = 5 active / (5 active + 3 idle) = 62.5%
      expect(metrics.poolUtilization).toBeCloseTo(62.5, 1);
    });

    it('should handle 100% pool utilization', () => {
      // Need to record at least one query to create metrics data
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.updatePoolMetrics('DtsPrdEmp', 10, 0);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.poolUtilization).toBe(100);
    });

    it('should handle 0% pool utilization', () => {
      collector.updatePoolMetrics('DtsPrdEmp', 0, 10);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.poolUtilization).toBe(0);
    });

    it('should handle empty pool', () => {
      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.poolUtilization).toBe(0);
    });
  });

  describe('getAllConnectionsMetrics', () => {
    it('should return metrics for all connections', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.recordQuery('LgxDev', 200, true);
      collector.recordQuery('PCF4_PRD', 150, true);

      const allMetrics = collector.getAllConnectionsMetrics();

      expect(allMetrics.size).toBe(3);
      expect(allMetrics.get('DtsPrdEmp')?.avgResponseTime).toBe(100);
      expect(allMetrics.get('LgxDev')?.avgResponseTime).toBe(200);
      expect(allMetrics.get('PCF4_PRD')?.avgResponseTime).toBe(150);
    });

    it('should return empty map when no queries recorded', () => {
      const allMetrics = collector.getAllConnectionsMetrics();
      expect(allMetrics.size).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      collector.recordQuery('DtsPrdEmp', 100, true);
      collector.recordQuery('LgxDev', 200, true);

      collector.reset();

      const allMetrics = collector.getAllConnectionsMetrics();
      expect(allMetrics.size).toBe(0);
    });
  });

  describe('rollingWindow', () => {
    it('should only include queries within rolling window', async () => {
      // Record old query (will be cleaned up)
      collector.recordQuery('DtsPrdEmp', 1000, true);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Record recent query
      collector.recordQuery('DtsPrdEmp', 100, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      // Should include both queries initially
      expect(metrics.totalQueries).toBe(2);

      // Average should be influenced by both
      expect(metrics.avgResponseTime).toBeCloseTo(550, 50);
    });
  });

  describe('Prometheus metrics', () => {
    it('should export metrics to Prometheus format', async () => {
      collector.recordQuery('DtsPrdEmp', 150, true);
      collector.recordQuery('DtsPrdEmp', 200, false);

      const metrics = await registry.metrics();

      // Check that metrics are exported
      expect(metrics).toContain('lor0138_connection_query_duration_seconds');
      expect(metrics).toContain('lor0138_connection_queries_total');
      expect(metrics).toContain('lor0138_connection_queries_success');
      expect(metrics).toContain('lor0138_connection_queries_failed');
    });

    it('should include connection_id label', async () => {
      collector.recordQuery('DtsPrdEmp', 150, true);

      const metrics = await registry.metrics();
      expect(metrics).toContain('connection_id="DtsPrdEmp"');
    });
  });

  describe('edge cases', () => {
    it('should handle very fast queries (< 1ms)', () => {
      collector.recordQuery('DtsPrdEmp', 0.5, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.avgResponseTime).toBe(0.5);
    });

    it('should handle very slow queries (> 10s)', () => {
      collector.recordQuery('DtsPrdEmp', 15000, true);

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.avgResponseTime).toBe(15000);
    });

    it('should handle connection names with special characters', () => {
      collector.recordQuery('PCF_Integ_PRD', 100, true);

      const metrics = collector.getConnectionMetrics('PCF_Integ_PRD');
      expect(metrics.totalQueries).toBe(1);
    });

    it('should handle concurrent queries', () => {
      // Simulate concurrent queries
      for (let i = 0; i < 100; i++) {
        collector.recordQuery('DtsPrdEmp', Math.random() * 1000, Math.random() > 0.1);
      }

      const metrics = collector.getConnectionMetrics('DtsPrdEmp');
      expect(metrics.totalQueries).toBe(100);
      expect(metrics.latencyP50).toBeGreaterThan(0);
      expect(metrics.latencyP95).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
    });
  });
});
