// @ts-nocheck
// src/shared/types/apiKey.types.ts
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
export enum UserTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
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
export const RATE_LIMIT_CONFIGS: Record<UserTier, RateLimitConfig> = stryMutAct_9fa48("3213") ? {} : (stryCov_9fa48("3213"), {
  [UserTier.FREE]: stryMutAct_9fa48("3214") ? {} : (stryCov_9fa48("3214"), {
    tier: UserTier.FREE,
    limits: stryMutAct_9fa48("3215") ? {} : (stryCov_9fa48("3215"), {
      perMinute: 10,
      perHour: 100,
      perDay: 1000
    }),
    burstAllowance: 5
  }),
  [UserTier.PREMIUM]: stryMutAct_9fa48("3216") ? {} : (stryCov_9fa48("3216"), {
    tier: UserTier.PREMIUM,
    limits: stryMutAct_9fa48("3217") ? {} : (stryCov_9fa48("3217"), {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    }),
    burstAllowance: 20
  }),
  [UserTier.ENTERPRISE]: stryMutAct_9fa48("3218") ? {} : (stryCov_9fa48("3218"), {
    tier: UserTier.ENTERPRISE,
    limits: stryMutAct_9fa48("3219") ? {} : (stryCov_9fa48("3219"), {
      perMinute: 300,
      perHour: 10000,
      perDay: 100000
    }),
    burstAllowance: 100
  }),
  [UserTier.ADMIN]: stryMutAct_9fa48("3220") ? {} : (stryCov_9fa48("3220"), {
    tier: UserTier.ADMIN,
    limits: stryMutAct_9fa48("3221") ? {} : (stryCov_9fa48("3221"), {
      perMinute: 1000,
      perHour: 50000,
      perDay: 1000000
    }),
    burstAllowance: 500
  })
});

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