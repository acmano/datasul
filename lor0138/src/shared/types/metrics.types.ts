// src/shared/types/metrics.types.ts

/**
 * Configuração do sistema de métricas
 */
export interface MetricsConfig {
  enabled: boolean;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
  prefix?: string;
}

/**
 * Métricas HTTP/API
 */
export interface HttpMetrics {
  totalRequests: number;
  requestsInProgress: number;
  requestDuration: number;
  requestsByStatus: Record<number, number>;
  requestsByEndpoint: Record<string, number>;
}

/**
 * Métricas de Database
 */
export interface DatabaseMetrics {
  queriesTotal: number;
  queriesInProgress: number;
  queryDuration: number;
  queryErrors: number;
  connectionsActive: number;
  connectionErrors: number;
}

/**
 * Métricas de Rate Limiting
 */
export interface RateLimitMetrics {
  requestsBlocked: number;
  requestsAllowed: number;
  limitsByUser: Record<string, number>;
  limitsByEndpoint: Record<string, number>;
}

/**
 * Métricas de Sistema (Node.js)
 */
export interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

/**
 * Resumo de todas as métricas
 */
export interface MetricsSummary {
  timestamp: string;
  http: HttpMetrics;
  database: DatabaseMetrics;
  rateLimit: RateLimitMetrics;
  system: SystemMetrics;
}

/**
 * Tipos de métricas Prometheus
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Definição de uma métrica
 */
export interface MetricDefinition {
  name: string;
  help: string;
  type: MetricType;
  labelNames?: string[];
}