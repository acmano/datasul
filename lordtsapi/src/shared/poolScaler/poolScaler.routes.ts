// src/shared/poolScaler/poolScaler.routes.ts

/**
 * @fileoverview Pool Auto-scaling Routes
 *
 * HTTP routes for pool auto-scaling management.
 *
 * @module shared/poolScaler/routes
 */

import { Router } from 'express';
import { PoolScalerController } from './poolScaler.controller';

const router = Router();

// Overall status
router.get('/status', PoolScalerController.getStatus);

// Connection-specific operations
router.get('/status/:connectionId', PoolScalerController.getConnectionStatus);
router.get('/history/:connectionId', PoolScalerController.getHistory);
router.get('/metrics/:connectionId', PoolScalerController.getMetrics);

// Control operations
router.post('/start/:connectionId', PoolScalerController.startScaling);
router.post('/stop/:connectionId', PoolScalerController.stopScaling);

export default router;
