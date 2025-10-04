// src/shared/types/express/index.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * ID único da requisição para rastreamento (Correlation ID)
       * Gerado automaticamente para cada requisição usando UUID v4
       */
      id: string;
      
      /**
       * Flag indicando se a requisição atingiu o timeout
       */
      timedout?: boolean;
    }
  }
}

export {};