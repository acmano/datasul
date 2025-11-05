// src/shared/logging/controller.ts

/**
 * Controller para endpoints de logging frontend
 * @module shared/logging/controller
 */

import { Request, Response, NextFunction } from 'express';
import { logFromFrontend } from '@shared/utils/logger';
import { FrontendLog, FrontendLogBatch } from './validators';
import { log } from '@shared/utils/logger';

/**
 * Controller para receber log individual do frontend
 *
 * POST /api/logs/frontend
 *
 * @param req - Request com log no body
 * @param res - Response
 * @param next - Next function
 */
export async function logFromFrontendController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logPayload: FrontendLog = req.body;

    // Envia para Winston logger (que encaminha para Elasticsearch)
    logFromFrontend(logPayload);

    // Log de auditoria
    log.debug('Log recebido do frontend', {
      correlationId: req.id,
      level: logPayload.level,
      messagePreview: logPayload.message.substring(0, 50),
    });

    // Retorna sucesso
    res.status(201).json({
      success: true,
      message: 'Log registrado com sucesso',
      correlationId: req.id,
    });
  } catch (error) {
    log.error('Erro ao processar log do frontend', {
      correlationId: req.id,
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}

/**
 * Controller para receber batch de logs do frontend
 *
 * POST /api/logs/frontend/batch
 *
 * @param req - Request com array de logs no body
 * @param res - Response
 * @param next - Next function
 */
export async function logBatchFromFrontendController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const batchPayload: FrontendLogBatch = req.body;
    const logs = batchPayload.logs;

    // Processa cada log
    for (const logPayload of logs) {
      logFromFrontend(logPayload);
    }

    // Log de auditoria
    log.debug('Batch de logs recebido do frontend', {
      correlationId: req.id,
      count: logs.length,
      levels: logs.reduce(
        (acc, l) => {
          acc[l.level] = (acc[l.level] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    });

    // Retorna sucesso
    res.status(201).json({
      success: true,
      message: `${logs.length} logs registrados com sucesso`,
      count: logs.length,
      correlationId: req.id,
    });
  } catch (error) {
    log.error('Erro ao processar batch de logs do frontend', {
      correlationId: req.id,
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}
