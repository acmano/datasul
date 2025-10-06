// @ts-nocheck
// src/shared/utils/UserRateLimiter.ts
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { UserTier, RATE_LIMIT_CONFIGS } from '@shared/types/apiKey.types';
import { log } from './logger';
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
    if (stryMutAct_9fa48("3222")) {
      {}
    } else {
      stryCov_9fa48("3222");
      const config = RATE_LIMIT_CONFIGS[tier];
      const now = Date.now();

      // Busca ou cria record
      let record = this.records.get(userId);
      if (stryMutAct_9fa48("3225") ? false : stryMutAct_9fa48("3224") ? true : stryMutAct_9fa48("3223") ? record : (stryCov_9fa48("3223", "3224", "3225"), !record)) {
        if (stryMutAct_9fa48("3226")) {
          {}
        } else {
          stryCov_9fa48("3226");
          record = this.createRecord(userId, tier);
          this.records.set(userId, record);
        }
      }

      // Reseta contadores se necessário
      this.resetIfNeeded(record, now);

      // Verifica cada limite (minuto, hora, dia)
      const minuteCheck = this.checkWindow(record.minute, config.limits.perMinute, stryMutAct_9fa48("3227") ? 60 / 1000 : (stryCov_9fa48("3227"), 60 * 1000), now);
      const hourCheck = this.checkWindow(record.hour, config.limits.perHour, stryMutAct_9fa48("3228") ? 60 * 60 / 1000 : (stryCov_9fa48("3228"), (stryMutAct_9fa48("3229") ? 60 / 60 : (stryCov_9fa48("3229"), 60 * 60)) * 1000), now);
      const dayCheck = this.checkWindow(record.day, config.limits.perDay, stryMutAct_9fa48("3230") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("3230"), (stryMutAct_9fa48("3231") ? 24 * 60 / 60 : (stryCov_9fa48("3231"), (stryMutAct_9fa48("3232") ? 24 / 60 : (stryCov_9fa48("3232"), 24 * 60)) * 60)) * 1000), now);

      // Se algum limite foi excedido
      if (stryMutAct_9fa48("3235") ? (!minuteCheck.allowed || !hourCheck.allowed) && !dayCheck.allowed : stryMutAct_9fa48("3234") ? false : stryMutAct_9fa48("3233") ? true : (stryCov_9fa48("3233", "3234", "3235"), (stryMutAct_9fa48("3237") ? !minuteCheck.allowed && !hourCheck.allowed : stryMutAct_9fa48("3236") ? false : (stryCov_9fa48("3236", "3237"), (stryMutAct_9fa48("3238") ? minuteCheck.allowed : (stryCov_9fa48("3238"), !minuteCheck.allowed)) || (stryMutAct_9fa48("3239") ? hourCheck.allowed : (stryCov_9fa48("3239"), !hourCheck.allowed)))) || (stryMutAct_9fa48("3240") ? dayCheck.allowed : (stryCov_9fa48("3240"), !dayCheck.allowed)))) {
        if (stryMutAct_9fa48("3241")) {
          {}
        } else {
          stryCov_9fa48("3241");
          // Retorna o limite mais restritivo
          const mostRestrictive = stryMutAct_9fa48("3243") ? [minuteCheck, hourCheck, dayCheck].sort((a, b) => a.resetAt - b.resetAt)[0] : stryMutAct_9fa48("3242") ? [minuteCheck, hourCheck, dayCheck].filter(c => !c.allowed)[0] : (stryCov_9fa48("3242", "3243"), (stryMutAct_9fa48("3244") ? [] : (stryCov_9fa48("3244"), [minuteCheck, hourCheck, dayCheck])).filter(stryMutAct_9fa48("3245") ? () => undefined : (stryCov_9fa48("3245"), c => stryMutAct_9fa48("3246") ? c.allowed : (stryCov_9fa48("3246"), !c.allowed))).sort(stryMutAct_9fa48("3247") ? () => undefined : (stryCov_9fa48("3247"), (a, b) => stryMutAct_9fa48("3248") ? a.resetAt + b.resetAt : (stryCov_9fa48("3248"), a.resetAt - b.resetAt)))[0]);
          log.warn(stryMutAct_9fa48("3249") ? "" : (stryCov_9fa48("3249"), 'Rate limit excedido'), stryMutAct_9fa48("3250") ? {} : (stryCov_9fa48("3250"), {
            userId,
            tier,
            limit: mostRestrictive.limit,
            resetAt: new Date(mostRestrictive.resetAt)
          }));
          return mostRestrictive;
        }
      }

      // Incrementa contadores
      stryMutAct_9fa48("3251") ? record.minute.count-- : (stryCov_9fa48("3251"), record.minute.count++);
      stryMutAct_9fa48("3252") ? record.hour.count-- : (stryCov_9fa48("3252"), record.hour.count++);
      stryMutAct_9fa48("3253") ? record.day.count-- : (stryCov_9fa48("3253"), record.day.count++);

      // Retorna limite mais próximo de ser atingido
      const closest = stryMutAct_9fa48("3254") ? [minuteCheck, hourCheck, dayCheck][0] : (stryCov_9fa48("3254"), (stryMutAct_9fa48("3255") ? [] : (stryCov_9fa48("3255"), [minuteCheck, hourCheck, dayCheck])).sort(stryMutAct_9fa48("3256") ? () => undefined : (stryCov_9fa48("3256"), (a, b) => stryMutAct_9fa48("3257") ? a.remaining + b.remaining : (stryCov_9fa48("3257"), a.remaining - b.remaining)))[0]);
      return closest;
    }
  }

  /**
   * Verifica uma janela de tempo específica
   */
  private static checkWindow(window: {
    count: number;
    resetAt: number;
  }, limit: number, duration: number, now: number): RateLimitResult {
    if (stryMutAct_9fa48("3258")) {
      {}
    } else {
      stryCov_9fa48("3258");
      const allowed = stryMutAct_9fa48("3262") ? window.count >= limit : stryMutAct_9fa48("3261") ? window.count <= limit : stryMutAct_9fa48("3260") ? false : stryMutAct_9fa48("3259") ? true : (stryCov_9fa48("3259", "3260", "3261", "3262"), window.count < limit);
      const remaining = stryMutAct_9fa48("3263") ? Math.min(0, limit - window.count) : (stryCov_9fa48("3263"), Math.max(0, stryMutAct_9fa48("3264") ? limit + window.count : (stryCov_9fa48("3264"), limit - window.count)));
      const retryAfter = allowed ? undefined : Math.ceil(stryMutAct_9fa48("3265") ? (window.resetAt - now) * 1000 : (stryCov_9fa48("3265"), (stryMutAct_9fa48("3266") ? window.resetAt + now : (stryCov_9fa48("3266"), window.resetAt - now)) / 1000));
      return stryMutAct_9fa48("3267") ? {} : (stryCov_9fa48("3267"), {
        allowed,
        limit,
        remaining,
        resetAt: window.resetAt,
        retryAfter
      });
    }
  }

  /**
   * Cria novo record para usuário
   */
  private static createRecord(userId: string, tier: UserTier): RateLimitRecord {
    if (stryMutAct_9fa48("3268")) {
      {}
    } else {
      stryCov_9fa48("3268");
      const now = Date.now();
      return stryMutAct_9fa48("3269") ? {} : (stryCov_9fa48("3269"), {
        userId,
        tier,
        minute: stryMutAct_9fa48("3270") ? {} : (stryCov_9fa48("3270"), {
          count: 0,
          resetAt: stryMutAct_9fa48("3271") ? now - 60 * 1000 : (stryCov_9fa48("3271"), now + (stryMutAct_9fa48("3272") ? 60 / 1000 : (stryCov_9fa48("3272"), 60 * 1000)))
        }),
        hour: stryMutAct_9fa48("3273") ? {} : (stryCov_9fa48("3273"), {
          count: 0,
          resetAt: stryMutAct_9fa48("3274") ? now - 60 * 60 * 1000 : (stryCov_9fa48("3274"), now + (stryMutAct_9fa48("3275") ? 60 * 60 / 1000 : (stryCov_9fa48("3275"), (stryMutAct_9fa48("3276") ? 60 / 60 : (stryCov_9fa48("3276"), 60 * 60)) * 1000)))
        }),
        day: stryMutAct_9fa48("3277") ? {} : (stryCov_9fa48("3277"), {
          count: 0,
          resetAt: stryMutAct_9fa48("3278") ? now - 24 * 60 * 60 * 1000 : (stryCov_9fa48("3278"), now + (stryMutAct_9fa48("3279") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("3279"), (stryMutAct_9fa48("3280") ? 24 * 60 / 60 : (stryCov_9fa48("3280"), (stryMutAct_9fa48("3281") ? 24 / 60 : (stryCov_9fa48("3281"), 24 * 60)) * 60)) * 1000)))
        })
      });
    }
  }

  /**
   * Reseta contadores se janela expirou
   */
  private static resetIfNeeded(record: RateLimitRecord, now: number): void {
    if (stryMutAct_9fa48("3282")) {
      {}
    } else {
      stryCov_9fa48("3282");
      if (stryMutAct_9fa48("3286") ? now < record.minute.resetAt : stryMutAct_9fa48("3285") ? now > record.minute.resetAt : stryMutAct_9fa48("3284") ? false : stryMutAct_9fa48("3283") ? true : (stryCov_9fa48("3283", "3284", "3285", "3286"), now >= record.minute.resetAt)) {
        if (stryMutAct_9fa48("3287")) {
          {}
        } else {
          stryCov_9fa48("3287");
          record.minute.count = 0;
          record.minute.resetAt = stryMutAct_9fa48("3288") ? now - 60 * 1000 : (stryCov_9fa48("3288"), now + (stryMutAct_9fa48("3289") ? 60 / 1000 : (stryCov_9fa48("3289"), 60 * 1000)));
        }
      }
      if (stryMutAct_9fa48("3293") ? now < record.hour.resetAt : stryMutAct_9fa48("3292") ? now > record.hour.resetAt : stryMutAct_9fa48("3291") ? false : stryMutAct_9fa48("3290") ? true : (stryCov_9fa48("3290", "3291", "3292", "3293"), now >= record.hour.resetAt)) {
        if (stryMutAct_9fa48("3294")) {
          {}
        } else {
          stryCov_9fa48("3294");
          record.hour.count = 0;
          record.hour.resetAt = stryMutAct_9fa48("3295") ? now - 60 * 60 * 1000 : (stryCov_9fa48("3295"), now + (stryMutAct_9fa48("3296") ? 60 * 60 / 1000 : (stryCov_9fa48("3296"), (stryMutAct_9fa48("3297") ? 60 / 60 : (stryCov_9fa48("3297"), 60 * 60)) * 1000)));
        }
      }
      if (stryMutAct_9fa48("3301") ? now < record.day.resetAt : stryMutAct_9fa48("3300") ? now > record.day.resetAt : stryMutAct_9fa48("3299") ? false : stryMutAct_9fa48("3298") ? true : (stryCov_9fa48("3298", "3299", "3300", "3301"), now >= record.day.resetAt)) {
        if (stryMutAct_9fa48("3302")) {
          {}
        } else {
          stryCov_9fa48("3302");
          record.day.count = 0;
          record.day.resetAt = stryMutAct_9fa48("3303") ? now - 24 * 60 * 60 * 1000 : (stryCov_9fa48("3303"), now + (stryMutAct_9fa48("3304") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("3304"), (stryMutAct_9fa48("3305") ? 24 * 60 / 60 : (stryCov_9fa48("3305"), (stryMutAct_9fa48("3306") ? 24 / 60 : (stryCov_9fa48("3306"), 24 * 60)) * 60)) * 1000)));
        }
      }
    }
  }

  /**
   * Limpa records antigos (garbage collection)
   */
  static cleanup(): void {
    if (stryMutAct_9fa48("3307")) {
      {}
    } else {
      stryCov_9fa48("3307");
      const now = Date.now();
      const threshold = stryMutAct_9fa48("3308") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("3308"), (stryMutAct_9fa48("3309") ? 24 * 60 / 60 : (stryCov_9fa48("3309"), (stryMutAct_9fa48("3310") ? 24 / 60 : (stryCov_9fa48("3310"), 24 * 60)) * 60)) * 1000); // 24 horas

      for (const [userId, record] of this.records.entries()) {
        if (stryMutAct_9fa48("3311")) {
          {}
        } else {
          stryCov_9fa48("3311");
          if (stryMutAct_9fa48("3315") ? now <= record.day.resetAt + threshold : stryMutAct_9fa48("3314") ? now >= record.day.resetAt + threshold : stryMutAct_9fa48("3313") ? false : stryMutAct_9fa48("3312") ? true : (stryCov_9fa48("3312", "3313", "3314", "3315"), now > (stryMutAct_9fa48("3316") ? record.day.resetAt - threshold : (stryCov_9fa48("3316"), record.day.resetAt + threshold)))) {
            if (stryMutAct_9fa48("3317")) {
              {}
            } else {
              stryCov_9fa48("3317");
              this.records.delete(userId);
            }
          }
        }
      }
      log.debug(stryMutAct_9fa48("3318") ? "" : (stryCov_9fa48("3318"), 'Rate limiter cleanup'), stryMutAct_9fa48("3319") ? {} : (stryCov_9fa48("3319"), {
        recordsRemaining: this.records.size
      }));
    }
  }

  /**
   * Retorna estatísticas de uso
   */
  static getStats(userId?: string): any {
    if (stryMutAct_9fa48("3320")) {
      {}
    } else {
      stryCov_9fa48("3320");
      if (stryMutAct_9fa48("3322") ? false : stryMutAct_9fa48("3321") ? true : (stryCov_9fa48("3321", "3322"), userId)) {
        if (stryMutAct_9fa48("3323")) {
          {}
        } else {
          stryCov_9fa48("3323");
          const record = this.records.get(userId);
          if (stryMutAct_9fa48("3326") ? false : stryMutAct_9fa48("3325") ? true : stryMutAct_9fa48("3324") ? record : (stryCov_9fa48("3324", "3325", "3326"), !record)) return null;
          const config = RATE_LIMIT_CONFIGS[record.tier];
          return stryMutAct_9fa48("3327") ? {} : (stryCov_9fa48("3327"), {
            userId: record.userId,
            tier: record.tier,
            usage: stryMutAct_9fa48("3328") ? {} : (stryCov_9fa48("3328"), {
              minute: stryMutAct_9fa48("3329") ? {} : (stryCov_9fa48("3329"), {
                current: record.minute.count,
                limit: config.limits.perMinute,
                remaining: stryMutAct_9fa48("3330") ? config.limits.perMinute + record.minute.count : (stryCov_9fa48("3330"), config.limits.perMinute - record.minute.count),
                resetAt: new Date(record.minute.resetAt)
              }),
              hour: stryMutAct_9fa48("3331") ? {} : (stryCov_9fa48("3331"), {
                current: record.hour.count,
                limit: config.limits.perHour,
                remaining: stryMutAct_9fa48("3332") ? config.limits.perHour + record.hour.count : (stryCov_9fa48("3332"), config.limits.perHour - record.hour.count),
                resetAt: new Date(record.hour.resetAt)
              }),
              day: stryMutAct_9fa48("3333") ? {} : (stryCov_9fa48("3333"), {
                current: record.day.count,
                limit: config.limits.perDay,
                remaining: stryMutAct_9fa48("3334") ? config.limits.perDay + record.day.count : (stryCov_9fa48("3334"), config.limits.perDay - record.day.count),
                resetAt: new Date(record.day.resetAt)
              })
            })
          });
        }
      }

      // Estatísticas gerais
      return stryMutAct_9fa48("3335") ? {} : (stryCov_9fa48("3335"), {
        totalUsers: this.records.size,
        byTier: stryMutAct_9fa48("3336") ? {} : (stryCov_9fa48("3336"), {
          free: stryMutAct_9fa48("3337") ? Array.from(this.records.values()).length : (stryCov_9fa48("3337"), Array.from(this.records.values()).filter(stryMutAct_9fa48("3338") ? () => undefined : (stryCov_9fa48("3338"), r => stryMutAct_9fa48("3341") ? r.tier !== UserTier.FREE : stryMutAct_9fa48("3340") ? false : stryMutAct_9fa48("3339") ? true : (stryCov_9fa48("3339", "3340", "3341"), r.tier === UserTier.FREE))).length),
          premium: stryMutAct_9fa48("3342") ? Array.from(this.records.values()).length : (stryCov_9fa48("3342"), Array.from(this.records.values()).filter(stryMutAct_9fa48("3343") ? () => undefined : (stryCov_9fa48("3343"), r => stryMutAct_9fa48("3346") ? r.tier !== UserTier.PREMIUM : stryMutAct_9fa48("3345") ? false : stryMutAct_9fa48("3344") ? true : (stryCov_9fa48("3344", "3345", "3346"), r.tier === UserTier.PREMIUM))).length),
          enterprise: stryMutAct_9fa48("3347") ? Array.from(this.records.values()).length : (stryCov_9fa48("3347"), Array.from(this.records.values()).filter(stryMutAct_9fa48("3348") ? () => undefined : (stryCov_9fa48("3348"), r => stryMutAct_9fa48("3351") ? r.tier !== UserTier.ENTERPRISE : stryMutAct_9fa48("3350") ? false : stryMutAct_9fa48("3349") ? true : (stryCov_9fa48("3349", "3350", "3351"), r.tier === UserTier.ENTERPRISE))).length),
          admin: stryMutAct_9fa48("3352") ? Array.from(this.records.values()).length : (stryCov_9fa48("3352"), Array.from(this.records.values()).filter(stryMutAct_9fa48("3353") ? () => undefined : (stryCov_9fa48("3353"), r => stryMutAct_9fa48("3356") ? r.tier !== UserTier.ADMIN : stryMutAct_9fa48("3355") ? false : stryMutAct_9fa48("3354") ? true : (stryCov_9fa48("3354", "3355", "3356"), r.tier === UserTier.ADMIN))).length)
        })
      });
    }
  }

  /**
   * Reseta limites de um usuário (admin)
   */
  static resetUser(userId: string): void {
    if (stryMutAct_9fa48("3357")) {
      {}
    } else {
      stryCov_9fa48("3357");
      this.records.delete(userId);
      log.info(stryMutAct_9fa48("3358") ? "" : (stryCov_9fa48("3358"), 'Rate limit resetado'), stryMutAct_9fa48("3359") ? {} : (stryCov_9fa48("3359"), {
        userId
      }));
    }
  }
}

// Cleanup automático a cada hora
setInterval(() => {
  if (stryMutAct_9fa48("3360")) {
    {}
  } else {
    stryCov_9fa48("3360");
    UserRateLimiter.cleanup();
  }
}, stryMutAct_9fa48("3361") ? 60 * 60 / 1000 : (stryCov_9fa48("3361"), (stryMutAct_9fa48("3362") ? 60 / 60 : (stryCov_9fa48("3362"), 60 * 60)) * 1000));