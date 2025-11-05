// src/shared/utils/UserRateLimiter.ts

import { UserTier, RATE_LIMIT_CONFIGS } from '@shared/types/apiKey.types';
import { log } from './logger';

/**
 * Rate Limiter por Usuário com Multi-Window
 * @module UserRateLimiter
 */

interface RateLimitRecord {
  userId: string;
  tier: UserTier;
  minute: {
    count: number;
    resetAt: number;
  };
  hour: {
    count: number;
    resetAt: number;
  };
  day: {
    count: number;
    resetAt: number;
  };
}

export interface RateLimitResult {
  /** Se requisição é permitida */
  allowed: boolean;
  /** Limite total para esta janela */
  limit: number;
  /** Requisições restantes */
  remaining: number;
  /** Timestamp quando reseta (ms) */
  resetAt: number;
  /** Segundos até próxima tentativa */
  retryAfter?: number | undefined;
}

export interface UserRateLimitStats {
  userId: string;
  tier: UserTier;
  usage: {
    minute: {
      current: number;
      limit: number;
      remaining: number;
      resetAt: Date;
    };
    hour: {
      current: number;
      limit: number;
      remaining: number;
      resetAt: Date;
    };
    day: {
      current: number;
      limit: number;
      remaining: number;
      resetAt: Date;
    };
  };
}

export interface UserRateLimitAggregatedStats {
  totalUsers: number;
  byTier: {
    free: number;
    premium: number;
    enterprise: number;
    admin: number;
  };
}

export class UserRateLimiter {
  private static records: Map<string, RateLimitRecord> = new Map();

  /**
   * Verifica se requisição está dentro do rate limit
   */
  static check(userId: string, tier: UserTier): RateLimitResult {
    const config = RATE_LIMIT_CONFIGS[tier];
    const now = Date.now();

    let record = this.records.get(userId);
    if (!record) {
      record = this.createRecord(userId, tier);
      this.records.set(userId, record);
    }

    this.resetIfNeeded(record, now);

    const minuteCheck = this.checkWindow(record.minute, config.limits.perMinute, 60 * 1000, now);

    const hourCheck = this.checkWindow(record.hour, config.limits.perHour, 60 * 60 * 1000, now);

    const dayCheck = this.checkWindow(record.day, config.limits.perDay, 24 * 60 * 60 * 1000, now);

    if (!minuteCheck.allowed || !hourCheck.allowed || !dayCheck.allowed) {
      const mostRestrictive = [minuteCheck, hourCheck, dayCheck]
        .filter((c) => !c.allowed)
        .sort((a, b) => a.resetAt - b.resetAt)[0];

      if (!mostRestrictive) {
        throw new Error('Erro ao calcular rate limit mais restritivo');
      }

      log.warn('Rate limit excedido', {
        userId,
        tier,
        limit: mostRestrictive.limit,
        resetAt: new Date(mostRestrictive.resetAt),
      });

      return mostRestrictive;
    }

    record.minute.count++;
    record.hour.count++;
    record.day.count++;

    const closest = [minuteCheck, hourCheck, dayCheck].sort((a, b) => a.remaining - b.remaining)[0];

    if (!closest) {
      throw new Error('Erro ao calcular janela de rate limit mais próxima');
    }

    return closest;
  }

  /**
   * Verifica uma janela específica
   */
  private static checkWindow(
    window: { count: number; resetAt: number },
    limit: number,
    duration: number,
    now: number
  ): RateLimitResult {
    const allowed = window.count < limit;
    const remaining = Math.max(0, limit - window.count);
    const retryAfter = allowed ? undefined : Math.ceil((window.resetAt - now) / 1000);

    return {
      allowed,
      limit,
      remaining,
      resetAt: window.resetAt,
      retryAfter,
    };
  }

  /**
   * Cria novo record para usuário
   */
  private static createRecord(userId: string, tier: UserTier): RateLimitRecord {
    const now = Date.now();

    return {
      userId,
      tier,
      minute: { count: 0, resetAt: now + 60 * 1000 },
      hour: { count: 0, resetAt: now + 60 * 60 * 1000 },
      day: { count: 0, resetAt: now + 24 * 60 * 60 * 1000 },
    };
  }

  /**
   * Reseta janelas expiradas
   */
  private static resetIfNeeded(record: RateLimitRecord, now: number): void {
    if (now >= record.minute.resetAt) {
      record.minute.count = 0;
      record.minute.resetAt = now + 60 * 1000;
    }

    if (now >= record.hour.resetAt) {
      record.hour.count = 0;
      record.hour.resetAt = now + 60 * 60 * 1000;
    }

    if (now >= record.day.resetAt) {
      record.day.count = 0;
      record.day.resetAt = now + 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Limpa records antigos (garbage collection)
   */
  static cleanup(): void {
    const now = Date.now();
    const threshold = 24 * 60 * 60 * 1000;

    for (const [userId, record] of this.records.entries()) {
      if (now > record.day.resetAt + threshold) {
        this.records.delete(userId);
      }
    }

    log.debug('Rate limiter cleanup', {
      recordsRemaining: this.records.size,
    });
  }

  /**
   * Retorna estatísticas de uso
   */
  static getStats(userId?: string): UserRateLimitStats | UserRateLimitAggregatedStats | null {
    if (userId) {
      const record = this.records.get(userId);
      if (!record) return null;

      const config = RATE_LIMIT_CONFIGS[record.tier];

      return {
        userId: record.userId,
        tier: record.tier,
        usage: {
          minute: {
            current: record.minute.count,
            limit: config.limits.perMinute,
            remaining: config.limits.perMinute - record.minute.count,
            resetAt: new Date(record.minute.resetAt),
          },
          hour: {
            current: record.hour.count,
            limit: config.limits.perHour,
            remaining: config.limits.perHour - record.hour.count,
            resetAt: new Date(record.hour.resetAt),
          },
          day: {
            current: record.day.count,
            limit: config.limits.perDay,
            remaining: config.limits.perDay - record.day.count,
            resetAt: new Date(record.day.resetAt),
          },
        },
      };
    }

    return {
      totalUsers: this.records.size,
      byTier: {
        free: Array.from(this.records.values()).filter((r) => r.tier === UserTier.FREE).length,
        premium: Array.from(this.records.values()).filter((r) => r.tier === UserTier.PREMIUM)
          .length,
        enterprise: Array.from(this.records.values()).filter((r) => r.tier === UserTier.ENTERPRISE)
          .length,
        admin: Array.from(this.records.values()).filter((r) => r.tier === UserTier.ADMIN).length,
      },
    };
  }

  /**
   * Reseta limites de um usuário (admin)
   */
  static resetUser(userId: string): void {
    this.records.delete(userId);
    log.info('Rate limit resetado', { userId });
  }
}

// Cleanup automático a cada hora
setInterval(
  () => {
    UserRateLimiter.cleanup();
  },
  60 * 60 * 1000
);
