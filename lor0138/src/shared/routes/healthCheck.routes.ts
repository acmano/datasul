// src/shared/routes/healthCheck.routes.ts

import { Router } from 'express';
import { HealthCheckController } from '../controllers/healthCheck.controller'; // ✅ CORRIGIDO: path relativo
import { healthCheckTimeout } from '../middlewares/timeout.middleware'; // ✅ CORRIGIDO: path relativo

const router = Router();

/**
 * GET /health
 * Health check completo
 */
router.get(
  '/',
  healthCheckTimeout, // Timeout de 5s para health check
  HealthCheckController.healthCheck
);

/**
 * GET /health/live
 * Liveness probe para Kubernetes/Docker
 */
router.get('/live', HealthCheckController.liveness);

/**
 * GET /health/ready
 * Readiness probe para Kubernetes/Docker
 */
router.get('/ready', HealthCheckController.readiness);

export default router;