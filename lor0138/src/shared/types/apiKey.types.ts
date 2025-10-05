// src/shared/types/apiKey.types.ts

export enum UserTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

export interface ApiKeyConfig {
  key: string;
  userId: string;
  userName: string;
  tier: UserTier;
  active: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface RateLimitConfig {
  tier: UserTier;
  limits: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  burstAllowance?: number; // Permite burst acima do limite
}

export const RATE_LIMIT_CONFIGS: Record<UserTier, RateLimitConfig> = {
  [UserTier.FREE]: {
    tier: UserTier.FREE,
    limits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000
    },
    burstAllowance: 5
  },
  [UserTier.PREMIUM]: {
    tier: UserTier.PREMIUM,
    limits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    },
    burstAllowance: 20
  },
  [UserTier.ENTERPRISE]: {
    tier: UserTier.ENTERPRISE,
    limits: {
      perMinute: 300,
      perHour: 10000,
      perDay: 100000
    },
    burstAllowance: 100
  },
  [UserTier.ADMIN]: {
    tier: UserTier.ADMIN,
    limits: {
      perMinute: 1000,
      perHour: 50000,
      perDay: 1000000
    },
    burstAllowance: 500
  }
};

// Extender Request do Express
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyConfig;
      user?: {
        id: string;
        name: string;
        tier: UserTier;
      };
    }
  }
}