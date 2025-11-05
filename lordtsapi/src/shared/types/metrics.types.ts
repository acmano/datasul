// src/shared/types/metrics.types.ts

/**
 * Tipos e Interfaces de Métricas
 *
 * @module shared/types/metrics.types
 * @version 1.0.0
 * @see METRICS_TYPES.md para documentação completa
 *
 * Sistema de métricas para integração com Prometheus/Grafana.
 *
 * Exports:
 * - MetricsConfig: configuração do sistema
 * - HttpMetrics: métricas HTTP/API
 * - DatabaseMetrics: métricas de banco de dados
 * - RateLimitMetrics: métricas de rate limiting
 * - SystemMetrics: métricas do sistema Node.js
 * - MetricsSummary: agregação de todas métricas
 * - MetricType: tipos Prometheus (counter/gauge/histogram/summary)
 * - MetricDefinition: definição de métricas customizadas
 *
 * @example
 * import { MetricsSummary, HttpMetrics } from '@shared/types/metrics.types';
 *
 * const summary: MetricsSummary = {
 *   timestamp: new Date().toISOString(),
 *   http: httpMetrics,
 *   database: dbMetrics,
 *   rateLimit: rateLimitMetrics,
 *   system: systemMetrics
 * };
 */

/**
 * Configuração do sistema de métricas Prometheus
 *
 * @interface MetricsConfig
 */
export interface MetricsConfig {
  /** Habilita/desabilita coleta de métricas */
  enabled: boolean;

  /** Labels padrão adicionados a todas métricas */
  defaultLabels?: Record<string, string>;

  /** Coleta métricas padrão do Node.js (CPU, memória, etc) */
  collectDefaultMetrics?: boolean;

  /** Prefixo adicionado a todas métricas customizadas */
  prefix?: string;
}

/**
 * Métricas de requisições HTTP e API
 *
 * @interface HttpMetrics
 */
export interface HttpMetrics {
  /** Total de requisições processadas (Counter) */
  totalRequests: number;

  /** Número de requisições sendo processadas no momento (Gauge) */
  requestsInProgress: number;

  /** Duração das requisições em segundos - média (Histogram) */
  requestDuration: number;

  /** Contadores de requisições por status HTTP */
  requestsByStatus: Record<number, number>;

  /** Contadores de requisições por endpoint */
  requestsByEndpoint: Record<string, number>;
}

/**
 * Métricas de operações de banco de dados
 *
 * @interface DatabaseMetrics
 */
export interface DatabaseMetrics {
  /** Total de queries executadas (Counter) */
  queriesTotal: number;

  /** Número de queries em execução no momento (Gauge) */
  queriesInProgress: number;

  /** Duração das queries em segundos - média (Histogram) */
  queryDuration: number;

  /** Total de erros em queries (Counter) */
  queryErrors: number;

  /** Número de conexões ativas com banco (Gauge) */
  connectionsActive: number;

  /** Total de erros de conexão (Counter) */
  connectionErrors: number;
}

/**
 * Métricas de rate limiting e controle de acesso
 *
 * @interface RateLimitMetrics
 */
export interface RateLimitMetrics {
  /** Total de requisições bloqueadas por rate limit (Counter) */
  requestsBlocked: number;

  /** Total de requisições permitidas (Counter) */
  requestsAllowed: number;

  /** Contadores de bloqueios por usuário */
  limitsByUser: Record<string, number>;

  /** Contadores de bloqueios por endpoint */
  limitsByEndpoint: Record<string, number>;
}

/**
 * Métricas do sistema Node.js
 *
 * @interface SystemMetrics
 */
export interface SystemMetrics {
  /** Tempo de atividade do processo em segundos (Gauge) */
  uptime: number;

  /** Uso de memória do processo em bytes */
  memoryUsage: {
    /** Memória heap em uso (JavaScript objects) */
    heapUsed: number;
    /** Total de heap alocado */
    heapTotal: number;
    /** Resident Set Size - memória total do processo */
    rss: number;
    /** Memória de buffers C++ (fora do heap V8) */
    external: number;
  };

  /** Uso de CPU do processo em microsegundos */
  cpuUsage: {
    /** Tempo de CPU em modo usuário */
    user: number;
    /** Tempo de CPU em modo kernel */
    system: number;
  };
}

/**
 * Agregação de todas as métricas da aplicação
 *
 * @interface MetricsSummary
 */
export interface MetricsSummary {
  /** Timestamp da coleta em formato ISO 8601 */
  timestamp: string;

  /** Métricas de requisições HTTP/API */
  http: HttpMetrics;

  /** Métricas de banco de dados */
  database: DatabaseMetrics;

  /** Métricas de rate limiting */
  rateLimit: RateLimitMetrics;

  /** Métricas de sistema Node.js */
  system: SystemMetrics;
}

/**
 * Tipos de métricas suportados pelo Prometheus
 *
 * - counter: valor que só aumenta (ex: total de requests)
 * - gauge: valor que pode subir e descer (ex: requests ativas)
 * - histogram: distribução de valores (ex: duração de requests)
 * - summary: similar ao histogram, com quantiles calculados
 *
 * @see https://prometheus.io/docs/concepts/metric_types/
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Definição de uma métrica Prometheus
 *
 * @interface MetricDefinition
 */
export interface MetricDefinition {
  /** Nome da métrica (usar snake_case) */
  name: string;

  /** Descrição da métrica (aparece no Prometheus) */
  help: string;

  /** Tipo da métrica Prometheus */
  type: MetricType;

  /** Labels (dimensões) da métrica para agregação e filtragem */
  labelNames?: string[];
}
