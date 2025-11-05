// src/shared/chaos/routes.ts

/**
 * Chaos Engineering HTTP Routes
 *
 * @description
 * REST API routes for managing chaos experiments.
 *
 * @module ChaosRoutes
 * @since 2.0.0
 */

import { Router } from 'express';
import * as chaosController from './chaos.controller';

const router = Router();

/**
 * @openapi
 * /chaos/experiments:
 *   post:
 *     summary: Create new chaos experiment
 *     tags:
 *       - Chaos Engineering
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 example: "test-latency"
 *               config:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   type:
 *                     type: string
 *                     enum: [latency, timeout, error, intermittent, pool_exhaustion, slow_query]
 *                   probability:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                   minLatencyMs:
 *                     type: number
 *                   maxLatencyMs:
 *                     type: number
 *                   targetConnections:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Experiment created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/experiments', chaosController.createExperiment);

/**
 * @openapi
 * /chaos/experiments:
 *   get:
 *     summary: List all active chaos experiments
 *     tags:
 *       - Chaos Engineering
 *     responses:
 *       200:
 *         description: List of active experiments
 */
router.get('/experiments', chaosController.listExperiments);

/**
 * @openapi
 * /chaos/experiments/{name}:
 *   delete:
 *     summary: Stop specific chaos experiment
 *     tags:
 *       - Chaos Engineering
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experiment stopped
 */
router.delete('/experiments/:name', chaosController.stopExperiment);

/**
 * @openapi
 * /chaos/stats:
 *   get:
 *     summary: Get chaos statistics for all experiments
 *     tags:
 *       - Chaos Engineering
 *     responses:
 *       200:
 *         description: Chaos statistics
 */
router.get('/stats', chaosController.getStats);

/**
 * @openapi
 * /chaos/stats/{name}:
 *   get:
 *     summary: Get chaos statistics for specific experiment
 *     tags:
 *       - Chaos Engineering
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experiment statistics
 *       404:
 *         description: Experiment not found
 */
router.get('/stats/:name', chaosController.getStats);

/**
 * @openapi
 * /chaos/stats/reset:
 *   post:
 *     summary: Reset all chaos statistics
 *     tags:
 *       - Chaos Engineering
 *     responses:
 *       200:
 *         description: Statistics reset
 */
router.post('/stats/reset', chaosController.resetStats);

/**
 * @openapi
 * /chaos/stats/reset/{name}:
 *   post:
 *     summary: Reset statistics for specific experiment
 *     tags:
 *       - Chaos Engineering
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics reset
 */
router.post('/stats/reset/:name', chaosController.resetStats);

/**
 * @openapi
 * /chaos/templates:
 *   get:
 *     summary: List predefined experiment templates
 *     tags:
 *       - Chaos Engineering
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/templates', chaosController.listTemplates);

/**
 * @openapi
 * /chaos/templates/{name}/start:
 *   post:
 *     summary: Start predefined experiment template
 *     tags:
 *       - Chaos Engineering
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template started
 *       404:
 *         description: Template not found
 */
router.post('/templates/:name/start', chaosController.startTemplate);

/**
 * @openapi
 * /chaos/stop-all:
 *   post:
 *     summary: Stop all active chaos experiments
 *     tags:
 *       - Chaos Engineering
 *     responses:
 *       200:
 *         description: All experiments stopped
 */
router.post('/stop-all', chaosController.stopAll);

export default router;
