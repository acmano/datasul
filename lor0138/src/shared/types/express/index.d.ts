// src/shared/types/express/index.d.ts

/**
 * Extensões de tipos do Express
 * @module shared/types/express
 */

import { Request } from 'express';
import { ApiKeyConfig, UserTier } from '../apiKey.types';

/**
 * Declaração global para estender namespaces do Express
 */
declare global {
  namespace Express {
    /**
     * Interface Request estendida com propriedades customizadas
     */
    interface Request {
      /**
       * Correlation ID único para rastreamento da requisição
       * @see correlationId.middleware.ts
       */
      id: string;

      /**
       * Timestamp de quando a requisição foi recebida
       * @see correlationId.middleware.ts
       */
      startTime?: number;

      /**
       * Flag indicando se a requisição atingiu timeout
       * @see timeout.middleware.ts
       */
      timedout?: boolean;

      /**
       * Configuração completa da API Key utilizada
       * @see apiKeyAuth.middleware.ts
       */
      apiKey?: ApiKeyConfig;

      /**
       * Dados simplificados do usuário autenticado
       * @see apiKeyAuth.middleware.ts
       */
      user?: {
        id: string;
        name: string;
        tier: UserTier;
      };
    }
  }
}

/**
 * Export vazio necessário para módulo TypeScript
 */
export { };