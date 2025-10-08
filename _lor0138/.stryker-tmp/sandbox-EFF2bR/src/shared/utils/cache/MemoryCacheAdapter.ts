// @ts-nocheck
// src/shared/utils/cache/MemoryCacheAdapter.ts
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
import NodeCache from 'node-cache';
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de cache em memória (L1)
 * - Ultra rápido (acesso local)
 * - Volátil (perde dados ao reiniciar)
 * - Não compartilhado entre instâncias
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: NodeCache;
  private name: string;
  constructor(stdTTL: number = 300, name: string = stryMutAct_9fa48("3531") ? "" : (stryCov_9fa48("3531"), 'L1-Memory')) {
    if (stryMutAct_9fa48("3532")) {
      {}
    } else {
      stryCov_9fa48("3532");
      this.cache = new NodeCache(stryMutAct_9fa48("3533") ? {} : (stryCov_9fa48("3533"), {
        stdTTL,
        checkperiod: 120,
        // Verifica expiração a cada 2min
        useClones: stryMutAct_9fa48("3534") ? true : (stryCov_9fa48("3534"), false) // Performance: não clona objetos
      }));
      this.name = name;
      log.info(stryMutAct_9fa48("3535") ? `` : (stryCov_9fa48("3535"), `${this.name} cache inicializado`), stryMutAct_9fa48("3536") ? {} : (stryCov_9fa48("3536"), {
        ttl: stdTTL,
        checkPeriod: 120
      }));
    }
  }
  async get<T>(key: string): Promise<T | undefined> {
    if (stryMutAct_9fa48("3537")) {
      {}
    } else {
      stryCov_9fa48("3537");
      try {
        if (stryMutAct_9fa48("3538")) {
          {}
        } else {
          stryCov_9fa48("3538");
          const value = this.cache.get<T>(key);
          if (stryMutAct_9fa48("3541") ? value === undefined : stryMutAct_9fa48("3540") ? false : stryMutAct_9fa48("3539") ? true : (stryCov_9fa48("3539", "3540", "3541"), value !== undefined)) {
            if (stryMutAct_9fa48("3542")) {
              {}
            } else {
              stryCov_9fa48("3542");
              log.debug(stryMutAct_9fa48("3543") ? `` : (stryCov_9fa48("3543"), `${this.name} HIT`), stryMutAct_9fa48("3544") ? {} : (stryCov_9fa48("3544"), {
                key
              }));
            }
          } else {
            if (stryMutAct_9fa48("3545")) {
              {}
            } else {
              stryCov_9fa48("3545");
              log.debug(stryMutAct_9fa48("3546") ? `` : (stryCov_9fa48("3546"), `${this.name} MISS`), stryMutAct_9fa48("3547") ? {} : (stryCov_9fa48("3547"), {
                key
              }));
            }
          }
          return value;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3548")) {
          {}
        } else {
          stryCov_9fa48("3548");
          log.error(stryMutAct_9fa48("3549") ? `` : (stryCov_9fa48("3549"), `${this.name} GET error`), stryMutAct_9fa48("3550") ? {} : (stryCov_9fa48("3550"), {
            key,
            error
          }));
          return undefined;
        }
      }
    }
  }
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (stryMutAct_9fa48("3551")) {
      {}
    } else {
      stryCov_9fa48("3551");
      try {
        if (stryMutAct_9fa48("3552")) {
          {}
        } else {
          stryCov_9fa48("3552");
          const success = ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
          if (stryMutAct_9fa48("3554") ? false : stryMutAct_9fa48("3553") ? true : (stryCov_9fa48("3553", "3554"), success)) {
            if (stryMutAct_9fa48("3555")) {
              {}
            } else {
              stryCov_9fa48("3555");
              log.debug(stryMutAct_9fa48("3556") ? `` : (stryCov_9fa48("3556"), `${this.name} SET`), stryMutAct_9fa48("3557") ? {} : (stryCov_9fa48("3557"), {
                key,
                ttl
              }));
            }
          }
          return success;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3558")) {
          {}
        } else {
          stryCov_9fa48("3558");
          log.error(stryMutAct_9fa48("3559") ? `` : (stryCov_9fa48("3559"), `${this.name} SET error`), stryMutAct_9fa48("3560") ? {} : (stryCov_9fa48("3560"), {
            key,
            error
          }));
          return stryMutAct_9fa48("3561") ? true : (stryCov_9fa48("3561"), false);
        }
      }
    }
  }
  async delete(key: string): Promise<number> {
    if (stryMutAct_9fa48("3562")) {
      {}
    } else {
      stryCov_9fa48("3562");
      try {
        if (stryMutAct_9fa48("3563")) {
          {}
        } else {
          stryCov_9fa48("3563");
          const deleted = this.cache.del(key);
          log.debug(stryMutAct_9fa48("3564") ? `` : (stryCov_9fa48("3564"), `${this.name} DELETE`), stryMutAct_9fa48("3565") ? {} : (stryCov_9fa48("3565"), {
            key,
            deleted
          }));
          return deleted;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3566")) {
          {}
        } else {
          stryCov_9fa48("3566");
          log.error(stryMutAct_9fa48("3567") ? `` : (stryCov_9fa48("3567"), `${this.name} DELETE error`), stryMutAct_9fa48("3568") ? {} : (stryCov_9fa48("3568"), {
            key,
            error
          }));
          return 0;
        }
      }
    }
  }
  async flush(): Promise<void> {
    if (stryMutAct_9fa48("3569")) {
      {}
    } else {
      stryCov_9fa48("3569");
      try {
        if (stryMutAct_9fa48("3570")) {
          {}
        } else {
          stryCov_9fa48("3570");
          this.cache.flushAll();
          log.info(stryMutAct_9fa48("3571") ? `` : (stryCov_9fa48("3571"), `${this.name} FLUSH ALL`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3572")) {
          {}
        } else {
          stryCov_9fa48("3572");
          log.error(stryMutAct_9fa48("3573") ? `` : (stryCov_9fa48("3573"), `${this.name} FLUSH error`), stryMutAct_9fa48("3574") ? {} : (stryCov_9fa48("3574"), {
            error
          }));
        }
      }
    }
  }
  async keys(pattern?: string): Promise<string[]> {
    if (stryMutAct_9fa48("3575")) {
      {}
    } else {
      stryCov_9fa48("3575");
      try {
        if (stryMutAct_9fa48("3576")) {
          {}
        } else {
          stryCov_9fa48("3576");
          const allKeys = this.cache.keys();
          if (stryMutAct_9fa48("3579") ? false : stryMutAct_9fa48("3578") ? true : stryMutAct_9fa48("3577") ? pattern : (stryCov_9fa48("3577", "3578", "3579"), !pattern)) {
            if (stryMutAct_9fa48("3580")) {
              {}
            } else {
              stryCov_9fa48("3580");
              return allKeys;
            }
          }

          // Converte pattern com * para regex
          const regex = new RegExp((stryMutAct_9fa48("3581") ? "" : (stryCov_9fa48("3581"), '^')) + pattern.replace(/\*/g, stryMutAct_9fa48("3582") ? "" : (stryCov_9fa48("3582"), '.*')) + (stryMutAct_9fa48("3583") ? "" : (stryCov_9fa48("3583"), '$')));
          return stryMutAct_9fa48("3584") ? allKeys : (stryCov_9fa48("3584"), allKeys.filter(stryMutAct_9fa48("3585") ? () => undefined : (stryCov_9fa48("3585"), key => regex.test(key))));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3586")) {
          {}
        } else {
          stryCov_9fa48("3586");
          log.error(stryMutAct_9fa48("3587") ? `` : (stryCov_9fa48("3587"), `${this.name} KEYS error`), stryMutAct_9fa48("3588") ? {} : (stryCov_9fa48("3588"), {
            pattern,
            error
          }));
          return stryMutAct_9fa48("3589") ? ["Stryker was here"] : (stryCov_9fa48("3589"), []);
        }
      }
    }
  }
  async isReady(): Promise<boolean> {
    if (stryMutAct_9fa48("3590")) {
      {}
    } else {
      stryCov_9fa48("3590");
      return stryMutAct_9fa48("3591") ? false : (stryCov_9fa48("3591"), true); // Memória sempre está pronta
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("3592")) {
      {}
    } else {
      stryCov_9fa48("3592");
      try {
        if (stryMutAct_9fa48("3593")) {
          {}
        } else {
          stryCov_9fa48("3593");
          this.cache.close();
          log.info(stryMutAct_9fa48("3594") ? `` : (stryCov_9fa48("3594"), `${this.name} fechado`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3595")) {
          {}
        } else {
          stryCov_9fa48("3595");
          log.error(stryMutAct_9fa48("3596") ? `` : (stryCov_9fa48("3596"), `${this.name} CLOSE error`), stryMutAct_9fa48("3597") ? {} : (stryCov_9fa48("3597"), {
            error
          }));
        }
      }
    }
  }

  /**
   * Métodos extras específicos do NodeCache
   */
  getStats() {
    if (stryMutAct_9fa48("3598")) {
      {}
    } else {
      stryCov_9fa48("3598");
      return this.cache.getStats();
    }
  }
  getTtl(key: string): number | undefined {
    if (stryMutAct_9fa48("3599")) {
      {}
    } else {
      stryCov_9fa48("3599");
      return this.cache.getTtl(key);
    }
  }
}