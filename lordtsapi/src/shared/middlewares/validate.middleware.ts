// src/shared/middlewares/validate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/errors/CustomErrors';
import { ObjectSchema } from 'joi';

type ValidationSource = 'body' | 'params' | 'query';

/**
 * Middleware de validação de dados de requisição
 */
export const validate = (schema: ObjectSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce(
        (acc, detail) => {
          acc[detail.path.join('.')] = detail.message;
          return acc;
        },
        {} as Record<string, string>
      );

      const firstError = error.details[0];
      throw new ValidationError(firstError?.message || 'Erro de validação', details);
    }

    // Substitui dados originais pelos sanitizados
    req[source] = value;
    next();
  };
};
