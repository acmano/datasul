// @ts-nocheck
// src/shared/services/ApiKeyService.ts
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
import crypto from 'crypto';
import { ApiKeyConfig, UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * Serviço para gerenciar API Keys
 * Em produção, isso deveria vir de um banco de dados
 */
export class ApiKeyService {
  private static apiKeys: Map<string, ApiKeyConfig> = new Map();

  /**
   * Inicializa API keys de exemplo
   * Em produção, carregar do banco de dados
   */
  static initialize(): void {
    if (stryMutAct_9fa48("3002")) {
      {}
    } else {
      stryCov_9fa48("3002");
      // API Keys de exemplo
      const exampleKeys: ApiKeyConfig[] = stryMutAct_9fa48("3003") ? [] : (stryCov_9fa48("3003"), [stryMutAct_9fa48("3004") ? {} : (stryCov_9fa48("3004"), {
        key: stryMutAct_9fa48("3005") ? "" : (stryCov_9fa48("3005"), 'free-demo-key-123456'),
        userId: stryMutAct_9fa48("3006") ? "" : (stryCov_9fa48("3006"), 'user-001'),
        userName: stryMutAct_9fa48("3007") ? "" : (stryCov_9fa48("3007"), 'Demo User Free'),
        tier: UserTier.FREE,
        active: stryMutAct_9fa48("3008") ? false : (stryCov_9fa48("3008"), true),
        createdAt: new Date()
      }), stryMutAct_9fa48("3009") ? {} : (stryCov_9fa48("3009"), {
        key: stryMutAct_9fa48("3010") ? "" : (stryCov_9fa48("3010"), 'premium-key-abc123'),
        userId: stryMutAct_9fa48("3011") ? "" : (stryCov_9fa48("3011"), 'user-002'),
        userName: stryMutAct_9fa48("3012") ? "" : (stryCov_9fa48("3012"), 'Premium User'),
        tier: UserTier.PREMIUM,
        active: stryMutAct_9fa48("3013") ? false : (stryCov_9fa48("3013"), true),
        createdAt: new Date()
      }), stryMutAct_9fa48("3014") ? {} : (stryCov_9fa48("3014"), {
        key: stryMutAct_9fa48("3015") ? "" : (stryCov_9fa48("3015"), 'enterprise-key-xyz789'),
        userId: stryMutAct_9fa48("3016") ? "" : (stryCov_9fa48("3016"), 'user-003'),
        userName: stryMutAct_9fa48("3017") ? "" : (stryCov_9fa48("3017"), 'Enterprise Corp'),
        tier: UserTier.ENTERPRISE,
        active: stryMutAct_9fa48("3018") ? false : (stryCov_9fa48("3018"), true),
        createdAt: new Date()
      }), stryMutAct_9fa48("3019") ? {} : (stryCov_9fa48("3019"), {
        key: stryMutAct_9fa48("3020") ? "" : (stryCov_9fa48("3020"), 'admin-key-superuser'),
        userId: stryMutAct_9fa48("3021") ? "" : (stryCov_9fa48("3021"), 'admin-001'),
        userName: stryMutAct_9fa48("3022") ? "" : (stryCov_9fa48("3022"), 'System Admin'),
        tier: UserTier.ADMIN,
        active: stryMutAct_9fa48("3023") ? false : (stryCov_9fa48("3023"), true),
        createdAt: new Date()
      })]);
      exampleKeys.forEach(key => {
        if (stryMutAct_9fa48("3024")) {
          {}
        } else {
          stryCov_9fa48("3024");
          this.apiKeys.set(key.key, key);
        }
      });
      log.info(stryMutAct_9fa48("3025") ? "" : (stryCov_9fa48("3025"), 'API Keys inicializadas'), stryMutAct_9fa48("3026") ? {} : (stryCov_9fa48("3026"), {
        count: this.apiKeys.size,
        tiers: Array.from(new Set(exampleKeys.map(stryMutAct_9fa48("3027") ? () => undefined : (stryCov_9fa48("3027"), k => k.tier))))
      }));
    }
  }

  /**
   * Valida uma API Key
   */
  static async validateKey(apiKey: string): Promise<ApiKeyConfig | null> {
    if (stryMutAct_9fa48("3028")) {
      {}
    } else {
      stryCov_9fa48("3028");
      const keyConfig = this.apiKeys.get(apiKey);
      if (stryMutAct_9fa48("3031") ? false : stryMutAct_9fa48("3030") ? true : stryMutAct_9fa48("3029") ? keyConfig : (stryCov_9fa48("3029", "3030", "3031"), !keyConfig)) {
        if (stryMutAct_9fa48("3032")) {
          {}
        } else {
          stryCov_9fa48("3032");
          log.warn(stryMutAct_9fa48("3033") ? "" : (stryCov_9fa48("3033"), 'API Key inválida'), stryMutAct_9fa48("3034") ? {} : (stryCov_9fa48("3034"), {
            apiKey: this.maskKey(apiKey)
          }));
          return null;
        }
      }
      if (stryMutAct_9fa48("3037") ? false : stryMutAct_9fa48("3036") ? true : stryMutAct_9fa48("3035") ? keyConfig.active : (stryCov_9fa48("3035", "3036", "3037"), !keyConfig.active)) {
        if (stryMutAct_9fa48("3038")) {
          {}
        } else {
          stryCov_9fa48("3038");
          log.warn(stryMutAct_9fa48("3039") ? "" : (stryCov_9fa48("3039"), 'API Key inativa'), stryMutAct_9fa48("3040") ? {} : (stryCov_9fa48("3040"), {
            apiKey: this.maskKey(apiKey),
            userId: keyConfig.userId
          }));
          return null;
        }
      }

      // Verificar expiração
      if (stryMutAct_9fa48("3043") ? keyConfig.expiresAt || keyConfig.expiresAt < new Date() : stryMutAct_9fa48("3042") ? false : stryMutAct_9fa48("3041") ? true : (stryCov_9fa48("3041", "3042", "3043"), keyConfig.expiresAt && (stryMutAct_9fa48("3046") ? keyConfig.expiresAt >= new Date() : stryMutAct_9fa48("3045") ? keyConfig.expiresAt <= new Date() : stryMutAct_9fa48("3044") ? true : (stryCov_9fa48("3044", "3045", "3046"), keyConfig.expiresAt < new Date())))) {
        if (stryMutAct_9fa48("3047")) {
          {}
        } else {
          stryCov_9fa48("3047");
          log.warn(stryMutAct_9fa48("3048") ? "" : (stryCov_9fa48("3048"), 'API Key expirada'), stryMutAct_9fa48("3049") ? {} : (stryCov_9fa48("3049"), {
            apiKey: this.maskKey(apiKey),
            userId: keyConfig.userId,
            expiresAt: keyConfig.expiresAt
          }));
          return null;
        }
      }
      return keyConfig;
    }
  }

  /**
   * Gera uma nova API Key
   */
  static async generateKey(userId: string, userName: string, tier: UserTier = UserTier.FREE, expiresInDays?: number): Promise<string> {
    if (stryMutAct_9fa48("3050")) {
      {}
    } else {
      stryCov_9fa48("3050");
      const prefix = stryMutAct_9fa48("3051") ? tier.toUpperCase() : (stryCov_9fa48("3051"), tier.toLowerCase());
      const randomPart = crypto.randomBytes(16).toString(stryMutAct_9fa48("3052") ? "" : (stryCov_9fa48("3052"), 'hex'));
      const apiKey = stryMutAct_9fa48("3053") ? `` : (stryCov_9fa48("3053"), `${prefix}-${randomPart}`);
      const expiresAt = expiresInDays ? new Date(stryMutAct_9fa48("3054") ? Date.now() - expiresInDays * 24 * 60 * 60 * 1000 : (stryCov_9fa48("3054"), Date.now() + (stryMutAct_9fa48("3055") ? expiresInDays * 24 * 60 * 60 / 1000 : (stryCov_9fa48("3055"), (stryMutAct_9fa48("3056") ? expiresInDays * 24 * 60 / 60 : (stryCov_9fa48("3056"), (stryMutAct_9fa48("3057") ? expiresInDays * 24 / 60 : (stryCov_9fa48("3057"), (stryMutAct_9fa48("3058") ? expiresInDays / 24 : (stryCov_9fa48("3058"), expiresInDays * 24)) * 60)) * 60)) * 1000)))) : undefined;
      const keyConfig: ApiKeyConfig = stryMutAct_9fa48("3059") ? {} : (stryCov_9fa48("3059"), {
        key: apiKey,
        userId,
        userName,
        tier,
        active: stryMutAct_9fa48("3060") ? false : (stryCov_9fa48("3060"), true),
        createdAt: new Date(),
        expiresAt
      });
      this.apiKeys.set(apiKey, keyConfig);
      log.info(stryMutAct_9fa48("3061") ? "" : (stryCov_9fa48("3061"), 'API Key gerada'), stryMutAct_9fa48("3062") ? {} : (stryCov_9fa48("3062"), {
        userId,
        tier,
        expiresAt,
        apiKey: this.maskKey(apiKey)
      }));
      return apiKey;
    }
  }

  /**
   * Revoga uma API Key
   */
  static async revokeKey(apiKey: string): Promise<boolean> {
    if (stryMutAct_9fa48("3063")) {
      {}
    } else {
      stryCov_9fa48("3063");
      const keyConfig = this.apiKeys.get(apiKey);
      if (stryMutAct_9fa48("3066") ? false : stryMutAct_9fa48("3065") ? true : stryMutAct_9fa48("3064") ? keyConfig : (stryCov_9fa48("3064", "3065", "3066"), !keyConfig)) {
        if (stryMutAct_9fa48("3067")) {
          {}
        } else {
          stryCov_9fa48("3067");
          return stryMutAct_9fa48("3068") ? true : (stryCov_9fa48("3068"), false);
        }
      }
      keyConfig.active = stryMutAct_9fa48("3069") ? true : (stryCov_9fa48("3069"), false);
      log.info(stryMutAct_9fa48("3070") ? "" : (stryCov_9fa48("3070"), 'API Key revogada'), stryMutAct_9fa48("3071") ? {} : (stryCov_9fa48("3071"), {
        userId: keyConfig.userId,
        apiKey: this.maskKey(apiKey)
      }));
      return stryMutAct_9fa48("3072") ? false : (stryCov_9fa48("3072"), true);
    }
  }

  /**
   * Lista API Keys de um usuário
   */
  static async getUserKeys(userId: string): Promise<ApiKeyConfig[]> {
    if (stryMutAct_9fa48("3073")) {
      {}
    } else {
      stryCov_9fa48("3073");
      return stryMutAct_9fa48("3074") ? Array.from(this.apiKeys.values()) : (stryCov_9fa48("3074"), Array.from(this.apiKeys.values()).filter(stryMutAct_9fa48("3075") ? () => undefined : (stryCov_9fa48("3075"), key => stryMutAct_9fa48("3078") ? key.userId !== userId : stryMutAct_9fa48("3077") ? false : stryMutAct_9fa48("3076") ? true : (stryCov_9fa48("3076", "3077", "3078"), key.userId === userId))));
    }
  }

  /**
   * Atualiza tier de um usuário
   */
  static async updateUserTier(userId: string, newTier: UserTier): Promise<void> {
    if (stryMutAct_9fa48("3079")) {
      {}
    } else {
      stryCov_9fa48("3079");
      const userKeys = await this.getUserKeys(userId);
      userKeys.forEach(keyConfig => {
        if (stryMutAct_9fa48("3080")) {
          {}
        } else {
          stryCov_9fa48("3080");
          keyConfig.tier = newTier;
        }
      });
      log.info(stryMutAct_9fa48("3081") ? "" : (stryCov_9fa48("3081"), 'Tier do usuário atualizado'), stryMutAct_9fa48("3082") ? {} : (stryCov_9fa48("3082"), {
        userId,
        newTier,
        keysUpdated: userKeys.length
      }));
    }
  }

  /**
   * Mascara API Key para logs
   */
  private static maskKey(apiKey: string): string {
    if (stryMutAct_9fa48("3083")) {
      {}
    } else {
      stryCov_9fa48("3083");
      if (stryMutAct_9fa48("3087") ? apiKey.length > 8 : stryMutAct_9fa48("3086") ? apiKey.length < 8 : stryMutAct_9fa48("3085") ? false : stryMutAct_9fa48("3084") ? true : (stryCov_9fa48("3084", "3085", "3086", "3087"), apiKey.length <= 8)) {
        if (stryMutAct_9fa48("3088")) {
          {}
        } else {
          stryCov_9fa48("3088");
          return stryMutAct_9fa48("3089") ? "" : (stryCov_9fa48("3089"), '***');
        }
      }
      return stryMutAct_9fa48("3090") ? `` : (stryCov_9fa48("3090"), `${stryMutAct_9fa48("3091") ? apiKey : (stryCov_9fa48("3091"), apiKey.substring(0, 4))}...${stryMutAct_9fa48("3092") ? apiKey : (stryCov_9fa48("3092"), apiKey.substring(stryMutAct_9fa48("3093") ? apiKey.length + 4 : (stryCov_9fa48("3093"), apiKey.length - 4)))}`);
    }
  }

  /**
   * Retorna estatísticas de API Keys
   */
  static getStats(): any {
    if (stryMutAct_9fa48("3094")) {
      {}
    } else {
      stryCov_9fa48("3094");
      const keys = Array.from(this.apiKeys.values());
      return stryMutAct_9fa48("3095") ? {} : (stryCov_9fa48("3095"), {
        total: keys.length,
        active: stryMutAct_9fa48("3096") ? keys.length : (stryCov_9fa48("3096"), keys.filter(stryMutAct_9fa48("3097") ? () => undefined : (stryCov_9fa48("3097"), k => k.active)).length),
        inactive: stryMutAct_9fa48("3098") ? keys.length : (stryCov_9fa48("3098"), keys.filter(stryMutAct_9fa48("3099") ? () => undefined : (stryCov_9fa48("3099"), k => stryMutAct_9fa48("3100") ? k.active : (stryCov_9fa48("3100"), !k.active))).length),
        byTier: stryMutAct_9fa48("3101") ? {} : (stryCov_9fa48("3101"), {
          free: stryMutAct_9fa48("3102") ? keys.length : (stryCov_9fa48("3102"), keys.filter(stryMutAct_9fa48("3103") ? () => undefined : (stryCov_9fa48("3103"), k => stryMutAct_9fa48("3106") ? k.tier !== UserTier.FREE : stryMutAct_9fa48("3105") ? false : stryMutAct_9fa48("3104") ? true : (stryCov_9fa48("3104", "3105", "3106"), k.tier === UserTier.FREE))).length),
          premium: stryMutAct_9fa48("3107") ? keys.length : (stryCov_9fa48("3107"), keys.filter(stryMutAct_9fa48("3108") ? () => undefined : (stryCov_9fa48("3108"), k => stryMutAct_9fa48("3111") ? k.tier !== UserTier.PREMIUM : stryMutAct_9fa48("3110") ? false : stryMutAct_9fa48("3109") ? true : (stryCov_9fa48("3109", "3110", "3111"), k.tier === UserTier.PREMIUM))).length),
          enterprise: stryMutAct_9fa48("3112") ? keys.length : (stryCov_9fa48("3112"), keys.filter(stryMutAct_9fa48("3113") ? () => undefined : (stryCov_9fa48("3113"), k => stryMutAct_9fa48("3116") ? k.tier !== UserTier.ENTERPRISE : stryMutAct_9fa48("3115") ? false : stryMutAct_9fa48("3114") ? true : (stryCov_9fa48("3114", "3115", "3116"), k.tier === UserTier.ENTERPRISE))).length),
          admin: stryMutAct_9fa48("3117") ? keys.length : (stryCov_9fa48("3117"), keys.filter(stryMutAct_9fa48("3118") ? () => undefined : (stryCov_9fa48("3118"), k => stryMutAct_9fa48("3121") ? k.tier !== UserTier.ADMIN : stryMutAct_9fa48("3120") ? false : stryMutAct_9fa48("3119") ? true : (stryCov_9fa48("3119", "3120", "3121"), k.tier === UserTier.ADMIN))).length)
        })
      });
    }
  }
}