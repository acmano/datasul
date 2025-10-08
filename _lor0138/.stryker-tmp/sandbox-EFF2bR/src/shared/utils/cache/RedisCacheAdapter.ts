// @ts-nocheck
// src/shared/utils/cache/RedisCacheAdapter.ts
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
import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de cache Redis (L2)
 * - Compartilhado entre múltiplas instâncias
 * - Persistente (sobrevive a restarts)
 * - Um pouco mais lento que memória (rede)
 */
export class RedisCacheAdapter implements CacheAdapter {
  private redis: Redis;
  private name: string;
  private ready: boolean = stryMutAct_9fa48("3676") ? true : (stryCov_9fa48("3676"), false);
  constructor(urlOrOptions: string | RedisOptions, name: string = stryMutAct_9fa48("3677") ? "" : (stryCov_9fa48("3677"), 'L2-Redis')) {
    if (stryMutAct_9fa48("3678")) {
      {}
    } else {
      stryCov_9fa48("3678");
      this.name = name;

      // Aceita URL ou objeto de configuração
      if (stryMutAct_9fa48("3681") ? typeof urlOrOptions !== 'string' : stryMutAct_9fa48("3680") ? false : stryMutAct_9fa48("3679") ? true : (stryCov_9fa48("3679", "3680", "3681"), typeof urlOrOptions === (stryMutAct_9fa48("3682") ? "" : (stryCov_9fa48("3682"), 'string')))) {
        if (stryMutAct_9fa48("3683")) {
          {}
        } else {
          stryCov_9fa48("3683");
          this.redis = new Redis(urlOrOptions, stryMutAct_9fa48("3684") ? {} : (stryCov_9fa48("3684"), {
            retryStrategy: times => {
              if (stryMutAct_9fa48("3685")) {
                {}
              } else {
                stryCov_9fa48("3685");
                const delay = stryMutAct_9fa48("3686") ? Math.max(times * 50, 2000) : (stryCov_9fa48("3686"), Math.min(stryMutAct_9fa48("3687") ? times / 50 : (stryCov_9fa48("3687"), times * 50), 2000));
                log.warn(stryMutAct_9fa48("3688") ? `` : (stryCov_9fa48("3688"), `${this.name} reconectando...`), stryMutAct_9fa48("3689") ? {} : (stryCov_9fa48("3689"), {
                  attempt: times,
                  delay
                }));
                return delay;
              }
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: stryMutAct_9fa48("3690") ? false : (stryCov_9fa48("3690"), true),
            lazyConnect: stryMutAct_9fa48("3691") ? true : (stryCov_9fa48("3691"), false)
          }));
        }
      } else {
        if (stryMutAct_9fa48("3692")) {
          {}
        } else {
          stryCov_9fa48("3692");
          this.redis = new Redis(urlOrOptions);
        }
      }
      this.setupEventHandlers();
    }
  }
  private setupEventHandlers(): void {
    if (stryMutAct_9fa48("3693")) {
      {}
    } else {
      stryCov_9fa48("3693");
      this.redis.on(stryMutAct_9fa48("3694") ? "" : (stryCov_9fa48("3694"), 'connect'), () => {
        if (stryMutAct_9fa48("3695")) {
          {}
        } else {
          stryCov_9fa48("3695");
          log.info(stryMutAct_9fa48("3696") ? `` : (stryCov_9fa48("3696"), `${this.name} conectando...`));
        }
      });
      this.redis.on(stryMutAct_9fa48("3697") ? "" : (stryCov_9fa48("3697"), 'ready'), () => {
        if (stryMutAct_9fa48("3698")) {
          {}
        } else {
          stryCov_9fa48("3698");
          this.ready = stryMutAct_9fa48("3699") ? false : (stryCov_9fa48("3699"), true);
          log.info(stryMutAct_9fa48("3700") ? `` : (stryCov_9fa48("3700"), `${this.name} pronto`), stryMutAct_9fa48("3701") ? {} : (stryCov_9fa48("3701"), {
            host: this.redis.options.host,
            port: this.redis.options.port
          }));
        }
      });
      this.redis.on(stryMutAct_9fa48("3702") ? "" : (stryCov_9fa48("3702"), 'error'), error => {
        if (stryMutAct_9fa48("3703")) {
          {}
        } else {
          stryCov_9fa48("3703");
          log.error(stryMutAct_9fa48("3704") ? `` : (stryCov_9fa48("3704"), `${this.name} erro`), stryMutAct_9fa48("3705") ? {} : (stryCov_9fa48("3705"), {
            error: error.message
          }));
        }
      });
      this.redis.on(stryMutAct_9fa48("3706") ? "" : (stryCov_9fa48("3706"), 'close'), () => {
        if (stryMutAct_9fa48("3707")) {
          {}
        } else {
          stryCov_9fa48("3707");
          this.ready = stryMutAct_9fa48("3708") ? true : (stryCov_9fa48("3708"), false);
          log.warn(stryMutAct_9fa48("3709") ? `` : (stryCov_9fa48("3709"), `${this.name} conexão fechada`));
        }
      });
      this.redis.on(stryMutAct_9fa48("3710") ? "" : (stryCov_9fa48("3710"), 'reconnecting'), () => {
        if (stryMutAct_9fa48("3711")) {
          {}
        } else {
          stryCov_9fa48("3711");
          log.info(stryMutAct_9fa48("3712") ? `` : (stryCov_9fa48("3712"), `${this.name} reconectando...`));
        }
      });
    }
  }
  async get<T>(key: string): Promise<T | undefined> {
    if (stryMutAct_9fa48("3713")) {
      {}
    } else {
      stryCov_9fa48("3713");
      try {
        if (stryMutAct_9fa48("3714")) {
          {}
        } else {
          stryCov_9fa48("3714");
          if (stryMutAct_9fa48("3717") ? false : stryMutAct_9fa48("3716") ? true : stryMutAct_9fa48("3715") ? this.ready : (stryCov_9fa48("3715", "3716", "3717"), !this.ready)) {
            if (stryMutAct_9fa48("3718")) {
              {}
            } else {
              stryCov_9fa48("3718");
              log.warn(stryMutAct_9fa48("3719") ? `` : (stryCov_9fa48("3719"), `${this.name} não está pronto`), stryMutAct_9fa48("3720") ? {} : (stryCov_9fa48("3720"), {
                key
              }));
              return undefined;
            }
          }
          const value = await this.redis.get(key);
          if (stryMutAct_9fa48("3722") ? false : stryMutAct_9fa48("3721") ? true : (stryCov_9fa48("3721", "3722"), value)) {
            if (stryMutAct_9fa48("3723")) {
              {}
            } else {
              stryCov_9fa48("3723");
              log.debug(stryMutAct_9fa48("3724") ? `` : (stryCov_9fa48("3724"), `${this.name} HIT`), stryMutAct_9fa48("3725") ? {} : (stryCov_9fa48("3725"), {
                key
              }));
              return JSON.parse(value) as T;
            }
          }
          log.debug(stryMutAct_9fa48("3726") ? `` : (stryCov_9fa48("3726"), `${this.name} MISS`), stryMutAct_9fa48("3727") ? {} : (stryCov_9fa48("3727"), {
            key
          }));
          return undefined;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3728")) {
          {}
        } else {
          stryCov_9fa48("3728");
          log.error(stryMutAct_9fa48("3729") ? `` : (stryCov_9fa48("3729"), `${this.name} GET error`), stryMutAct_9fa48("3730") ? {} : (stryCov_9fa48("3730"), {
            key,
            error
          }));
          return undefined;
        }
      }
    }
  }
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (stryMutAct_9fa48("3731")) {
      {}
    } else {
      stryCov_9fa48("3731");
      try {
        if (stryMutAct_9fa48("3732")) {
          {}
        } else {
          stryCov_9fa48("3732");
          if (stryMutAct_9fa48("3735") ? false : stryMutAct_9fa48("3734") ? true : stryMutAct_9fa48("3733") ? this.ready : (stryCov_9fa48("3733", "3734", "3735"), !this.ready)) {
            if (stryMutAct_9fa48("3736")) {
              {}
            } else {
              stryCov_9fa48("3736");
              log.warn(stryMutAct_9fa48("3737") ? `` : (stryCov_9fa48("3737"), `${this.name} não está pronto`), stryMutAct_9fa48("3738") ? {} : (stryCov_9fa48("3738"), {
                key
              }));
              return stryMutAct_9fa48("3739") ? true : (stryCov_9fa48("3739"), false);
            }
          }
          const serialized = JSON.stringify(value);
          if (stryMutAct_9fa48("3742") ? ttl || ttl > 0 : stryMutAct_9fa48("3741") ? false : stryMutAct_9fa48("3740") ? true : (stryCov_9fa48("3740", "3741", "3742"), ttl && (stryMutAct_9fa48("3745") ? ttl <= 0 : stryMutAct_9fa48("3744") ? ttl >= 0 : stryMutAct_9fa48("3743") ? true : (stryCov_9fa48("3743", "3744", "3745"), ttl > 0)))) {
            if (stryMutAct_9fa48("3746")) {
              {}
            } else {
              stryCov_9fa48("3746");
              // SETEX: Set com expiração
              await this.redis.setex(key, ttl, serialized);
            }
          } else {
            if (stryMutAct_9fa48("3747")) {
              {}
            } else {
              stryCov_9fa48("3747");
              // SET: Sem expiração
              await this.redis.set(key, serialized);
            }
          }
          log.debug(stryMutAct_9fa48("3748") ? `` : (stryCov_9fa48("3748"), `${this.name} SET`), stryMutAct_9fa48("3749") ? {} : (stryCov_9fa48("3749"), {
            key,
            ttl
          }));
          return stryMutAct_9fa48("3750") ? false : (stryCov_9fa48("3750"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3751")) {
          {}
        } else {
          stryCov_9fa48("3751");
          log.error(stryMutAct_9fa48("3752") ? `` : (stryCov_9fa48("3752"), `${this.name} SET error`), stryMutAct_9fa48("3753") ? {} : (stryCov_9fa48("3753"), {
            key,
            error
          }));
          return stryMutAct_9fa48("3754") ? true : (stryCov_9fa48("3754"), false);
        }
      }
    }
  }
  async delete(key: string): Promise<number> {
    if (stryMutAct_9fa48("3755")) {
      {}
    } else {
      stryCov_9fa48("3755");
      try {
        if (stryMutAct_9fa48("3756")) {
          {}
        } else {
          stryCov_9fa48("3756");
          if (stryMutAct_9fa48("3759") ? false : stryMutAct_9fa48("3758") ? true : stryMutAct_9fa48("3757") ? this.ready : (stryCov_9fa48("3757", "3758", "3759"), !this.ready)) {
            if (stryMutAct_9fa48("3760")) {
              {}
            } else {
              stryCov_9fa48("3760");
              log.warn(stryMutAct_9fa48("3761") ? `` : (stryCov_9fa48("3761"), `${this.name} não está pronto`), stryMutAct_9fa48("3762") ? {} : (stryCov_9fa48("3762"), {
                key
              }));
              return 0;
            }
          }
          const deleted = await this.redis.del(key);
          log.debug(stryMutAct_9fa48("3763") ? `` : (stryCov_9fa48("3763"), `${this.name} DELETE`), stryMutAct_9fa48("3764") ? {} : (stryCov_9fa48("3764"), {
            key,
            deleted
          }));
          return deleted;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3765")) {
          {}
        } else {
          stryCov_9fa48("3765");
          log.error(stryMutAct_9fa48("3766") ? `` : (stryCov_9fa48("3766"), `${this.name} DELETE error`), stryMutAct_9fa48("3767") ? {} : (stryCov_9fa48("3767"), {
            key,
            error
          }));
          return 0;
        }
      }
    }
  }
  async flush(): Promise<void> {
    if (stryMutAct_9fa48("3768")) {
      {}
    } else {
      stryCov_9fa48("3768");
      try {
        if (stryMutAct_9fa48("3769")) {
          {}
        } else {
          stryCov_9fa48("3769");
          if (stryMutAct_9fa48("3772") ? false : stryMutAct_9fa48("3771") ? true : stryMutAct_9fa48("3770") ? this.ready : (stryCov_9fa48("3770", "3771", "3772"), !this.ready)) {
            if (stryMutAct_9fa48("3773")) {
              {}
            } else {
              stryCov_9fa48("3773");
              log.warn(stryMutAct_9fa48("3774") ? `` : (stryCov_9fa48("3774"), `${this.name} não está pronto`));
              return;
            }
          }
          await this.redis.flushall();
          log.info(stryMutAct_9fa48("3775") ? `` : (stryCov_9fa48("3775"), `${this.name} FLUSH ALL`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3776")) {
          {}
        } else {
          stryCov_9fa48("3776");
          log.error(stryMutAct_9fa48("3777") ? `` : (stryCov_9fa48("3777"), `${this.name} FLUSH error`), stryMutAct_9fa48("3778") ? {} : (stryCov_9fa48("3778"), {
            error
          }));
        }
      }
    }
  }
  async keys(pattern: string = stryMutAct_9fa48("3779") ? "" : (stryCov_9fa48("3779"), '*')): Promise<string[]> {
    if (stryMutAct_9fa48("3780")) {
      {}
    } else {
      stryCov_9fa48("3780");
      try {
        if (stryMutAct_9fa48("3781")) {
          {}
        } else {
          stryCov_9fa48("3781");
          if (stryMutAct_9fa48("3784") ? false : stryMutAct_9fa48("3783") ? true : stryMutAct_9fa48("3782") ? this.ready : (stryCov_9fa48("3782", "3783", "3784"), !this.ready)) {
            if (stryMutAct_9fa48("3785")) {
              {}
            } else {
              stryCov_9fa48("3785");
              log.warn(stryMutAct_9fa48("3786") ? `` : (stryCov_9fa48("3786"), `${this.name} não está pronto`));
              return stryMutAct_9fa48("3787") ? ["Stryker was here"] : (stryCov_9fa48("3787"), []);
            }
          }

          // SCAN é mais seguro que KEYS em produção
          const keys: string[] = stryMutAct_9fa48("3788") ? ["Stryker was here"] : (stryCov_9fa48("3788"), []);
          let cursor = stryMutAct_9fa48("3789") ? "" : (stryCov_9fa48("3789"), '0');
          do {
            if (stryMutAct_9fa48("3790")) {
              {}
            } else {
              stryCov_9fa48("3790");
              const [nextCursor, foundKeys] = await this.redis.scan(cursor, stryMutAct_9fa48("3791") ? "" : (stryCov_9fa48("3791"), 'MATCH'), pattern, stryMutAct_9fa48("3792") ? "" : (stryCov_9fa48("3792"), 'COUNT'), 100);
              cursor = nextCursor;
              keys.push(...foundKeys);
            }
          } while (stryMutAct_9fa48("3794") ? cursor === '0' : stryMutAct_9fa48("3793") ? false : (stryCov_9fa48("3793", "3794"), cursor !== (stryMutAct_9fa48("3795") ? "" : (stryCov_9fa48("3795"), '0'))));
          return keys;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3796")) {
          {}
        } else {
          stryCov_9fa48("3796");
          log.error(stryMutAct_9fa48("3797") ? `` : (stryCov_9fa48("3797"), `${this.name} KEYS error`), stryMutAct_9fa48("3798") ? {} : (stryCov_9fa48("3798"), {
            pattern,
            error
          }));
          return stryMutAct_9fa48("3799") ? ["Stryker was here"] : (stryCov_9fa48("3799"), []);
        }
      }
    }
  }
  async isReady(): Promise<boolean> {
    if (stryMutAct_9fa48("3800")) {
      {}
    } else {
      stryCov_9fa48("3800");
      return this.ready;
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("3801")) {
      {}
    } else {
      stryCov_9fa48("3801");
      try {
        if (stryMutAct_9fa48("3802")) {
          {}
        } else {
          stryCov_9fa48("3802");
          await this.redis.quit();
          this.ready = stryMutAct_9fa48("3803") ? true : (stryCov_9fa48("3803"), false);
          log.info(stryMutAct_9fa48("3804") ? `` : (stryCov_9fa48("3804"), `${this.name} fechado`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3805")) {
          {}
        } else {
          stryCov_9fa48("3805");
          log.error(stryMutAct_9fa48("3806") ? `` : (stryCov_9fa48("3806"), `${this.name} CLOSE error`), stryMutAct_9fa48("3807") ? {} : (stryCov_9fa48("3807"), {
            error
          }));
        }
      }
    }
  }

  /**
   * Métodos extras específicos do Redis
   */
  async ping(): Promise<string> {
    if (stryMutAct_9fa48("3808")) {
      {}
    } else {
      stryCov_9fa48("3808");
      return this.redis.ping();
    }
  }
  async info(): Promise<string> {
    if (stryMutAct_9fa48("3809")) {
      {}
    } else {
      stryCov_9fa48("3809");
      return this.redis.info();
    }
  }
  getClient(): Redis {
    if (stryMutAct_9fa48("3810")) {
      {}
    } else {
      stryCov_9fa48("3810");
      return this.redis;
    }
  }
}