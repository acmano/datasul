// src/shared/routes/healthCheck.routes.ts

/**
 * Rotas de Health Check do Sistema
 * @module shared/routes/healthCheck
 */

import { Router } from 'express';
import { HealthCheckController } from '../controllers/healthCheck.controller';
import { healthCheckTimeout } from '../middlewares/timeout.middleware';

const router = Router();

/**
 * GET /health - Health check completo
 */
router.get(
  '/',
  healthCheckTimeout,
  HealthCheckController.healthCheck
);

/**
 * GET /health/live - Liveness probe (Kubernetes)
 */
router.get('/live', HealthCheckController.liveness);

/**
 * GET /health/ready - Readiness probe (Kubernetes)
 */
router.get('/ready', HealthCheckController.readiness);

export default router;