// src/presentation/metrics/routes.ts

import { Router, Request, Response } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';
import { log } from '@shared/utils/logger';

const router = Router();

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Retorna métricas no formato Prometheus
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Métricas em formato texto Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: |
 *               # HELP lor0138_http_requests_total Total de requisições HTTP
 *               # TYPE lor0138_http_requests_total counter
 *               lor0138_http_requests_total{method="GET",route="/api/...",status_code="200"} 42
 *       500:
 *         description: Erro ao coletar métricas
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsManager.getRegistry().contentType);
    const metrics = await metricsManager.getMetrics();
    res.end(metrics);
  } catch (error) {
    log.error('Erro ao obter métricas:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Erro ao obter métricas',
      message: (error as Error).message,
    });
  }
});

/**
 * @openapi
 * /metrics/health:
 *   get:
 *     summary: Health check do sistema de métricas
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Sistema de métricas operacional
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     ready:
 *                       type: boolean
 *       503:
 *         description: Sistema de métricas não inicializado
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
