// @ts-nocheck
// src/shared/controllers/healthCheck.controller.ts

import { Request, Response } from 'express';
import { HealthCheckService } from '../services/healthCheck.service'; // ✅ CORRIGIDO: path relativo

/**
 * Controller para endpoints de health check
 */
export class HealthCheckController {
  /**
   * GET /health
   * Health check completo do sistema
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await HealthCheckService.check();

      const statusCode = health.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      console.error('Erro no health check:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /health/live
   * Liveness probe - verifica se o processo está vivo
   */
  static async liveness(req: Request, res: Response): Promise<void> {
    // Se chegou aqui, o processo está vivo
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  /**
   * GET /health/ready
   * Readiness probe - verifica se está pronto para receber tráfego
   */
  static async readiness(req: Request, res: Response): Promise<void> {
    try {
      const health = await HealthCheckService.check();

      // Pronto se status for healthy ou degraded
      // Não pronto apenas se for unhealthy
      const isReady = health.status !== 'unhealthy';

      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}