// @ts-nocheck
// src/shared/utils/cache/LayeredCacheAdapter.ts
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
import { CacheAdapter } from './CacheAdapter';
import { log } from '../logger';

/**
 * Adaptador de cache em camadas (L1 + L2)
 * 
 * Estratégia:
 * 1. GET: Busca L1 → L2 → Banco (promove L2→L1 em hit)
 * 2. SET: Armazena L1 + L2 simultaneamente
 * 3. DELETE: Remove de L1 + L2
 * 
 * Benefícios:
 * - Performance máxima (L1 memória)
 * - Compartilhamento entre servidores (L2 Redis)
 * - Redundância (fallback L1↔L2)
 */
export class LayeredCacheAdapter implements CacheAdapter {
  private l1: CacheAdapter; // Memória (rápido, local)
  private l2: CacheAdapter; // Redis (compartilhado, persistente)
  private name: string;

  // Estatísticas
  private stats = stryMutAct_9fa48("3363") ? {} : (stryCov_9fa48("3363"), {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalHits: 0,
    totalMisses: 0
  });
  constructor(l1: CacheAdapter, l2: CacheAdapter, name: string = stryMutAct_9fa48("3364") ? "" : (stryCov_9fa48("3364"), 'Layered')) {
    if (stryMutAct_9fa48("3365")) {
      {}
    } else {
      stryCov_9fa48("3365");
      this.l1 = l1;
      this.l2 = l2;
      this.name = name;
      log.info(stryMutAct_9fa48("3366") ? `` : (stryCov_9fa48("3366"), `${this.name} cache inicializado (L1 + L2)`));
    }
  }
  async get<T>(key: string): Promise<T | undefined> {
    if (stryMutAct_9fa48("3367")) {
      {}
    } else {
      stryCov_9fa48("3367");
      try {
        if (stryMutAct_9fa48("3368")) {
          {}
        } else {
          stryCov_9fa48("3368");
          // 1️⃣ Tenta L1 (memória)
          const l1Value = await this.l1.get<T>(key);
          if (stryMutAct_9fa48("3371") ? l1Value === undefined : stryMutAct_9fa48("3370") ? false : stryMutAct_9fa48("3369") ? true : (stryCov_9fa48("3369", "3370", "3371"), l1Value !== undefined)) {
            if (stryMutAct_9fa48("3372")) {
              {}
            } else {
              stryCov_9fa48("3372");
              stryMutAct_9fa48("3373") ? this.stats.l1Hits-- : (stryCov_9fa48("3373"), this.stats.l1Hits++);
              stryMutAct_9fa48("3374") ? this.stats.totalHits-- : (stryCov_9fa48("3374"), this.stats.totalHits++);
              log.debug(stryMutAct_9fa48("3375") ? `` : (stryCov_9fa48("3375"), `${this.name} L1 HIT`), stryMutAct_9fa48("3376") ? {} : (stryCov_9fa48("3376"), {
                key
              }));
              return l1Value;
            }
          }
          stryMutAct_9fa48("3377") ? this.stats.l1Misses-- : (stryCov_9fa48("3377"), this.stats.l1Misses++);

          // 2️⃣ Tenta L2 (Redis)
          const l2Value = await this.l2.get<T>(key);
          if (stryMutAct_9fa48("3380") ? l2Value === undefined : stryMutAct_9fa48("3379") ? false : stryMutAct_9fa48("3378") ? true : (stryCov_9fa48("3378", "3379", "3380"), l2Value !== undefined)) {
            if (stryMutAct_9fa48("3381")) {
              {}
            } else {
              stryCov_9fa48("3381");
              stryMutAct_9fa48("3382") ? this.stats.l2Hits-- : (stryCov_9fa48("3382"), this.stats.l2Hits++);
              stryMutAct_9fa48("3383") ? this.stats.totalHits-- : (stryCov_9fa48("3383"), this.stats.totalHits++);
              log.debug(stryMutAct_9fa48("3384") ? `` : (stryCov_9fa48("3384"), `${this.name} L2 HIT`), stryMutAct_9fa48("3385") ? {} : (stryCov_9fa48("3385"), {
                key
              }));

              // 🔼 PROMOVE para L1 (próxima leitura será mais rápida)
              await this.l1.set(key, l2Value).catch(err => {
                if (stryMutAct_9fa48("3386")) {
                  {}
                } else {
                  stryCov_9fa48("3386");
                  log.warn(stryMutAct_9fa48("3387") ? `` : (stryCov_9fa48("3387"), `${this.name} falha ao promover para L1`), stryMutAct_9fa48("3388") ? {} : (stryCov_9fa48("3388"), {
                    key,
                    error: err
                  }));
                }
              });
              return l2Value;
            }
          }
          stryMutAct_9fa48("3389") ? this.stats.l2Misses-- : (stryCov_9fa48("3389"), this.stats.l2Misses++);
          stryMutAct_9fa48("3390") ? this.stats.totalMisses-- : (stryCov_9fa48("3390"), this.stats.totalMisses++);
          log.debug(stryMutAct_9fa48("3391") ? `` : (stryCov_9fa48("3391"), `${this.name} MISS (L1 e L2)`), stryMutAct_9fa48("3392") ? {} : (stryCov_9fa48("3392"), {
            key
          }));
          return undefined;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3393")) {
          {}
        } else {
          stryCov_9fa48("3393");
          log.error(stryMutAct_9fa48("3394") ? `` : (stryCov_9fa48("3394"), `${this.name} GET error`), stryMutAct_9fa48("3395") ? {} : (stryCov_9fa48("3395"), {
            key,
            error
          }));
          return undefined;
        }
      }
    }
  }
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (stryMutAct_9fa48("3396")) {
      {}
    } else {
      stryCov_9fa48("3396");
      try {
        if (stryMutAct_9fa48("3397")) {
          {}
        } else {
          stryCov_9fa48("3397");
          // Armazena em AMBAS as camadas simultaneamente
          const [l1Success, l2Success] = await Promise.allSettled(stryMutAct_9fa48("3398") ? [] : (stryCov_9fa48("3398"), [this.l1.set(key, value, ttl), this.l2.set(key, value, ttl)]));
          const l1Ok = stryMutAct_9fa48("3401") ? l1Success.status === 'fulfilled' || l1Success.value : stryMutAct_9fa48("3400") ? false : stryMutAct_9fa48("3399") ? true : (stryCov_9fa48("3399", "3400", "3401"), (stryMutAct_9fa48("3403") ? l1Success.status !== 'fulfilled' : stryMutAct_9fa48("3402") ? true : (stryCov_9fa48("3402", "3403"), l1Success.status === (stryMutAct_9fa48("3404") ? "" : (stryCov_9fa48("3404"), 'fulfilled')))) && l1Success.value);
          const l2Ok = stryMutAct_9fa48("3407") ? l2Success.status === 'fulfilled' || l2Success.value : stryMutAct_9fa48("3406") ? false : stryMutAct_9fa48("3405") ? true : (stryCov_9fa48("3405", "3406", "3407"), (stryMutAct_9fa48("3409") ? l2Success.status !== 'fulfilled' : stryMutAct_9fa48("3408") ? true : (stryCov_9fa48("3408", "3409"), l2Success.status === (stryMutAct_9fa48("3410") ? "" : (stryCov_9fa48("3410"), 'fulfilled')))) && l2Success.value);
          if (stryMutAct_9fa48("3413") ? false : stryMutAct_9fa48("3412") ? true : stryMutAct_9fa48("3411") ? l1Ok : (stryCov_9fa48("3411", "3412", "3413"), !l1Ok)) {
            if (stryMutAct_9fa48("3414")) {
              {}
            } else {
              stryCov_9fa48("3414");
              log.warn(stryMutAct_9fa48("3415") ? `` : (stryCov_9fa48("3415"), `${this.name} falha L1 SET`), stryMutAct_9fa48("3416") ? {} : (stryCov_9fa48("3416"), {
                key
              }));
            }
          }
          if (stryMutAct_9fa48("3419") ? false : stryMutAct_9fa48("3418") ? true : stryMutAct_9fa48("3417") ? l2Ok : (stryCov_9fa48("3417", "3418", "3419"), !l2Ok)) {
            if (stryMutAct_9fa48("3420")) {
              {}
            } else {
              stryCov_9fa48("3420");
              log.warn(stryMutAct_9fa48("3421") ? `` : (stryCov_9fa48("3421"), `${this.name} falha L2 SET`), stryMutAct_9fa48("3422") ? {} : (stryCov_9fa48("3422"), {
                key
              }));
            }
          }
          log.debug(stryMutAct_9fa48("3423") ? `` : (stryCov_9fa48("3423"), `${this.name} SET`), stryMutAct_9fa48("3424") ? {} : (stryCov_9fa48("3424"), {
            key,
            ttl,
            l1: l1Ok ? stryMutAct_9fa48("3425") ? "" : (stryCov_9fa48("3425"), 'OK') : stryMutAct_9fa48("3426") ? "" : (stryCov_9fa48("3426"), 'FAIL'),
            l2: l2Ok ? stryMutAct_9fa48("3427") ? "" : (stryCov_9fa48("3427"), 'OK') : stryMutAct_9fa48("3428") ? "" : (stryCov_9fa48("3428"), 'FAIL')
          }));

          // Considera sucesso se pelo menos uma camada funcionou
          return stryMutAct_9fa48("3431") ? l1Ok && l2Ok : stryMutAct_9fa48("3430") ? false : stryMutAct_9fa48("3429") ? true : (stryCov_9fa48("3429", "3430", "3431"), l1Ok || l2Ok);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3432")) {
          {}
        } else {
          stryCov_9fa48("3432");
          log.error(stryMutAct_9fa48("3433") ? `` : (stryCov_9fa48("3433"), `${this.name} SET error`), stryMutAct_9fa48("3434") ? {} : (stryCov_9fa48("3434"), {
            key,
            error
          }));
          return stryMutAct_9fa48("3435") ? true : (stryCov_9fa48("3435"), false);
        }
      }
    }
  }
  async delete(key: string): Promise<number> {
    if (stryMutAct_9fa48("3436")) {
      {}
    } else {
      stryCov_9fa48("3436");
      try {
        if (stryMutAct_9fa48("3437")) {
          {}
        } else {
          stryCov_9fa48("3437");
          // Remove de AMBAS as camadas
          const [l1Deleted, l2Deleted] = await Promise.allSettled(stryMutAct_9fa48("3438") ? [] : (stryCov_9fa48("3438"), [this.l1.delete(key), this.l2.delete(key)]));
          const l1Count = (stryMutAct_9fa48("3441") ? l1Deleted.status !== 'fulfilled' : stryMutAct_9fa48("3440") ? false : stryMutAct_9fa48("3439") ? true : (stryCov_9fa48("3439", "3440", "3441"), l1Deleted.status === (stryMutAct_9fa48("3442") ? "" : (stryCov_9fa48("3442"), 'fulfilled')))) ? l1Deleted.value : 0;
          const l2Count = (stryMutAct_9fa48("3445") ? l2Deleted.status !== 'fulfilled' : stryMutAct_9fa48("3444") ? false : stryMutAct_9fa48("3443") ? true : (stryCov_9fa48("3443", "3444", "3445"), l2Deleted.status === (stryMutAct_9fa48("3446") ? "" : (stryCov_9fa48("3446"), 'fulfilled')))) ? l2Deleted.value : 0;
          const total = stryMutAct_9fa48("3447") ? l1Count - l2Count : (stryCov_9fa48("3447"), l1Count + l2Count);
          log.debug(stryMutAct_9fa48("3448") ? `` : (stryCov_9fa48("3448"), `${this.name} DELETE`), stryMutAct_9fa48("3449") ? {} : (stryCov_9fa48("3449"), {
            key,
            l1: l1Count,
            l2: l2Count,
            total
          }));
          return total;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3450")) {
          {}
        } else {
          stryCov_9fa48("3450");
          log.error(stryMutAct_9fa48("3451") ? `` : (stryCov_9fa48("3451"), `${this.name} DELETE error`), stryMutAct_9fa48("3452") ? {} : (stryCov_9fa48("3452"), {
            key,
            error
          }));
          return 0;
        }
      }
    }
  }
  async flush(): Promise<void> {
    if (stryMutAct_9fa48("3453")) {
      {}
    } else {
      stryCov_9fa48("3453");
      try {
        if (stryMutAct_9fa48("3454")) {
          {}
        } else {
          stryCov_9fa48("3454");
          // Limpa AMBAS as camadas
          await Promise.allSettled(stryMutAct_9fa48("3455") ? [] : (stryCov_9fa48("3455"), [this.l1.flush(), this.l2.flush()]));
          log.info(stryMutAct_9fa48("3456") ? `` : (stryCov_9fa48("3456"), `${this.name} FLUSH ALL (L1 + L2)`));

          // Reseta estatísticas
          this.stats = stryMutAct_9fa48("3457") ? {} : (stryCov_9fa48("3457"), {
            l1Hits: 0,
            l1Misses: 0,
            l2Hits: 0,
            l2Misses: 0,
            totalHits: 0,
            totalMisses: 0
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3458")) {
          {}
        } else {
          stryCov_9fa48("3458");
          log.error(stryMutAct_9fa48("3459") ? `` : (stryCov_9fa48("3459"), `${this.name} FLUSH error`), stryMutAct_9fa48("3460") ? {} : (stryCov_9fa48("3460"), {
            error
          }));
        }
      }
    }
  }
  async keys(pattern?: string): Promise<string[]> {
    if (stryMutAct_9fa48("3461")) {
      {}
    } else {
      stryCov_9fa48("3461");
      try {
        if (stryMutAct_9fa48("3462")) {
          {}
        } else {
          stryCov_9fa48("3462");
          // Retorna UNIÃO de L1 + L2 (sem duplicatas)
          const [l1Keys, l2Keys] = await Promise.allSettled(stryMutAct_9fa48("3463") ? [] : (stryCov_9fa48("3463"), [this.l1.keys(pattern), this.l2.keys(pattern)]));
          const l1List = (stryMutAct_9fa48("3466") ? l1Keys.status !== 'fulfilled' : stryMutAct_9fa48("3465") ? false : stryMutAct_9fa48("3464") ? true : (stryCov_9fa48("3464", "3465", "3466"), l1Keys.status === (stryMutAct_9fa48("3467") ? "" : (stryCov_9fa48("3467"), 'fulfilled')))) ? l1Keys.value : stryMutAct_9fa48("3468") ? ["Stryker was here"] : (stryCov_9fa48("3468"), []);
          const l2List = (stryMutAct_9fa48("3471") ? l2Keys.status !== 'fulfilled' : stryMutAct_9fa48("3470") ? false : stryMutAct_9fa48("3469") ? true : (stryCov_9fa48("3469", "3470", "3471"), l2Keys.status === (stryMutAct_9fa48("3472") ? "" : (stryCov_9fa48("3472"), 'fulfilled')))) ? l2Keys.value : stryMutAct_9fa48("3473") ? ["Stryker was here"] : (stryCov_9fa48("3473"), []);

          // Remove duplicatas
          const uniqueKeys = stryMutAct_9fa48("3474") ? [] : (stryCov_9fa48("3474"), [...new Set(stryMutAct_9fa48("3475") ? [] : (stryCov_9fa48("3475"), [...l1List, ...l2List]))]);
          log.debug(stryMutAct_9fa48("3476") ? `` : (stryCov_9fa48("3476"), `${this.name} KEYS`), stryMutAct_9fa48("3477") ? {} : (stryCov_9fa48("3477"), {
            pattern,
            l1: l1List.length,
            l2: l2List.length,
            total: uniqueKeys.length
          }));
          return uniqueKeys;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3478")) {
          {}
        } else {
          stryCov_9fa48("3478");
          log.error(stryMutAct_9fa48("3479") ? `` : (stryCov_9fa48("3479"), `${this.name} KEYS error`), stryMutAct_9fa48("3480") ? {} : (stryCov_9fa48("3480"), {
            pattern,
            error
          }));
          return stryMutAct_9fa48("3481") ? ["Stryker was here"] : (stryCov_9fa48("3481"), []);
        }
      }
    }
  }
  async isReady(): Promise<boolean> {
    if (stryMutAct_9fa48("3482")) {
      {}
    } else {
      stryCov_9fa48("3482");
      try {
        if (stryMutAct_9fa48("3483")) {
          {}
        } else {
          stryCov_9fa48("3483");
          const [l1Ready, l2Ready] = await Promise.all(stryMutAct_9fa48("3484") ? [] : (stryCov_9fa48("3484"), [this.l1.isReady(), this.l2.isReady()]));

          // Considera pronto se pelo menos L1 estiver OK
          return l1Ready;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3485")) {
          {}
        } else {
          stryCov_9fa48("3485");
          log.error(stryMutAct_9fa48("3486") ? `` : (stryCov_9fa48("3486"), `${this.name} isReady error`), stryMutAct_9fa48("3487") ? {} : (stryCov_9fa48("3487"), {
            error
          }));
          return stryMutAct_9fa48("3488") ? true : (stryCov_9fa48("3488"), false);
        }
      }
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("3489")) {
      {}
    } else {
      stryCov_9fa48("3489");
      try {
        if (stryMutAct_9fa48("3490")) {
          {}
        } else {
          stryCov_9fa48("3490");
          await Promise.allSettled(stryMutAct_9fa48("3491") ? [] : (stryCov_9fa48("3491"), [this.l1.close(), this.l2.close()]));
          log.info(stryMutAct_9fa48("3492") ? `` : (stryCov_9fa48("3492"), `${this.name} fechado (L1 + L2)`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("3493")) {
          {}
        } else {
          stryCov_9fa48("3493");
          log.error(stryMutAct_9fa48("3494") ? `` : (stryCov_9fa48("3494"), `${this.name} CLOSE error`), stryMutAct_9fa48("3495") ? {} : (stryCov_9fa48("3495"), {
            error
          }));
        }
      }
    }
  }

  /**
   * Retorna estatísticas do cache em camadas
   */
  getStats() {
    if (stryMutAct_9fa48("3496")) {
      {}
    } else {
      stryCov_9fa48("3496");
      const l1HitRate = (stryMutAct_9fa48("3500") ? this.stats.l1Hits + this.stats.l1Misses <= 0 : stryMutAct_9fa48("3499") ? this.stats.l1Hits + this.stats.l1Misses >= 0 : stryMutAct_9fa48("3498") ? false : stryMutAct_9fa48("3497") ? true : (stryCov_9fa48("3497", "3498", "3499", "3500"), (stryMutAct_9fa48("3501") ? this.stats.l1Hits - this.stats.l1Misses : (stryCov_9fa48("3501"), this.stats.l1Hits + this.stats.l1Misses)) > 0)) ? stryMutAct_9fa48("3502") ? this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses) / 100 : (stryCov_9fa48("3502"), (stryMutAct_9fa48("3503") ? this.stats.l1Hits * (this.stats.l1Hits + this.stats.l1Misses) : (stryCov_9fa48("3503"), this.stats.l1Hits / (stryMutAct_9fa48("3504") ? this.stats.l1Hits - this.stats.l1Misses : (stryCov_9fa48("3504"), this.stats.l1Hits + this.stats.l1Misses)))) * 100) : 0;
      const l2HitRate = (stryMutAct_9fa48("3508") ? this.stats.l2Hits + this.stats.l2Misses <= 0 : stryMutAct_9fa48("3507") ? this.stats.l2Hits + this.stats.l2Misses >= 0 : stryMutAct_9fa48("3506") ? false : stryMutAct_9fa48("3505") ? true : (stryCov_9fa48("3505", "3506", "3507", "3508"), (stryMutAct_9fa48("3509") ? this.stats.l2Hits - this.stats.l2Misses : (stryCov_9fa48("3509"), this.stats.l2Hits + this.stats.l2Misses)) > 0)) ? stryMutAct_9fa48("3510") ? this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses) / 100 : (stryCov_9fa48("3510"), (stryMutAct_9fa48("3511") ? this.stats.l2Hits * (this.stats.l2Hits + this.stats.l2Misses) : (stryCov_9fa48("3511"), this.stats.l2Hits / (stryMutAct_9fa48("3512") ? this.stats.l2Hits - this.stats.l2Misses : (stryCov_9fa48("3512"), this.stats.l2Hits + this.stats.l2Misses)))) * 100) : 0;
      const totalHitRate = (stryMutAct_9fa48("3516") ? this.stats.totalHits + this.stats.totalMisses <= 0 : stryMutAct_9fa48("3515") ? this.stats.totalHits + this.stats.totalMisses >= 0 : stryMutAct_9fa48("3514") ? false : stryMutAct_9fa48("3513") ? true : (stryCov_9fa48("3513", "3514", "3515", "3516"), (stryMutAct_9fa48("3517") ? this.stats.totalHits - this.stats.totalMisses : (stryCov_9fa48("3517"), this.stats.totalHits + this.stats.totalMisses)) > 0)) ? stryMutAct_9fa48("3518") ? this.stats.totalHits / (this.stats.totalHits + this.stats.totalMisses) / 100 : (stryCov_9fa48("3518"), (stryMutAct_9fa48("3519") ? this.stats.totalHits * (this.stats.totalHits + this.stats.totalMisses) : (stryCov_9fa48("3519"), this.stats.totalHits / (stryMutAct_9fa48("3520") ? this.stats.totalHits - this.stats.totalMisses : (stryCov_9fa48("3520"), this.stats.totalHits + this.stats.totalMisses)))) * 100) : 0;
      return stryMutAct_9fa48("3521") ? {} : (stryCov_9fa48("3521"), {
        l1: stryMutAct_9fa48("3522") ? {} : (stryCov_9fa48("3522"), {
          hits: this.stats.l1Hits,
          misses: this.stats.l1Misses,
          hitRate: l1HitRate.toFixed(2) + (stryMutAct_9fa48("3523") ? "" : (stryCov_9fa48("3523"), '%'))
        }),
        l2: stryMutAct_9fa48("3524") ? {} : (stryCov_9fa48("3524"), {
          hits: this.stats.l2Hits,
          misses: this.stats.l2Misses,
          hitRate: l2HitRate.toFixed(2) + (stryMutAct_9fa48("3525") ? "" : (stryCov_9fa48("3525"), '%'))
        }),
        total: stryMutAct_9fa48("3526") ? {} : (stryCov_9fa48("3526"), {
          hits: this.stats.totalHits,
          misses: this.stats.totalMisses,
          hitRate: totalHitRate.toFixed(2) + (stryMutAct_9fa48("3527") ? "" : (stryCov_9fa48("3527"), '%'))
        })
      });
    }
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    if (stryMutAct_9fa48("3528")) {
      {}
    } else {
      stryCov_9fa48("3528");
      this.stats = stryMutAct_9fa48("3529") ? {} : (stryCov_9fa48("3529"), {
        l1Hits: 0,
        l1Misses: 0,
        l2Hits: 0,
        l2Misses: 0,
        totalHits: 0,
        totalMisses: 0
      });
      log.info(stryMutAct_9fa48("3530") ? `` : (stryCov_9fa48("3530"), `${this.name} estatísticas resetadas`));
    }
  }
}