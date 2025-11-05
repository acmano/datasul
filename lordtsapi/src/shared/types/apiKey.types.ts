// src/shared/types/apiKey.types.ts

/**
 * Tipos e Configurações de API Keys e Rate Limiting
 *
 * @module shared/types/apiKey.types
 * @version 1.0.0
 * @see APIKEY_TYPES.md para documentação completa
 *
 * Exports:
 * - UserTier: enum com tiers (FREE, PREMIUM, ENTERPRISE, ADMIN)
 * - ApiKeyConfig: configuração completa de uma API Key
 * - RateLimitConfig: configuração de limites por tier
 * - RATE_LIMIT_CONFIGS: mapeamento de limites por tier
 * - Express.Request extensions: req.apiKey e req.user
 *
 * @example
 * import { UserTier, RATE_LIMIT_CONFIGS } from '@shared/types/apiKey.types';
 *
 * const limits = RATE_LIMIT_CONFIGS[UserTier.PREMIUM];
 * console.log(limits.limits.perMinute); // 60
 */

/**
 * Tiers de usuário que definem limites de rate limiting
 *
 * @enum {string}
 */
export enum UserTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
}

/**
 * Configuração completa de uma API Key
 *
 * @interface ApiKeyConfig
 */
export interface ApiKeyConfig {
  /** API Key completa: [tier]-[32-char-hex] */
  key: string;

  /** ID único do usuário dono da key */
  userId: string;

  /** Nome do usuário para exibição */
  userName: string;

  /** Tier/plano que define rate limits */
  tier: UserTier;

  /** Se key está ativa e pode ser usada */
  active: boolean;

  /** Timestamp de criação da key */
  createdAt: Date;

  /** Data/hora de expiração (opcional, undefined = permanente) */
  expiresAt?: Date | undefined;

  /** Metadados customizados (IPs permitidos, scopes, analytics, etc) */
  metadata?: Record<string, any> | undefined;
}

/**
 * Estatísticas de API Keys
 */
export interface ApiKeyStats {
  /** Total de API keys */
  total: number;
  /** API keys ativas */
  active: number;
  /** API keys inativas */
  inactive: number;
  /** Contagem por tier */
  byTier: {
    free: number;
    premium: number;
    enterprise: number;
    admin: number;
  };
}

/**
 * Configuração de rate limiting para um tier específico
 *
 * @interface RateLimitConfig
 */
export interface RateLimitConfig {
  /** Tier ao qual esta configuração se aplica */
  tier: UserTier;

  /** Limites de rate por janela de tempo */
  limits: {
    /** Máximo de requests por minuto (60s deslizante) */
    perMinute: number;

    /** Máximo de requests por hora (3600s deslizante) */
    perHour: number;

    /** Máximo de requests por dia (86400s deslizante) */
    perDay: number;
  };

  /** Requests extras permitidas em burst (token bucket algorithm) */
  burstAllowance?: number;
}

/**
 * Configurações de rate limit por tier
 *
 * Limites:
 * - Free: 10/min, 100/hora, 1K/dia (burst: 5)
 * - Premium: 60/min, 1K/hora, 10K/dia (burst: 20)
 * - Enterprise: 300/min, 10K/hora, 100K/dia (burst: 100)
 * - Admin: 1000/min, 50K/hora, 1M/dia (burst: 500)
 *
 * @constant
 */
export const RATE_LIMIT_CONFIGS: Record<UserTier, RateLimitConfig> = {
  [UserTier.FREE]: {
    tier: UserTier.FREE,
    limits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000,
    },
    burstAllowance: 5,
  },
  [UserTier.PREMIUM]: {
    tier: UserTier.PREMIUM,
    limits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000,
    },
    burstAllowance: 20,
  },
  [UserTier.ENTERPRISE]: {
    tier: UserTier.ENTERPRISE,
    limits: {
      perMinute: 300,
      perHour: 10000,
      perDay: 100000,
    },
    burstAllowance: 100,
  },
  [UserTier.ADMIN]: {
    tier: UserTier.ADMIN,
    limits: {
      perMinute: 1000,
      perHour: 50000,
      perDay: 1000000,
    },
    burstAllowance: 500,
  },
};

/**
 * Extensões do Express Request para autenticação via API Key
 *
 * Adiciona campos req.apiKey e req.user ao Request do Express.
 * Populados automaticamente pelo middleware apiKeyAuth.
 *
 * @namespace Express
 * @global
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Configuração completa da API Key usada na requisição
       * Populado por: apiKeyAuth ou optionalApiKeyAuth middleware
       */
      apiKey?: ApiKeyConfig;

      /**
       * Dados simplificados do usuário autenticado
       * Populado por: apiKeyAuth, optionalApiKeyAuth ou jwt middleware
       */
      user?: {
        /** User ID único */
        id: string;

        /** Nome para exibição */
        name?: string;

        /** Email do usuário (JWT auth) */
        email?: string;

        /** Tier para rate limiting */
        tier?: UserTier;

        /** Roles para autorização (JWT auth) */
        roles?: string[];

        /** Permissões especiais do usuário (export:unlimited, etc) */
        permissions?: string[];
      };
    }
  }
}
