// @ts-nocheck
// src/shared/chaos/chaos.controller.ts

/**
 * Chaos Engineering HTTP API Controller
 *
 * @description
 * REST API for managing chaos experiments.
 * Allows creating, listing, stopping experiments and viewing statistics.
 *
 * @module ChaosController
 * @since 2.0.0
 */

import { Request, Response } from 'express';
import { chaosInjector, ChaosConfig } from '@infrastructure/chaos/ChaosInjector';
import {
  chaosExperiments,
  getExperiment,
  getExperimentNames,
} from '@infrastructure/chaos/experiments';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';

/**
 * Create new chaos experiment
 *
 * POST /chaos/experiments
 *
 * @example Request
 * ```json
 * {
 *   "name": "test-latency",
 *   "config": {
 *     "enabled": true,
 *     "type": "latency",
 *     "probability": 0.3,
 *     "minLatencyMs": 1000,
 *     "maxLatencyMs": 3000,
 *     "targetConnections": ["DtsPrdEmp"]
 *   }
 * }
 * ```
 */
export const createExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { name, config } = req.body as { name: string; config: ChaosConfig };

  if (!name || !config) {
    return res.status(400).json({
      success: false,
      error: 'Name and config are required',
      correlationId: req.id,
    });
  }

  try {
    chaosInjector.registerExperiment(name, config);

    log.warn('Chaos experiment created via API', {
      correlationId: req.id,
      name,
      type: config.type,
      probability: config.probability,
    });

    res.json({
      success: true,
      message: `Chaos experiment '${name}' registered`,
      experiment: {
        name,
        config,
      },
      correlationId: req.id,
    });
  } catch (error) {
    log.error('Failed to create chaos experiment', {
      correlationId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create experiment',
      correlationId: req.id,
    });
  }
});

/**
 * List all active experiments
 *
 * GET /chaos/experiments
 */
export const listExperiments = asyncHandler(async (req: Request, res: Response) => {
  const experiments = chaosInjector.getActiveExperimentsList();

  res.json({
    success: true,
    data: {
      experiments,
      count: experiments.length,
      isEnabled: chaosInjector.isEnabled(),
    },
    correlationId: req.id,
  });
});

/**
 * Stop specific experiment
 *
 * DELETE /chaos/experiments/:name
 */
export const stopExperiment = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  chaosInjector.unregisterExperiment(name!);

  log.info('Chaos experiment stopped via API', {
    correlationId: req.id,
    name,
  });

  res.json({
    success: true,
    message: `Chaos experiment '${name}' stopped`,
    correlationId: req.id,
  });
});

/**
 * Get chaos statistics
 *
 * GET /chaos/stats
 * GET /chaos/stats/:name
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  if (name) {
    const stats = chaosInjector.getStats(name);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `Experiment '${name}' not found`,
        correlationId: req.id,
      });
    }

    res.json({
      success: true,
      data: {
        experiment: name,
        stats,
      },
      correlationId: req.id,
    });
  } else {
    const allStats = chaosInjector.getStats();

    res.json({
      success: true,
      data: Object.fromEntries(allStats as Map<string, any>),
      correlationId: req.id,
    });
  }
});

/**
 * Reset statistics
 *
 * POST /chaos/stats/reset
 * POST /chaos/stats/reset/:name
 */
export const resetStats = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  chaosInjector.resetStats(name);

  log.info('Chaos statistics reset', {
    correlationId: req.id,
    experiment: name || 'all',
  });

  res.json({
    success: true,
    message: name ? `Statistics for '${name}' reset` : 'All statistics reset',
    correlationId: req.id,
  });
});

/**
 * List predefined experiments
 *
 * GET /chaos/templates
 */
export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const templates = getExperimentNames().map((name) => ({
    name,
    config: getExperiment(name),
  }));

  res.json({
    success: true,
    data: {
      templates,
      count: templates.length,
    },
    correlationId: req.id,
  });
});

/**
 * Start predefined experiment
 *
 * POST /chaos/templates/:name/start
 */
export const startTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  const config = getExperiment(name!);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: `Template '${name}' not found`,
      correlationId: req.id,
    });
  }

  try {
    // Enable and register
    const enabledConfig = { ...config, enabled: true };
    chaosInjector.registerExperiment(name!, enabledConfig);

    log.warn('Predefined chaos experiment started', {
      correlationId: req.id,
      template: name,
    });

    res.json({
      success: true,
      message: `Template '${name}' started`,
      experiment: {
        name,
        config: enabledConfig,
      },
      correlationId: req.id,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start template',
      correlationId: req.id,
    });
  }
});

/**
 * Stop all experiments
 *
 * POST /chaos/stop-all
 */
export const stopAll = asyncHandler(async (req: Request, res: Response) => {
  const experiments = chaosInjector.getActiveExperimentsList();

  experiments.forEach((name) => {
    chaosInjector.unregisterExperiment(name);
  });

  log.warn('All chaos experiments stopped', {
    correlationId: req.id,
    count: experiments.length,
  });

  res.json({
    success: true,
    message: `Stopped ${experiments.length} experiment(s)`,
    experiments,
    correlationId: req.id,
  });
});
