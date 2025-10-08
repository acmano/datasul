// @ts-nocheck
// src/shared/types/express.d.ts

import { Request } from 'express';
declare global {
  namespace Express {
    interface Request {
      /**
       * Correlation ID único para rastreamento da requisição
       * - Gerado automaticamente se não fornecido pelo cliente
       * - Propagado em todos os logs
       * - Retornado no header X-Correlation-ID
       */
      id: string;

      /**
       * Timestamp de quando a requisição foi recebida
       */
      startTime?: number;
      timedout?: boolean; // Timeout flag
    }
  }
}
export {};