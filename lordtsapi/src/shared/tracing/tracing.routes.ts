// src/shared/tracing/tracing.routes.ts

/**
 * @fileoverview Distributed Tracing Routes
 *
 * HTTP routes for distributed tracing management.
 *
 * @module shared/tracing/routes
 */

import { Router } from 'express';
import { TracingController } from './tracing.controller';

const router = Router();

// Status and configuration
router.get('/status', TracingController.getStatus);
router.get('/config', TracingController.getConfig);
router.get('/metrics', TracingController.getMetrics);

// Current span information
router.get('/current', TracingController.getCurrentSpan);

// Testing
router.post('/test', TracingController.testTrace);

export default router;
