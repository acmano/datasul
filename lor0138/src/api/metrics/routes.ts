// src/api/metrics/routes.ts

/**
 * @fileoverview Rotas para exposição de métricas no formato Prometheus
 *
 * Fornece endpoints para:
 * - Scraping de métricas pelo Prometheus (/metrics)
 * - Health check do sistema de métricas (/metrics/health)
 *
 * As métricas incluem:
 * - HTTP: requests total, duração, requests em progresso
 * - Database: queries total, duração, erros, conexões ativas
 * - Rate Limit: requests bloqueadas/permitidas
 * - Sistema: CPU, memória, uptime (Node.js default metrics)
 *
 * @module api/metrics/routes
 * @requires express
 * @requires @infrastructure/metrics/MetricsManager
 *
 * @example
 * ```typescript
 * // No app.ts
 * import metricsRoutes from './api/metrics/routes';
 * app.use('/metrics', metricsRoutes);
 * ```
 */

import { Router, Request, Response } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

const router = Router();

/**
 * GET /metrics
 * Retorna todas as métricas no formato Prometheus
 *
 * @route GET /metrics
 * @access Public (configurar autenticação em produção)
 *
 * @returns {string} 200 - Métricas em formato texto Prometheus
 * @returns {Object} 500 - Erro ao coletar métricas
 *
 * @description
 * Endpoint de scraping para o Prometheus.
 * Retorna todas as métricas coletadas no formato esperado pelo Prometheus.
 *
 * Métricas disponíveis:
 * - **HTTP**: lor0138_http_requests_total, lor0138_http_request_duration_seconds, etc
 * - **Database**: lor0138_db_queries_total, lor0138_db_query_duration_seconds, etc
 * - **Rate Limit**: lor0138_rate_limit_requests_blocked_total, etc
 * - **Health**: lor0138_health_check_status, etc
 * - **Sistema**: process_cpu_seconds_total, nodejs_heap_size_total_bytes, etc
 *
 * @example Request
 * ```bash
 * curl http://localhost:3000/metrics
 * ```
 *
 * @example Response (formato Prometheus)
 * ```
 * # HELP lor0138_http_requests_total Total de requisições HTTP
 * # TYPE lor0138_http_requests_total counter
 * lor0138_http_requests_total{method="GET",route="/api/...",status_code="200"} 42
 * lor0138_http_requests_total{method="POST",route="/api/...",status_code="201"} 15
 *
 * # HELP lor0138_http_request_duration_seconds Duração das requisições HTTP
 * # TYPE lor0138_http_request_duration_seconds histogram
 * lor0138_http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api/..."} 35
 * lor0138_http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api/..."} 40
 * lor0138_http_request_duration_seconds_sum{method="GET",route="/api/..."} 0.523
 * lor0138_http_request_duration_seconds_count{method="GET",route="/api/..."} 42
 *
 * # HELP lor0138_db_queries_total Total de queries no banco de dados
 * # TYPE lor0138_db_queries_total counter
 * lor0138_db_queries_total{database="EMP",operation="select"} 128
 * lor0138_db_queries_total{database="MULT",operation="select"} 45
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: Em produção, configure autenticação para este endpoint
 * para evitar exposição pública de métricas sensíveis.
 *
 * @remarks
 * 💡 Configuração recomendada no Prometheus (prometheus.yml):
 * ```yaml
 * scrape_configs:
 *   - job_name: 'lor0138'
 *     scrape_interval: 15s
 *     static_configs:
 *       - targets: ['lor0138.lorenzetti.ibe:3000']
 *     metrics_path: '/metrics'
 * ```
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Define content-type correto para Prometheus
    res.set('Content-Type', metricsManager.getRegistry().contentType);

    // Obtém todas as métricas
    const metrics = await metricsManager.getMetrics();

    // Retorna no formato texto Prometheus
    res.end(metrics);
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({
      error: 'Erro ao obter métricas',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /metrics/health
 * Health check específico para o sistema de métricas
 *
 * @route GET /metrics/health
 * @access Public
 *
 * @returns {Object} 200 - Sistema de métricas funcionando corretamente
 * @returns {Object} 503 - Sistema de métricas não inicializado ou com problemas
 *
 * @description
 * Verifica se o sistema de métricas está funcionando corretamente.
 * Útil para monitorar a saúde do próprio sistema de monitoramento.
 *
 * Diferente do `/health` global que verifica toda a aplicação,
 * este endpoint foca especificamente no sistema de métricas.
 *
 * @example Request
 * ```bash
 * curl http://localhost:3000/metrics/health
 * ```
 *
 * @example Response (healthy)
 * ```json
 * {
 *   "status": "healthy",
 *   "metrics": {
 *     "enabled": true,
 *     "ready": true
 *   }
 * }
 * ```
 *
 * @example Response (unhealthy)
 * ```json
 * {
 *   "status": "unhealthy",
 *   "metrics": {
 *     "enabled": true,
 *     "ready": false
 *   }
 * }
 * ```
 *
 * @remarks
 * Status codes:
 * - 200: Sistema de métricas operacional
 * - 503: Sistema de métricas não inicializado ou com erro
 *
 * @remarks
 * Use este endpoint em:
 * - Kubernetes liveness probe
 * - Docker healthcheck
 * - Load balancer health check
 * - Scripts de monitoramento
 */
router.get('/health', (req: Request, res: Response) => {
  const isReady = metricsManager.isReady();

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'healthy' : 'unhealthy',
    metrics: {
      enabled: true,
      ready: isReady,
    },
  });
});

export default router;