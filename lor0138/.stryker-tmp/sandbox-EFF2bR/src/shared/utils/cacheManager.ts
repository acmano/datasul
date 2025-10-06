// @ts-nocheck
// src/shared/utils/cacheManager.ts
// ✅ VERSÃO ATUALIZADA: Suporta Memory, Redis e Layered (L1+L2)
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
import { CacheAdapter } from './cache/CacheAdapter';
import { MemoryCacheAdapter } from './cache/MemoryCacheAdapter';
import { RedisCacheAdapter } from './cache/RedisCacheAdapter';
import { LayeredCacheAdapter } from './cache/LayeredCacheAdapter';
import { log } from './logger';
import { appConfig } from '@config/app.config';

/**
 * Gerenciador de cache com suporte a múltiplos backends
 * - Memory: Cache local (padrão)
 * - Redis: Cache compartilhado
 * - Layered: L1 (memory) + L2 (Redis)
 */
export class CacheManager {
  private static adapter: CacheAdapter;
  private static strategy: string = stryMutAct_9fa48("3811") ? "" : (stryCov_9fa48("3811"), 'memory');
  private static enabled: boolean = stryMutAct_9fa48("3812") ? false : (stryCov_9fa48("3812"), true);

  /**
   * Inicializa o cache com a estratégia escolhida
   */
  static initialize(strategy?: string): void {
    if (stryMutAct_9fa48("3813")) {
      {}
    } else {
      stryCov_9fa48("3813");
      this.enabled = stryMutAct_9fa48("3816") ? process.env.CACHE_ENABLED === 'false' : stryMutAct_9fa48("3815") ? false : stryMutAct_9fa48("3814") ? true : (stryCov_9fa48("3814", "3815", "3816"), process.env.CACHE_ENABLED !== (stryMutAct_9fa48("3817") ? "" : (stryCov_9fa48("3817"), 'false')));
      this.strategy = stryMutAct_9fa48("3820") ? (strategy || process.env.CACHE_STRATEGY) && 'memory' : stryMutAct_9fa48("3819") ? false : stryMutAct_9fa48("3818") ? true : (stryCov_9fa48("3818", "3819", "3820"), (stryMutAct_9fa48("3822") ? strategy && process.env.CACHE_STRATEGY : stryMutAct_9fa48("3821") ? false : (stryCov_9fa48("3821", "3822"), strategy || process.env.CACHE_STRATEGY)) || (stryMutAct_9fa48("3823") ? "" : (stryCov_9fa48("3823"), 'memory')));
      if (stryMutAct_9fa48("3826") ? false : stryMutAct_9fa48("3825") ? true : stryMutAct_9fa48("3824") ? this.enabled : (stryCov_9fa48("3824", "3825", "3826"), !this.enabled)) {
        if (stryMutAct_9fa48("3827")) {
          {}
        } else {
          stryCov_9fa48("3827");
          log.warn(stryMutAct_9fa48("3828") ? "" : (stryCov_9fa48("3828"), '❌ Cache desabilitado (CACHE_ENABLED=false)'));
          return;
        }
      }
      const ttl = parseInt(stryMutAct_9fa48("3831") ? process.env.CACHE_DEFAULT_TTL && '300' : stryMutAct_9fa48("3830") ? false : stryMutAct_9fa48("3829") ? true : (stryCov_9fa48("3829", "3830", "3831"), process.env.CACHE_DEFAULT_TTL || (stryMutAct_9fa48("3832") ? "" : (stryCov_9fa48("3832"), '300'))), 10);
      try {
        if (stryMutAct_9fa48("3833")) {
          {}
        } else {
          stryCov_9fa48("3833");
          switch (this.strategy) {
            case stryMutAct_9fa48("3835") ? "" : (stryCov_9fa48("3835"), 'layered'):
              if (stryMutAct_9fa48("3834")) {} else {
                stryCov_9fa48("3834");
                this.initializeLayered(ttl);
                break;
              }
            case stryMutAct_9fa48("3837") ? "" : (stryCov_9fa48("3837"), 'redis'):
              if (stryMutAct_9fa48("3836")) {} else {
                stryCov_9fa48("3836");
                this.initializeRedis(ttl);
                break;
              }
            case stryMutAct_9fa48("3838") ? "" : (stryCov_9fa48("3838"), 'memory'):
            default:
              if (stryMutAct_9fa48("3839")) {} else {
                stryCov_9fa48("3839");
                this.initializeMemory(ttl);
                break;
              }
          }
          log.info(stryMutAct_9fa48("3840") ? "" : (stryCov_9fa48("3840"), '✅ Cache inicializado'), stryMutAct_9fa48("3841") ? {} : (stryCov_9fa48("3841"), {
            strategy: this.strategy,
            enabled: this.enabled,
            ttl
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3842")) {
          {}
        } else {
          stryCov_9fa48("3842");
          log.error(stryMutAct_9fa48("3843") ? "" : (stryCov_9fa48("3843"), '❌ Erro ao inicializar cache'), stryMutAct_9fa48("3844") ? {} : (stryCov_9fa48("3844"), {
            strategy: this.strategy,
            error
          }));
          // Fallback para memória em caso de erro
          this.initializeMemory(ttl);
        }
      }
    }
  }
  private static initializeMemory(ttl: number): void {
    if (stryMutAct_9fa48("3845")) {
      {}
    } else {
      stryCov_9fa48("3845");
      this.adapter = new MemoryCacheAdapter(ttl, stryMutAct_9fa48("3846") ? "" : (stryCov_9fa48("3846"), 'Cache-Memory'));
      this.strategy = stryMutAct_9fa48("3847") ? "" : (stryCov_9fa48("3847"), 'memory');
    }
  }
  private static initializeRedis(ttl: number): void {
    if (stryMutAct_9fa48("3848")) {
      {}
    } else {
      stryCov_9fa48("3848");
      const redisUrl = stryMutAct_9fa48("3851") ? process.env.CACHE_REDIS_URL && 'redis://lor0138.lorenzetti.ibe:6379' : stryMutAct_9fa48("3850") ? false : stryMutAct_9fa48("3849") ? true : (stryCov_9fa48("3849", "3850", "3851"), process.env.CACHE_REDIS_URL || (stryMutAct_9fa48("3852") ? "" : (stryCov_9fa48("3852"), 'redis://lor0138.lorenzetti.ibe:6379')));
      this.adapter = new RedisCacheAdapter(redisUrl, stryMutAct_9fa48("3853") ? "" : (stryCov_9fa48("3853"), 'Cache-Redis'));
      this.strategy = stryMutAct_9fa48("3854") ? "" : (stryCov_9fa48("3854"), 'redis');
    }
  }
  private static initializeLayered(ttl: number): void {
    if (stryMutAct_9fa48("3855")) {
      {}
    } else {
      stryCov_9fa48("3855");
      const redisUrl = stryMutAct_9fa48("3858") ? process.env.CACHE_REDIS_URL && 'redis://lor0138.lorenzetti.ibe:6379' : stryMutAct_9fa48("3857") ? false : stryMutAct_9fa48("3856") ? true : (stryCov_9fa48("3856", "3857", "3858"), process.env.CACHE_REDIS_URL || (stryMutAct_9fa48("3859") ? "" : (stryCov_9fa48("3859"), 'redis://lor0138.lorenzetti.ibe:6379')));
      const l1 = new MemoryCacheAdapter(ttl, stryMutAct_9fa48("3860") ? "" : (stryCov_9fa48("3860"), 'L1-Memory'));
      const l2 = new RedisCacheAdapter(redisUrl, stryMutAct_9fa48("3861") ? "" : (stryCov_9fa48("3861"), 'L2-Redis'));
      this.adapter = new LayeredCacheAdapter(l1, l2, stryMutAct_9fa48("3862") ? "" : (stryCov_9fa48("3862"), 'Cache-Layered'));
      this.strategy = stryMutAct_9fa48("3863") ? "" : (stryCov_9fa48("3863"), 'layered');
    }
  }

  /**
   * Retorna instância singleton (compatibilidade)
   */
  static getInstance(): CacheManager {
    if (stryMutAct_9fa48("3864")) {
      {}
    } else {
      stryCov_9fa48("3864");
      if (stryMutAct_9fa48("3867") ? false : stryMutAct_9fa48("3866") ? true : stryMutAct_9fa48("3865") ? this.adapter : (stryCov_9fa48("3865", "3866", "3867"), !this.adapter)) {
        if (stryMutAct_9fa48("3868")) {
          {}
        } else {
          stryCov_9fa48("3868");
          this.initialize();
        }
      }
      return this;
    }
  }

  /**
   * Busca valor no cache
   */
  static async get<T>(key: string): Promise<T | undefined> {
    if (stryMutAct_9fa48("3869")) {
      {}
    } else {
      stryCov_9fa48("3869");
      if (stryMutAct_9fa48("3872") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3871") ? false : stryMutAct_9fa48("3870") ? true : (stryCov_9fa48("3870", "3871", "3872"), (stryMutAct_9fa48("3873") ? this.enabled : (stryCov_9fa48("3873"), !this.enabled)) || (stryMutAct_9fa48("3874") ? this.adapter : (stryCov_9fa48("3874"), !this.adapter)))) {
        if (stryMutAct_9fa48("3875")) {
          {}
        } else {
          stryCov_9fa48("3875");
          return undefined;
        }
      }
      try {
        if (stryMutAct_9fa48("3876")) {
          {}
        } else {
          stryCov_9fa48("3876");
          return await this.adapter.get<T>(key);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3877")) {
          {}
        } else {
          stryCov_9fa48("3877");
          log.error(stryMutAct_9fa48("3878") ? "" : (stryCov_9fa48("3878"), 'Cache GET error'), stryMutAct_9fa48("3879") ? {} : (stryCov_9fa48("3879"), {
            key,
            error
          }));
          return undefined;
        }
      }
    }
  }

  /**
   * Armazena valor no cache
   */
  static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (stryMutAct_9fa48("3880")) {
      {}
    } else {
      stryCov_9fa48("3880");
      if (stryMutAct_9fa48("3883") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3882") ? false : stryMutAct_9fa48("3881") ? true : (stryCov_9fa48("3881", "3882", "3883"), (stryMutAct_9fa48("3884") ? this.enabled : (stryCov_9fa48("3884"), !this.enabled)) || (stryMutAct_9fa48("3885") ? this.adapter : (stryCov_9fa48("3885"), !this.adapter)))) {
        if (stryMutAct_9fa48("3886")) {
          {}
        } else {
          stryCov_9fa48("3886");
          return stryMutAct_9fa48("3887") ? true : (stryCov_9fa48("3887"), false);
        }
      }
      try {
        if (stryMutAct_9fa48("3888")) {
          {}
        } else {
          stryCov_9fa48("3888");
          return await this.adapter.set(key, value, ttl);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3889")) {
          {}
        } else {
          stryCov_9fa48("3889");
          log.error(stryMutAct_9fa48("3890") ? "" : (stryCov_9fa48("3890"), 'Cache SET error'), stryMutAct_9fa48("3891") ? {} : (stryCov_9fa48("3891"), {
            key,
            error
          }));
          return stryMutAct_9fa48("3892") ? true : (stryCov_9fa48("3892"), false);
        }
      }
    }
  }

  /**
   * Remove valor do cache
   */
  static async delete(key: string): Promise<number> {
    if (stryMutAct_9fa48("3893")) {
      {}
    } else {
      stryCov_9fa48("3893");
      if (stryMutAct_9fa48("3896") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3895") ? false : stryMutAct_9fa48("3894") ? true : (stryCov_9fa48("3894", "3895", "3896"), (stryMutAct_9fa48("3897") ? this.enabled : (stryCov_9fa48("3897"), !this.enabled)) || (stryMutAct_9fa48("3898") ? this.adapter : (stryCov_9fa48("3898"), !this.adapter)))) {
        if (stryMutAct_9fa48("3899")) {
          {}
        } else {
          stryCov_9fa48("3899");
          return 0;
        }
      }
      try {
        if (stryMutAct_9fa48("3900")) {
          {}
        } else {
          stryCov_9fa48("3900");
          return await this.adapter.delete(key);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3901")) {
          {}
        } else {
          stryCov_9fa48("3901");
          log.error(stryMutAct_9fa48("3902") ? "" : (stryCov_9fa48("3902"), 'Cache DELETE error'), stryMutAct_9fa48("3903") ? {} : (stryCov_9fa48("3903"), {
            key,
            error
          }));
          return 0;
        }
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  static async flush(): Promise<void> {
    if (stryMutAct_9fa48("3904")) {
      {}
    } else {
      stryCov_9fa48("3904");
      if (stryMutAct_9fa48("3907") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3906") ? false : stryMutAct_9fa48("3905") ? true : (stryCov_9fa48("3905", "3906", "3907"), (stryMutAct_9fa48("3908") ? this.enabled : (stryCov_9fa48("3908"), !this.enabled)) || (stryMutAct_9fa48("3909") ? this.adapter : (stryCov_9fa48("3909"), !this.adapter)))) {
        if (stryMutAct_9fa48("3910")) {
          {}
        } else {
          stryCov_9fa48("3910");
          return;
        }
      }
      try {
        if (stryMutAct_9fa48("3911")) {
          {}
        } else {
          stryCov_9fa48("3911");
          await this.adapter.flush();
          log.info(stryMutAct_9fa48("3912") ? "" : (stryCov_9fa48("3912"), 'Cache limpo completamente'));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3913")) {
          {}
        } else {
          stryCov_9fa48("3913");
          log.error(stryMutAct_9fa48("3914") ? "" : (stryCov_9fa48("3914"), 'Cache FLUSH error'), stryMutAct_9fa48("3915") ? {} : (stryCov_9fa48("3915"), {
            error
          }));
        }
      }
    }
  }

  /**
   * Lista chaves em cache
   */
  static async keys(pattern?: string): Promise<string[]> {
    if (stryMutAct_9fa48("3916")) {
      {}
    } else {
      stryCov_9fa48("3916");
      if (stryMutAct_9fa48("3919") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3918") ? false : stryMutAct_9fa48("3917") ? true : (stryCov_9fa48("3917", "3918", "3919"), (stryMutAct_9fa48("3920") ? this.enabled : (stryCov_9fa48("3920"), !this.enabled)) || (stryMutAct_9fa48("3921") ? this.adapter : (stryCov_9fa48("3921"), !this.adapter)))) {
        if (stryMutAct_9fa48("3922")) {
          {}
        } else {
          stryCov_9fa48("3922");
          return stryMutAct_9fa48("3923") ? ["Stryker was here"] : (stryCov_9fa48("3923"), []);
        }
      }
      try {
        if (stryMutAct_9fa48("3924")) {
          {}
        } else {
          stryCov_9fa48("3924");
          return await this.adapter.keys(pattern);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3925")) {
          {}
        } else {
          stryCov_9fa48("3925");
          log.error(stryMutAct_9fa48("3926") ? "" : (stryCov_9fa48("3926"), 'Cache KEYS error'), stryMutAct_9fa48("3927") ? {} : (stryCov_9fa48("3927"), {
            pattern,
            error
          }));
          return stryMutAct_9fa48("3928") ? ["Stryker was here"] : (stryCov_9fa48("3928"), []);
        }
      }
    }
  }

  /**
   * Invalida chaves por padrão (wildcards)
   */
  static async invalidate(pattern: string): Promise<number> {
    if (stryMutAct_9fa48("3929")) {
      {}
    } else {
      stryCov_9fa48("3929");
      if (stryMutAct_9fa48("3932") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3931") ? false : stryMutAct_9fa48("3930") ? true : (stryCov_9fa48("3930", "3931", "3932"), (stryMutAct_9fa48("3933") ? this.enabled : (stryCov_9fa48("3933"), !this.enabled)) || (stryMutAct_9fa48("3934") ? this.adapter : (stryCov_9fa48("3934"), !this.adapter)))) {
        if (stryMutAct_9fa48("3935")) {
          {}
        } else {
          stryCov_9fa48("3935");
          return 0;
        }
      }
      try {
        if (stryMutAct_9fa48("3936")) {
          {}
        } else {
          stryCov_9fa48("3936");
          const keys = await this.adapter.keys(pattern);
          if (stryMutAct_9fa48("3939") ? keys.length !== 0 : stryMutAct_9fa48("3938") ? false : stryMutAct_9fa48("3937") ? true : (stryCov_9fa48("3937", "3938", "3939"), keys.length === 0)) {
            if (stryMutAct_9fa48("3940")) {
              {}
            } else {
              stryCov_9fa48("3940");
              log.debug(stryMutAct_9fa48("3941") ? "" : (stryCov_9fa48("3941"), 'Nenhuma chave encontrada para invalidar'), stryMutAct_9fa48("3942") ? {} : (stryCov_9fa48("3942"), {
                pattern
              }));
              return 0;
            }
          }
          const deletePromises = keys.map(stryMutAct_9fa48("3943") ? () => undefined : (stryCov_9fa48("3943"), key => this.adapter.delete(key)));
          const results = await Promise.all(deletePromises);
          const total = results.reduce(stryMutAct_9fa48("3944") ? () => undefined : (stryCov_9fa48("3944"), (sum, count) => stryMutAct_9fa48("3945") ? sum - count : (stryCov_9fa48("3945"), sum + count)), 0);
          log.info(stryMutAct_9fa48("3946") ? "" : (stryCov_9fa48("3946"), 'Cache invalidado'), stryMutAct_9fa48("3947") ? {} : (stryCov_9fa48("3947"), {
            pattern,
            keys: total
          }));
          return total;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3948")) {
          {}
        } else {
          stryCov_9fa48("3948");
          log.error(stryMutAct_9fa48("3949") ? "" : (stryCov_9fa48("3949"), 'Cache INVALIDATE error'), stryMutAct_9fa48("3950") ? {} : (stryCov_9fa48("3950"), {
            pattern,
            error
          }));
          return 0;
        }
      }
    }
  }

  /**
   * Cache-aside pattern: busca ou executa função
   */
  static async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    if (stryMutAct_9fa48("3951")) {
      {}
    } else {
      stryCov_9fa48("3951");
      // Tenta buscar do cache
      const cached = await this.get<T>(key);
      if (stryMutAct_9fa48("3954") ? cached === undefined : stryMutAct_9fa48("3953") ? false : stryMutAct_9fa48("3952") ? true : (stryCov_9fa48("3952", "3953", "3954"), cached !== undefined)) {
        if (stryMutAct_9fa48("3955")) {
          {}
        } else {
          stryCov_9fa48("3955");
          return cached;
        }
      }

      // Executa função para buscar dados
      const value = await fetchFn();

      // Armazena no cache
      await this.set(key, value, ttl);
      return value;
    }
  }

  /**
   * Verifica se cache está pronto
   */
  static async isReady(): Promise<boolean> {
    if (stryMutAct_9fa48("3956")) {
      {}
    } else {
      stryCov_9fa48("3956");
      if (stryMutAct_9fa48("3959") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3958") ? false : stryMutAct_9fa48("3957") ? true : (stryCov_9fa48("3957", "3958", "3959"), (stryMutAct_9fa48("3960") ? this.enabled : (stryCov_9fa48("3960"), !this.enabled)) || (stryMutAct_9fa48("3961") ? this.adapter : (stryCov_9fa48("3961"), !this.adapter)))) {
        if (stryMutAct_9fa48("3962")) {
          {}
        } else {
          stryCov_9fa48("3962");
          return stryMutAct_9fa48("3963") ? true : (stryCov_9fa48("3963"), false);
        }
      }
      try {
        if (stryMutAct_9fa48("3964")) {
          {}
        } else {
          stryCov_9fa48("3964");
          return await this.adapter.isReady();
        }
      } catch (error) {
        if (stryMutAct_9fa48("3965")) {
          {}
        } else {
          stryCov_9fa48("3965");
          log.error(stryMutAct_9fa48("3966") ? "" : (stryCov_9fa48("3966"), 'Cache isReady error'), stryMutAct_9fa48("3967") ? {} : (stryCov_9fa48("3967"), {
            error
          }));
          return stryMutAct_9fa48("3968") ? true : (stryCov_9fa48("3968"), false);
        }
      }
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  static getStats(): any {
    if (stryMutAct_9fa48("3969")) {
      {}
    } else {
      stryCov_9fa48("3969");
      if (stryMutAct_9fa48("3972") ? !this.enabled && !this.adapter : stryMutAct_9fa48("3971") ? false : stryMutAct_9fa48("3970") ? true : (stryCov_9fa48("3970", "3971", "3972"), (stryMutAct_9fa48("3973") ? this.enabled : (stryCov_9fa48("3973"), !this.enabled)) || (stryMutAct_9fa48("3974") ? this.adapter : (stryCov_9fa48("3974"), !this.adapter)))) {
        if (stryMutAct_9fa48("3975")) {
          {}
        } else {
          stryCov_9fa48("3975");
          return stryMutAct_9fa48("3976") ? {} : (stryCov_9fa48("3976"), {
            enabled: stryMutAct_9fa48("3977") ? true : (stryCov_9fa48("3977"), false),
            strategy: stryMutAct_9fa48("3978") ? "" : (stryCov_9fa48("3978"), 'none')
          });
        }
      }

      // LayeredCacheAdapter tem método getStats()
      if (stryMutAct_9fa48("3980") ? false : stryMutAct_9fa48("3979") ? true : (stryCov_9fa48("3979", "3980"), this.adapter instanceof LayeredCacheAdapter)) {
        if (stryMutAct_9fa48("3981")) {
          {}
        } else {
          stryCov_9fa48("3981");
          return stryMutAct_9fa48("3982") ? {} : (stryCov_9fa48("3982"), {
            enabled: stryMutAct_9fa48("3983") ? false : (stryCov_9fa48("3983"), true),
            strategy: this.strategy,
            ...this.adapter.getStats()
          });
        }
      }

      // MemoryCacheAdapter tem método getStats()
      if (stryMutAct_9fa48("3985") ? false : stryMutAct_9fa48("3984") ? true : (stryCov_9fa48("3984", "3985"), this.adapter instanceof MemoryCacheAdapter)) {
        if (stryMutAct_9fa48("3986")) {
          {}
        } else {
          stryCov_9fa48("3986");
          return stryMutAct_9fa48("3987") ? {} : (stryCov_9fa48("3987"), {
            enabled: stryMutAct_9fa48("3988") ? false : (stryCov_9fa48("3988"), true),
            strategy: this.strategy,
            ...this.adapter.getStats()
          });
        }
      }
      return stryMutAct_9fa48("3989") ? {} : (stryCov_9fa48("3989"), {
        enabled: stryMutAct_9fa48("3990") ? false : (stryCov_9fa48("3990"), true),
        strategy: this.strategy
      });
    }
  }

  /**
   * Fecha conexões (chamado no graceful shutdown)
   */
  static async close(): Promise<void> {
    if (stryMutAct_9fa48("3991")) {
      {}
    } else {
      stryCov_9fa48("3991");
      if (stryMutAct_9fa48("3994") ? false : stryMutAct_9fa48("3993") ? true : stryMutAct_9fa48("3992") ? this.adapter : (stryCov_9fa48("3992", "3993", "3994"), !this.adapter)) {
        if (stryMutAct_9fa48("3995")) {
          {}
        } else {
          stryCov_9fa48("3995");
          return;
        }
      }
      try {
        if (stryMutAct_9fa48("3996")) {
          {}
        } else {
          stryCov_9fa48("3996");
          await this.adapter.close();
          log.info(stryMutAct_9fa48("3997") ? "" : (stryCov_9fa48("3997"), 'Cache fechado'));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3998")) {
          {}
        } else {
          stryCov_9fa48("3998");
          log.error(stryMutAct_9fa48("3999") ? "" : (stryCov_9fa48("3999"), 'Cache CLOSE error'), stryMutAct_9fa48("4000") ? {} : (stryCov_9fa48("4000"), {
            error
          }));
        }
      }
    }
  }
}

/**
 * Gera chave de cache consistente
 */
export function generateCacheKey(...parts: (string | number)[]): string {
  if (stryMutAct_9fa48("4001")) {
    {}
  } else {
    stryCov_9fa48("4001");
    return stryMutAct_9fa48("4002") ? parts.join(':') : (stryCov_9fa48("4002"), parts.filter(stryMutAct_9fa48("4003") ? () => undefined : (stryCov_9fa48("4003"), p => stryMutAct_9fa48("4006") ? p !== undefined || p !== null : stryMutAct_9fa48("4005") ? false : stryMutAct_9fa48("4004") ? true : (stryCov_9fa48("4004", "4005", "4006"), (stryMutAct_9fa48("4008") ? p === undefined : stryMutAct_9fa48("4007") ? true : (stryCov_9fa48("4007", "4008"), p !== undefined)) && (stryMutAct_9fa48("4010") ? p === null : stryMutAct_9fa48("4009") ? true : (stryCov_9fa48("4009", "4010"), p !== null))))).join(stryMutAct_9fa48("4011") ? "" : (stryCov_9fa48("4011"), ':')));
  }
}

/**
 * Decorator para cachear métodos de classe
 * @example
 * class MyService {
 *   @Cacheable({ ttl: 600, keyPrefix: 'service' })
 *   async getData(id: string) { ... }
 * }
 */
export function Cacheable(options: {
  ttl?: number;
  keyPrefix?: string;
} = {}) {
  if (stryMutAct_9fa48("4012")) {
    {}
  } else {
    stryCov_9fa48("4012");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (stryMutAct_9fa48("4013")) {
        {}
      } else {
        stryCov_9fa48("4013");
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
          if (stryMutAct_9fa48("4014")) {
            {}
          } else {
            stryCov_9fa48("4014");
            const keyPrefix = stryMutAct_9fa48("4017") ? options.keyPrefix && target.constructor.name : stryMutAct_9fa48("4016") ? false : stryMutAct_9fa48("4015") ? true : (stryCov_9fa48("4015", "4016", "4017"), options.keyPrefix || target.constructor.name);
            const cacheKey = generateCacheKey(keyPrefix, propertyKey, ...args);
            return CacheManager.getOrSet(cacheKey, stryMutAct_9fa48("4018") ? () => undefined : (stryCov_9fa48("4018"), () => originalMethod.apply(this, args)), options.ttl);
          }
        };
        return descriptor;
      }
    };
  }
}