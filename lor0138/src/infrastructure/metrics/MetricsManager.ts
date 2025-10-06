// src/infrastructure/metrics/MetricsManager.ts

import client from 'prom-client';
import { MetricsConfig } from '@shared/types/metrics.types';

/**
 * Gerenciador central de métricas Prometheus
 * Singleton que gerencia todas as métricas da aplicação
 */
export class MetricsManager {
  private static instance: MetricsManager | null = null;
  private registry: client.Registry;
  private isInitialized: boolean = false;

  // 📊 HTTP Metrics
  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;
  public httpRequestsInProgress: client.Gauge<string>;

  // 🗄️ Database Metrics
  public dbQueriesTotal: client.Counter<string>;
  public dbQueryDuration: client.Histogram<string>;
  public dbQueriesInProgress: client.Gauge<string>;
  public dbQueryErrors: client.Counter<string>;
  public dbConnectionsActive: client.Gauge<string>;
  public dbConnectionErrors: client.Counter<string>;

  // 🔒 Rate Limit Metrics
  public rateLimitRequestsBlocked: client.Counter<string>;
  public rateLimitRequestsAllowed: client.Counter<string>;

  // ⚕️ Health Metrics
  public healthCheckStatus: client.Gauge<string>;
  public healthCheckDuration: client.Histogram<string>;

  private constructor(config: MetricsConfig) {
    this.registry = new client.Registry();

    // Labels padrão para todas as métricas
    if (config.defaultLabels) {
      this.registry.setDefaultLabels(config.defaultLabels);
    }

    // Prefixo para todas as métricas
    const prefix = config.prefix || 'lor0138_';

    // ========================================
    // 📊 HTTP METRICS
    // ========================================
    this.httpRequestsTotal = new client.Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new client.Gauge({
      name: `${prefix}http_requests_in_progress`,
      help: 'Número de requisições HTTP em andamento',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // ========================================
    // 🗄️ DATABASE METRICS
    // ========================================
    this.dbQueriesTotal = new client.Counter({
      name: `${prefix}db_queries_total`,
      help: 'Total de queries executadas',
      labelNames: ['database', 'operation'],
      registers: [this.registry],
    });

    this.dbQueryDuration = new client.Histogram({
      name: `${prefix}db_query_duration_seconds`,
      help: 'Duração das queries em segundos',
      labelNames: ['database', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.dbQueriesInProgress = new client.Gauge({
      name: `${prefix}db_queries_in_progress`,
      help: 'Número de queries em andamento',
      labelNames: ['database'],
      registers: [this.registry],
    });

    this.dbQueryErrors = new client.Counter({
      name: `${prefix}db_query_errors_total`,
      help: 'Total de erros em queries',
      labelNames: ['database', 'error_type'],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new client.Gauge({
      name: `${prefix}db_connections_active`,
      help: 'Número de conexões ativas com o banco',
      labelNames: ['database'],
      registers: [this.registry],
    });

    this.dbConnectionErrors = new client.Counter({
      name: `${prefix}db_connection_errors_total`,
      help: 'Total de erros de conexão',
      labelNames: ['database', 'error_type'],
      registers: [this.registry],
    });

    // ========================================
    // 🔒 RATE LIMIT METRICS
    // ========================================
    this.rateLimitRequestsBlocked = new client.Counter({
      name: `${prefix}rate_limit_requests_blocked_total`,
      help: 'Total de requisições bloqueadas por rate limit',
      labelNames: ['route', 'user_id', 'reason'],
      registers: [this.registry],
    });

    this.rateLimitRequestsAllowed = new client.Counter({
      name: `${prefix}rate_limit_requests_allowed_total`,
      help: 'Total de requisições permitidas',
      labelNames: ['route', 'user_id'],
      registers: [this.registry],
    });

    // ========================================
    // ⚕️ HEALTH METRICS
    // ========================================
    this.healthCheckStatus = new client.Gauge({
      name: `${prefix}health_check_status`,
      help: 'Status do health check (1 = healthy, 0 = unhealthy)',
      labelNames: ['component'],
      registers: [this.registry],
    });

    this.healthCheckDuration = new client.Histogram({
      name: `${prefix}health_check_duration_seconds`,
      help: 'Duração do health check em segundos',
      labelNames: ['component'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
      registers: [this.registry],
    });

    // ========================================
    // 💻 SYSTEM METRICS (Node.js default)
    // ========================================
    if (config.collectDefaultMetrics !== false) {
      client.collectDefaultMetrics({
        register: this.registry,
        prefix,
      });
    }

    this.isInitialized = true;
    console.log('✅ MetricsManager inicializado');
  }

  /**
   * Retorna instância singleton
   */
  static getInstance(config?: MetricsConfig): MetricsManager {
    if (!this.instance) {
      const defaultConfig: MetricsConfig = {
        enabled: true,
        collectDefaultMetrics: true,
        prefix: 'lor0138_',
        defaultLabels: {
          app: 'lor0138',
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
        },
      };

      this.instance = new MetricsManager({ ...defaultConfig, ...config });
    }

    return this.instance;
  }

  /**
   * Retorna as métricas no formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Retorna o registro para uso externo
   */
  getRegistry(): client.Registry {
    return this.registry;
  }

  /**
   * Reseta todas as métricas (útil para testes)
   */
  reset(): void {
    this.registry.resetMetrics();
  }

  /**
   * Verifica se está inicializado
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Registra métrica customizada
   */
  registerCustomMetric(metric: client.Metric): void {
    this.registry.registerMetric(metric);
  }
}

// Export singleton instance
export const metricsManager = MetricsManager.getInstance();