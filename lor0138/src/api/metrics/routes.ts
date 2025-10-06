// src/api/metrics/routes.ts

import { Router, Request, Response } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

const router = Router();

/**
 * GET /metrics
 * Retorna todas as métricas no formato Prometheus
 * 
 * Este endpoint é usado pelo Prometheus para scraping
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsManager.getRegistry().contentType);
    const metrics = await metricsManager.getMetrics();
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
 * Health check específico para métricas
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