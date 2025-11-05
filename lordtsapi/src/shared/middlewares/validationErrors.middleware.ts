// src/shared/middlewares/validationErrors.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { log } from '@shared/utils/logger';

/**
 * Middleware to handle validation errors from express-validator
 *
 * @description
 * Checks for validation errors from express-validator and returns
 * a formatted error response if any errors are found.
 *
 * @example
 * ```typescript
 * router.post('/item',
 *   body('codigo').notEmpty(),
 *   handleValidationErrors,
 *   controller
 * );
 * ```
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    log.warn('Validation errors', {
      correlationId: req.id,
      errors: errors.array(),
      path: req.path,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
        value: err.type === 'field' ? err.value : undefined,
      })),
      correlationId: req.id,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}
