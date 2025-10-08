// src/infrastructure/metrics/types/index.ts

/**
 * @fileoverview Tipos de métricas - Re-exportação
 *
 * @description
 * Este arquivo re-exporta todos os tipos relacionados a métricas do módulo
 * central em @shared/types/metrics.types. Permite importação consistente
 * de qualquer localização do projeto.
 *
 * PROPÓSITO:
 * - Centralizar tipos de métricas em um único local
 * - Permitir importação flexível de múltiplos caminhos
 * - Manter compatibilidade retroativa
 *
 * @module infrastructure/metrics/types
 *
 * @example
 * ```typescript
 * // Importar de infrastructure/metrics
 * import { MetricsConfig, HttpMetrics } from '@infrastructure/metrics/types';
 *
 * // Importar diretamente de shared
 * import { MetricsConfig, HttpMetrics } from '@shared/types/metrics.types';
 *
 * // Ambos são equivalentes!
 * ```
 */

// ====================================================================
// RE-EXPORTAÇÃO DE TIPOS
// ====================================================================

/**
 * Re-exporta todos os tipos de métricas do arquivo central
 *
 * @description
 * Importa e re-exporta todos os tipos, interfaces e enums relacionados
 * ao sistema de métricas. Facilita importação e mantém código DRY.
 *
 * Tipos re-exportados:
 * - MetricsConfig: Configuração do sistema de métricas
 * - HttpMetrics: Métricas de requisições HTTP/API
 * - DatabaseMetrics: Métricas de queries e conexões
 * - RateLimitMetrics: Métricas de rate limiting
 * - SystemMetrics: Métricas do sistema Node.js
 * - MetricsSummary: Resumo consolidado de todas as métricas
 * - MetricType: Tipos de métricas Prometheus
 * - MetricDefinition: Definição de uma métrica customizada
 *
 * @see {@link @shared/types/metrics.types} Para documentação completa dos tipos
 */
export * from '@shared/types/metrics.types';