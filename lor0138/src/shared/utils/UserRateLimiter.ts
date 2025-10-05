// src/shared/utils/UserRateLimiter.ts

import { UserTier, RATE_LIMIT_CONFIGS } from '@shared/types/apiKey.types';
import { log } from './logger';

interface RateLimitRecord {
  userId: string;
  tier: UserTier;
  minute: { count: number; resetAt: number };
  hour: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Rate Limiter por usuário com múltiplas janelas de tempo
 */
export class UserRateLimiter {
  private static records: Map<string, RateLimitRecord> = new Map();

  /**
   * Verifica se a requisição está dentro do rate limit
   */
  static check(userId: string, tier: UserTier): RateLimitResult {
    const config = RATE_LIMIT_CONFIGS[tier];
    const now = Date.now();

    // Busca ou cria record
    let record = this.records.get(userId);
    if (!record) {
      record = this.createRecord(userId, tier);
      this.records.set(userId, record);
    }

    // Reseta contadores se necessário
    this.resetIfNeeded(record, now);

    // Verifica cada limite (minuto, hora, dia)
    const minuteCheck = this.checkWindow(
      record.minute,
      config.limits.perMinute,
      60 * 1000,
      now
    );

    const hourCheck = this.checkWindow(
      record.hour,
      config.limits.perHour,
      60 * 60 * 1000,
      now
    );

    const dayCheck = this.checkWindow(
      record.day,
      config.limits.perDay,
      24 * 60 * 60 * 1000,
      now
    );

    // Se algum limite foi excedido
    if (!minuteCheck.allowed || !hourCheck.allowed || !dayCheck.allowed) {
      // Retorna o limite mais restritivo
      const mostRestrictive = [minuteCheck, hourCheck, dayCheck]
        .filter(c => !c.allowed)
        .sort((a, b) => a.resetAt - b.resetAt)[0];

      log.warn('Rate limit excedido', {
        userId,
        tier,
        limit: mostRestrictive.limit,
        resetAt: new Date(mostRestrictive.resetAt)
      });

      return mostRestrictive;
    }

    // Incrementa contadores
    record.minute.count++;
    record.hour.count++;
    record.day.count++;

    // Retorna limite mais próximo de ser atingido
    const closest = [minuteCheck, hourCheck, dayCheck]
      .sort((a, b) => a.remaining - b.remaining)[0];

    return closest;
  }

  /**
   * Verifica uma janela de tempo específica
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
      retryAfter
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
      day: { count: 0, resetAt: now + 24 * 60 * 60 * 1000 }
    };
  }

  /**
   * Reseta contadores se janela expirou
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
    const threshold = 24 * 60 * 60 * 1000; // 24 horas

    for (const [userId, record] of this.records.entries()) {
      if (now > record.day.resetAt + threshold) {
        this.records.delete(userId);
      }
    }

    log.debug('Rate limiter cleanup', {
      recordsRemaining: this.records.size
    });
  }

  /**
   * Retorna estatísticas de uso
   */
  static getStats(userId?: string): any {
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
            resetAt: new Date(record.minute.resetAt)
          },
          hour: {
            current: record.hour.count,
            limit: config.limits.perHour,
            remaining: config.limits.perHour - record.hour.count,
            resetAt: new Date(record.hour.resetAt)
          },
          day: {
            current: record.day.count,
            limit: config.limits.perDay,
            remaining: config.limits.perDay - record.day.count,
            resetAt: new Date(record.day.resetAt)
          }
        }
      };
    }

    // Estatísticas gerais
    return {
      totalUsers: this.records.size,
      byTier: {
        free: Array.from(this.records.values()).filter(r => r.tier === UserTier.FREE).length,
        premium: Array.from(this.records.values()).filter(r => r.tier === UserTier.PREMIUM).length,
        enterprise: Array.from(this.records.values()).filter(r => r.tier === UserTier.ENTERPRISE).length,
        admin: Array.from(this.records.values()).filter(r => r.tier === UserTier.ADMIN).length,
      }
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
setInterval(() => {
  UserRateLimiter.cleanup();
}, 60 * 60 * 1000);