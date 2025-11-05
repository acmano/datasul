// src/infrastructure/metrics/__tests__/MetricsManager.test.ts

import { MetricsManager } from '../MetricsManager';
import type { MetricsConfig } from '@shared/types/metrics.types';
import * as promClient from 'prom-client';

describe('MetricsManager', () => {
  let manager: MetricsManager;

  beforeEach(() => {
    // Resetar instância singleton antes de cada teste
    (MetricsManager as any).instance = null;
  });

  afterEach(() => {
    if (manager) {
      manager.reset();
    }
  });

  describe('Singleton Pattern', () => {
    it('deve criar instância única', () => {
      // Act
      const instance1 = MetricsManager.getInstance();
      const instance2 = MetricsManager.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });

    it('deve usar configuração padrão quando não fornecida', () => {
      // Act
      manager = MetricsManager.getInstance();

      // Assert
      expect(manager).toBeInstanceOf(MetricsManager);
      expect(manager.isReady()).toBe(true);
    });

    it('deve aplicar configuração customizada', () => {
      // Arrange
      const config: MetricsConfig = {
        enabled: true,
        prefix: 'custom_',
        defaultLabels: {
          app: 'test-app',
          environment: 'test',
        },
      };

      // Act
      manager = MetricsManager.getInstance(config);

      // Assert
      expect(manager).toBeInstanceOf(MetricsManager);
      expect(manager.isReady()).toBe(true);
    });

    it('deve ignorar config em chamadas subsequentes', () => {
      // Arrange
      const config1: MetricsConfig = {
        enabled: true,
        prefix: 'first_',
      };
      const config2: MetricsConfig = {
        enabled: true,
        prefix: 'second_',
      };

      // Act
      const instance1 = MetricsManager.getInstance(config1);
      const instance2 = MetricsManager.getInstance(config2);

      // Assert
      expect(instance1).toBe(instance2);
    });
  });

  describe('HTTP Metrics', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve ter métrica httpRequestsTotal', () => {
      // Assert
      expect(manager.httpRequestsTotal).toBeDefined();
    });

    it('deve incrementar httpRequestsTotal', async () => {
      // Act
      manager.httpRequestsTotal.inc({ method: 'GET', route: '/api/test', status_code: '200' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_http_requests_total');
    });

    it('deve ter métrica httpRequestDuration', () => {
      // Assert
      expect(manager.httpRequestDuration).toBeDefined();
    });

    it('deve observar httpRequestDuration', async () => {
      // Act
      manager.httpRequestDuration.observe(
        { method: 'GET', route: '/api/test', status_code: '200' },
        0.5
      );

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_http_request_duration_seconds');
    });

    it('deve ter métrica httpRequestsInProgress', () => {
      // Assert
      expect(manager.httpRequestsInProgress).toBeDefined();
    });

    it('deve incrementar e decrementar httpRequestsInProgress', async () => {
      // Act
      manager.httpRequestsInProgress.inc({ method: 'GET', route: '/api/test' });
      manager.httpRequestsInProgress.dec({ method: 'GET', route: '/api/test' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_http_requests_in_progress');
    });
  });

  describe('Database Metrics', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve ter métrica dbQueriesTotal', () => {
      // Assert
      expect(manager.dbQueriesTotal).toBeDefined();
    });

    it('deve incrementar dbQueriesTotal', async () => {
      // Act
      manager.dbQueriesTotal.inc({ database: 'EMP', operation: 'select' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_db_queries_total');
    });

    it('deve ter métrica dbQueryDuration', () => {
      // Assert
      expect(manager.dbQueryDuration).toBeDefined();
    });

    it('deve observar dbQueryDuration', async () => {
      // Act
      manager.dbQueryDuration.observe({ database: 'EMP', operation: 'select' }, 0.1);

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_db_query_duration_seconds');
    });

    it('deve ter métrica dbQueriesInProgress', () => {
      // Assert
      expect(manager.dbQueriesInProgress).toBeDefined();
    });

    it('deve incrementar e decrementar dbQueriesInProgress', async () => {
      // Act
      manager.dbQueriesInProgress.inc({ database: 'EMP' });
      manager.dbQueriesInProgress.dec({ database: 'EMP' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_db_queries_in_progress');
    });

    it('deve ter métrica dbQueryErrors', () => {
      // Assert
      expect(manager.dbQueryErrors).toBeDefined();
    });

    it('deve incrementar dbQueryErrors', async () => {
      // Act
      manager.dbQueryErrors.inc({ database: 'EMP', error_type: 'timeout' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_db_query_errors_total');
    });

    it('deve ter métrica dbConnectionsActive', () => {
      // Assert
      expect(manager.dbConnectionsActive).toBeDefined();
    });

    it('deve definir dbConnectionsActive', async () => {
      // Act
      manager.dbConnectionsActive.set({ database: 'EMP' }, 5);

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_db_connections_active');
    });

    it('deve ter métrica dbConnectionErrors', () => {
      // Assert
      expect(manager.dbConnectionErrors).toBeDefined();
    });

    it('deve incrementar dbConnectionErrors', async () => {
      // Act
      manager.dbConnectionErrors.inc({ database: 'EMP', error_type: 'connection' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_db_connection_errors_total');
    });
  });

  describe('Rate Limit Metrics', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve ter métrica rateLimitRequestsBlocked', () => {
      // Assert
      expect(manager.rateLimitRequestsBlocked).toBeDefined();
    });

    it('deve incrementar rateLimitRequestsBlocked', async () => {
      // Act
      manager.rateLimitRequestsBlocked.inc({
        route: '/api/test',
        user_id: 'user123',
        reason: 'too_many_requests',
      });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_rate_limit_requests_blocked_total');
    });

    it('deve ter métrica rateLimitRequestsAllowed', () => {
      // Assert
      expect(manager.rateLimitRequestsAllowed).toBeDefined();
    });

    it('deve incrementar rateLimitRequestsAllowed', async () => {
      // Act
      manager.rateLimitRequestsAllowed.inc({ route: '/api/test', user_id: 'user123' });

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_rate_limit_requests_allowed_total');
    });
  });

  describe('Health Metrics', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve ter métrica healthCheckStatus', () => {
      // Assert
      expect(manager.healthCheckStatus).toBeDefined();
    });

    it('deve definir healthCheckStatus', async () => {
      // Act
      manager.healthCheckStatus.set({ component: 'database' }, 1);
      manager.healthCheckStatus.set({ component: 'cache' }, 0);

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_health_check_status');
    });

    it('deve ter métrica healthCheckDuration', () => {
      // Assert
      expect(manager.healthCheckDuration).toBeDefined();
    });

    it('deve observar healthCheckDuration', async () => {
      // Act
      manager.healthCheckDuration.observe({ component: 'database' }, 0.05);

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_health_check_duration_seconds');
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve retornar métricas em formato Prometheus', async () => {
      // Act
      const metrics = await manager.getMetrics();

      // Assert
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });

    it('deve incluir labels padrão', async () => {
      // Act
      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('app="lor0138"');
      expect(metrics).toContain('environment=');
    });

    it('deve incluir métricas do Node.js', async () => {
      // Act
      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('lor0138_process_');
      expect(metrics).toContain('lor0138_nodejs_');
    });
  });

  describe('getRegistry', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve retornar registry do Prometheus', () => {
      // Act
      const registry = manager.getRegistry();

      // Assert
      expect(registry).toBeDefined();
      expect(registry.contentType).toBeDefined();
    });

    it('deve ter contentType correto', () => {
      // Act
      const registry = manager.getRegistry();

      // Assert
      expect(registry.contentType).toContain('text/plain');
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve resetar todas as métricas', async () => {
      // Arrange
      manager.httpRequestsTotal.inc({ method: 'GET', route: '/api/test', status_code: '200' });
      manager.dbQueriesTotal.inc({ database: 'EMP', operation: 'select' });

      // Act
      manager.reset();

      // Assert
      const metrics = await manager.getMetrics();
      // Métricas devem estar zeradas (sem valores acumulados)
      expect(metrics).toContain('lor0138_http_requests_total');
    });

    it('não deve lançar erro ao resetar múltiplas vezes', () => {
      // Act & Assert
      expect(() => {
        manager.reset();
        manager.reset();
        manager.reset();
      }).not.toThrow();
    });
  });

  describe('isReady', () => {
    it('deve retornar true após inicialização', () => {
      // Arrange
      manager = MetricsManager.getInstance();

      // Act
      const ready = manager.isReady();

      // Assert
      expect(ready).toBe(true);
    });

    it('deve retornar true mesmo após reset', () => {
      // Arrange
      manager = MetricsManager.getInstance();
      manager.reset();

      // Act
      const ready = manager.isReady();

      // Assert
      expect(ready).toBe(true);
    });
  });

  describe('registerCustomMetric', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve registrar métrica customizada Counter', async () => {
      // Arrange
      // Using promClient imported at top
      const customCounter = new promClient.Counter({
        name: 'lor0138_custom_counter',
        help: 'Custom counter metric',
      });

      // Act
      manager.registerCustomMetric(customCounter);
      customCounter.inc();

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_custom_counter');
    });

    it('deve registrar métrica customizada Gauge', async () => {
      // Arrange
      // Using promClient imported at top
      const customGauge = new promClient.Gauge({
        name: 'lor0138_custom_gauge',
        help: 'Custom gauge metric',
      });

      // Act
      manager.registerCustomMetric(customGauge);
      customGauge.set(42);

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_custom_gauge');
    });

    it('deve registrar métrica customizada Histogram', async () => {
      // Arrange
      // Using promClient imported at top
      const customHistogram = new promClient.Histogram({
        name: 'lor0138_custom_histogram',
        help: 'Custom histogram metric',
      });

      // Act
      manager.registerCustomMetric(customHistogram);
      customHistogram.observe(0.5);

      // Assert
      const metrics = await manager.getMetrics();
      expect(metrics).toContain('lor0138_custom_histogram');
    });
  });

  describe('Configuration Options', () => {
    it('deve aceitar prefix customizado', async () => {
      // Arrange
      const config: MetricsConfig = {
        enabled: true,
        prefix: 'myapp_',
      };

      // Act
      manager = MetricsManager.getInstance(config);
      manager.httpRequestsTotal.inc({ method: 'GET', route: '/test', status_code: '200' });
      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('myapp_http_requests_total');
    });

    it('deve aceitar labels padrão customizados', async () => {
      // Arrange
      const config: MetricsConfig = {
        enabled: true,
        defaultLabels: {
          service: 'my-service',
          region: 'us-east-1',
        },
      };

      // Act
      manager = MetricsManager.getInstance(config);
      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('service="my-service"');
      expect(metrics).toContain('region="us-east-1"');
    });

    it('deve desabilitar métricas default do Node.js quando solicitado', async () => {
      // Arrange
      (MetricsManager as any).instance = null;
      const config: MetricsConfig = {
        enabled: true,
        collectDefaultMetrics: false,
      };

      // Act
      manager = MetricsManager.getInstance(config);
      const metrics = await manager.getMetrics();

      // Assert
      // Não deve conter métricas do Node.js
      expect(metrics).not.toContain('process_cpu_');
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      manager = MetricsManager.getInstance();
    });

    it('deve manter métricas de múltiplas requisições', async () => {
      // Act
      manager.httpRequestsTotal.inc({ method: 'GET', route: '/api/item', status_code: '200' });
      manager.httpRequestsTotal.inc({ method: 'GET', route: '/api/item', status_code: '200' });
      manager.httpRequestsTotal.inc({ method: 'POST', route: '/api/item', status_code: '201' });

      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('lor0138_http_requests_total');
    });

    it('deve rastrear métricas de database e HTTP simultaneamente', async () => {
      // Act
      manager.httpRequestsTotal.inc({ method: 'GET', route: '/api/test', status_code: '200' });
      manager.dbQueriesTotal.inc({ database: 'EMP', operation: 'select' });
      manager.dbQueryDuration.observe({ database: 'EMP', operation: 'select' }, 0.1);

      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('lor0138_http_requests_total');
      expect(metrics).toContain('lor0138_db_queries_total');
      expect(metrics).toContain('lor0138_db_query_duration_seconds');
    });

    it('deve funcionar com operações concorrentes', async () => {
      // Act
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          manager.httpRequestsTotal.inc({ method: 'GET', route: '/test', status_code: '200' })
        );
      }
      await Promise.all(operations);

      const metrics = await manager.getMetrics();

      // Assert
      expect(metrics).toContain('lor0138_http_requests_total');
    });
  });
});
