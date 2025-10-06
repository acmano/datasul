// src/shared/types/express/index.d.ts

/**
 * ========================================
 * EXTENSÕES DE TIPOS DO EXPRESS
 * ========================================
 *
 * Este arquivo estende a interface Request do Express para adicionar
 * propriedades customizadas utilizadas pela aplicação.
 *
 * PROPRIEDADES ADICIONADAS:
 * - id: Correlation ID único para rastreamento de requisições
 * - startTime: Timestamp de início da requisição para métricas de performance
 * - timedout: Flag indicando se a requisição atingiu timeout
 * - apiKey: Informações da API Key utilizada (quando autenticado)
 * - user: Dados do usuário autenticado
 *
 * IMPORTANTE:
 * - Este arquivo é carregado automaticamente pelo TypeScript via tsconfig.json
 * - As extensões estão disponíveis em toda a aplicação
 * - Não é necessário importar explicitamente
 *
 * @see tsconfig.json - typeRoots configuration
 * @see correlationId.middleware.ts - Define req.id
 * @see timeout.middleware.ts - Define req.timedout
 * @see apiKeyAuth.middleware.ts - Define req.apiKey e req.user
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
       *
       * CARACTERÍSTICAS:
       * - Gerado automaticamente se não fornecido pelo cliente
       * - Aceito via headers: X-Correlation-ID, X-Request-ID, correlation-id
       * - Propagado em todos os logs da aplicação
       * - Retornado no header de resposta X-Correlation-ID
       * - Formato: UUID v4 ou string customizada do cliente
       *
       * USO:
       * ```typescript
       * log.info('Processing request', { correlationId: req.id });
       * ```
       *
       * @see correlationId.middleware.ts
       */
      id: string;

      /**
       * Timestamp de quando a requisição foi recebida
       *
       * CARACTERÍSTICAS:
       * - Formato: Date.now() - milissegundos desde epoch
       * - Usado para calcular duração total da requisição
       * - Definido pelo correlation ID middleware
       * - Utilizado em métricas de performance
       *
       * USO:
       * ```typescript
       * const duration = Date.now() - req.startTime!;
       * log.info('Request completed', { duration });
       * ```
       *
       * @see correlationId.middleware.ts
       * @see metrics.middleware.ts
       */
      startTime?: number;

      /**
       * Flag indicando se a requisição atingiu timeout
       *
       * CARACTERÍSTICAS:
       * - Definida pelo timeout middleware
       * - true = requisição foi abortada por timeout
       * - false/undefined = requisição dentro do tempo limite
       * - Usado para logging e métricas de timeout
       *
       * USO:
       * ```typescript
       * if (req.timedout) {
       *   log.warn('Request timed out', { correlationId: req.id });
       *   return; // Não processar requisição abortada
       * }
       * ```
       *
       * @see timeout.middleware.ts
       */
      timedout?: boolean;

      /**
       * Configuração completa da API Key utilizada
       *
       * CARACTERÍSTICAS:
       * - Definida pelo apiKeyAuth middleware
       * - Contém: key, userId, userName, tier, active, createdAt, expiresAt
       * - undefined = requisição não autenticada
       * - Usado para auditoria e logging detalhado
       *
       * USO:
       * ```typescript
       * if (req.apiKey) {
       *   log.info('Authenticated request', {
       *     userId: req.apiKey.userId,
       *     tier: req.apiKey.tier
       *   });
       * }
       * ```
       *
       * @see apiKeyAuth.middleware.ts
       * @see ApiKeyService.ts
       */
      apiKey?: ApiKeyConfig;

      /**
       * Dados simplificados do usuário autenticado
       *
       * CARACTERÍSTICAS:
       * - Definida pelo apiKeyAuth middleware
       * - Contém: id, name, tier
       * - undefined = requisição não autenticada
       * - Usado para rate limiting e controle de acesso
       *
       * USO:
       * ```typescript
       * if (req.user?.tier === UserTier.ADMIN) {
       *   // Acesso administrativo
       * }
       * ```
       *
       * IMPORTANTE:
       * - Sempre verificar se req.user existe antes de acessar
       * - Para rotas públicas, req.user pode ser undefined
       * - Para rotas protegidas, req.user sempre estará presente
       *
       * @see apiKeyAuth.middleware.ts
       * @see userRateLimit.middleware.ts
       */
      user?: {
        /**
         * ID único do usuário
         */
        id: string;

        /**
         * Nome do usuário
         */
        name: string;

        /**
         * Tier do usuário (FREE, PREMIUM, ENTERPRISE, ADMIN)
         * Define limites de rate limiting
         */
        tier: UserTier;
      };
    }
  }
}

/**
 * Export vazio necessário para módulo TypeScript
 * Garante que o arquivo seja tratado como módulo
 */
export { };