// src/shared/ml/anomaly.routes.ts

/**
 * @fileoverview Anomaly Detection Routes
 *
 * @module shared/ml/anomaly.routes
 */

import { Router } from 'express';
import { AnomalyController } from './anomaly.controller';

const router = Router();

/**
 * @openapi
 * /ml/anomalies:
 *   get:
 *     summary: Get recent anomalies across all connections
 *     tags:
 *       - ML Anomaly Detection
 *     parameters:
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         description: Duration in milliseconds (default 24h)
 *     responses:
 *       200:
 *         description: Recent anomalies
 */
router.get('/anomalies', AnomalyController.getRecentAnomalies);

/**
 * @openapi
 * /ml/anomalies/{connectionId}:
 *   get:
 *     summary: Get anomalies for specific connection
 *     tags:
 *       - ML Anomaly Detection
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection identifier (DSN)
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         description: Duration in milliseconds (default 24h)
 *     responses:
 *       200:
 *         description: Connection anomalies
 *       404:
 *         description: Connection not found
 */
router.get('/anomalies/:connectionId', AnomalyController.getConnectionAnomalies);

/**
 * @openapi
 * /ml/health-scores:
 *   get:
 *     summary: Get health scores for all connections
 *     tags:
 *       - ML Anomaly Detection
 *     responses:
 *       200:
 *         description: Health scores
 */
router.get('/health-scores', AnomalyController.getHealthScores);

/**
 * @openapi
 * /ml/baseline/{connectionId}:
 *   get:
 *     summary: Get baseline (expected values) for connection
 *     tags:
 *       - ML Anomaly Detection
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Baseline data
 *       404:
 *         description: Connection not found
 */
router.get('/baseline/:connectionId', AnomalyController.getBaseline);

/**
 * @openapi
 * /ml/baseline/{connectionId}/learn:
 *   post:
 *     summary: Force baseline learning for connection
 *     tags:
 *       - ML Anomaly Detection
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: integer
 *                 description: Learning duration in milliseconds
 *     responses:
 *       200:
 *         description: Learning initiated
 *       404:
 *         description: Connection not found
 */
router.post('/baseline/:connectionId/learn', AnomalyController.learnBaseline);

/**
 * @openapi
 * /ml/baseline/{connectionId}/clear:
 *   post:
 *     summary: Clear baseline data (force re-learning)
 *     tags:
 *       - ML Anomaly Detection
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Baseline cleared
 *       404:
 *         description: Connection not found
 */
router.post('/baseline/:connectionId/clear', AnomalyController.clearBaseline);

/**
 * @openapi
 * /ml/status:
 *   get:
 *     summary: Get anomaly detection system status
 *     tags:
 *       - ML Anomaly Detection
 *     responses:
 *       200:
 *         description: System status
 */
router.get('/status', AnomalyController.getStatus);

export default router;
