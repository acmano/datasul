// @ts-nocheck
// src/shared/utils/cache/QueryCacheService.ts
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
import { CacheManager } from '../cacheManager';
import { log } from '../logger';
export interface QueryCacheOptions {
  ttl?: number; // TTL específico em segundos
  prefix?: string; // Prefixo da chave de cache
  skipCache?: boolean; // Pular cache para esta query
  invalidatePattern?: string; // Pattern para invalidar
}

/**
 * Serviço de cache para queries de banco de dados
 * Gera keys automáticas baseadas em hash(SQL + params)
 */
export class QueryCacheService {
  private static readonly DEFAULT_TTL = 300; // 5 minutos
  private static readonly DEFAULT_PREFIX = stryMutAct_9fa48("3600") ? "" : (stryCov_9fa48("3600"), 'query');

  /**
   * Executa query com cache
   * 
   * @example
   * ```typescript
   * const result = await QueryCacheService.withCache(
   *   'SELECT * FROM item WHERE codigo = @p1',
   *   [{ name: 'p1', value: '7530110' }],
   *   async () => DatabaseManager.queryEmpWithParams(sql, params),
   *   { ttl: 600, prefix: 'item' }
   * );
   * ```
   */
  static async withCache<T>(sql: string, params: any[] = stryMutAct_9fa48("3601") ? ["Stryker was here"] : (stryCov_9fa48("3601"), []), queryFn: () => Promise<T>, options: QueryCacheOptions = {}): Promise<T> {
    if (stryMutAct_9fa48("3602")) {
      {}
    } else {
      stryCov_9fa48("3602");
      const {
        ttl = this.DEFAULT_TTL,
        prefix = this.DEFAULT_PREFIX,
        skipCache = stryMutAct_9fa48("3603") ? true : (stryCov_9fa48("3603"), false)
      } = options;

      // Se skip explícito, executa direto
      if (stryMutAct_9fa48("3605") ? false : stryMutAct_9fa48("3604") ? true : (stryCov_9fa48("3604", "3605"), skipCache)) {
        if (stryMutAct_9fa48("3606")) {
          {}
        } else {
          stryCov_9fa48("3606");
          log.debug(stryMutAct_9fa48("3607") ? "" : (stryCov_9fa48("3607"), 'Query cache: SKIP'), stryMutAct_9fa48("3608") ? {} : (stryCov_9fa48("3608"), {
            prefix
          }));
          return queryFn();
        }
      }

      // Gerar chave de cache
      const cacheKey = this.generateCacheKey(sql, params, prefix);

      // Tentar buscar do cache
      const cached = await CacheManager.get<T>(cacheKey);
      if (stryMutAct_9fa48("3611") ? cached === undefined : stryMutAct_9fa48("3610") ? false : stryMutAct_9fa48("3609") ? true : (stryCov_9fa48("3609", "3610", "3611"), cached !== undefined)) {
        if (stryMutAct_9fa48("3612")) {
          {}
        } else {
          stryCov_9fa48("3612");
          log.debug(stryMutAct_9fa48("3613") ? "" : (stryCov_9fa48("3613"), 'Query cache: HIT'), stryMutAct_9fa48("3614") ? {} : (stryCov_9fa48("3614"), {
            key: cacheKey,
            prefix
          }));
          return cached;
        }
      }

      // MISS: executar query
      log.debug(stryMutAct_9fa48("3615") ? "" : (stryCov_9fa48("3615"), 'Query cache: MISS'), stryMutAct_9fa48("3616") ? {} : (stryCov_9fa48("3616"), {
        key: cacheKey,
        prefix
      }));
      const result = await queryFn();

      // Armazenar no cache
      await CacheManager.set(cacheKey, result, ttl);
      return result;
    }
  }

  /**
   * Gera chave de cache determinística
   * Hash MD5 de: prefix:sql:params_json
   * 
   * ✅ CORRIGIDO: Serializa params corretamente (array ou objeto)
   */
  private static generateCacheKey(sql: string, params: any[], prefix: string): string {
    if (stryMutAct_9fa48("3617")) {
      {}
    } else {
      stryCov_9fa48("3617");
      // Normalizar SQL (remover espaços extras)
      const normalizedSql = stryMutAct_9fa48("3618") ? sql.replace(/\s+/g, ' ') : (stryCov_9fa48("3618"), sql.replace(stryMutAct_9fa48("3620") ? /\S+/g : stryMutAct_9fa48("3619") ? /\s/g : (stryCov_9fa48("3619", "3620"), /\s+/g), stryMutAct_9fa48("3621") ? "" : (stryCov_9fa48("3621"), ' ')).trim());

      // ✅ CORREÇÃO: Serializar params de forma determinística
      // Se for array, mapeia para extrair valores relevantes
      let paramsStr: string;
      if (stryMutAct_9fa48("3623") ? false : stryMutAct_9fa48("3622") ? true : (stryCov_9fa48("3622", "3623"), Array.isArray(params))) {
        if (stryMutAct_9fa48("3624")) {
          {}
        } else {
          stryCov_9fa48("3624");
          // Para array de QueryParameter: [{name, type, value}, ...]
          const sortedParams = stryMutAct_9fa48("3625") ? params.map(p => {
            if (typeof p === 'object' && p !== null) {
              // Extrai apenas name e value, ordena as chaves
              return {
                name: p.name,
                value: p.value
              };
            }
            return p;
          }) : (stryCov_9fa48("3625"), params.map(p => {
            if (stryMutAct_9fa48("3626")) {
              {}
            } else {
              stryCov_9fa48("3626");
              if (stryMutAct_9fa48("3629") ? typeof p === 'object' || p !== null : stryMutAct_9fa48("3628") ? false : stryMutAct_9fa48("3627") ? true : (stryCov_9fa48("3627", "3628", "3629"), (stryMutAct_9fa48("3631") ? typeof p !== 'object' : stryMutAct_9fa48("3630") ? true : (stryCov_9fa48("3630", "3631"), typeof p === (stryMutAct_9fa48("3632") ? "" : (stryCov_9fa48("3632"), 'object')))) && (stryMutAct_9fa48("3634") ? p === null : stryMutAct_9fa48("3633") ? true : (stryCov_9fa48("3633", "3634"), p !== null)))) {
                if (stryMutAct_9fa48("3635")) {
                  {}
                } else {
                  stryCov_9fa48("3635");
                  // Extrai apenas name e value, ordena as chaves
                  return stryMutAct_9fa48("3636") ? {} : (stryCov_9fa48("3636"), {
                    name: p.name,
                    value: p.value
                  });
                }
              }
              return p;
            }
          }).sort((a, b) => {
            if (stryMutAct_9fa48("3637")) {
              {}
            } else {
              stryCov_9fa48("3637");
              // Ordena por name se existir
              const nameA = stryMutAct_9fa48("3640") ? a?.name && '' : stryMutAct_9fa48("3639") ? false : stryMutAct_9fa48("3638") ? true : (stryCov_9fa48("3638", "3639", "3640"), (stryMutAct_9fa48("3641") ? a.name : (stryCov_9fa48("3641"), a?.name)) || (stryMutAct_9fa48("3642") ? "Stryker was here!" : (stryCov_9fa48("3642"), '')));
              const nameB = stryMutAct_9fa48("3645") ? b?.name && '' : stryMutAct_9fa48("3644") ? false : stryMutAct_9fa48("3643") ? true : (stryCov_9fa48("3643", "3644", "3645"), (stryMutAct_9fa48("3646") ? b.name : (stryCov_9fa48("3646"), b?.name)) || (stryMutAct_9fa48("3647") ? "Stryker was here!" : (stryCov_9fa48("3647"), '')));
              return nameA.localeCompare(nameB);
            }
          }));
          paramsStr = JSON.stringify(sortedParams);
        }
      } else {
        if (stryMutAct_9fa48("3648")) {
          {}
        } else {
          stryCov_9fa48("3648");
          // Para objeto simples
          paramsStr = JSON.stringify(params, stryMutAct_9fa48("3649") ? Object.keys(params) : (stryCov_9fa48("3649"), Object.keys(params).sort()));
        }
      }

      // Gerar hash
      const hash = stryMutAct_9fa48("3650") ? crypto.createHash('md5').update(`${normalizedSql}:${paramsStr}`).digest('hex') : (stryCov_9fa48("3650"), crypto.createHash(stryMutAct_9fa48("3651") ? "" : (stryCov_9fa48("3651"), 'md5')).update(stryMutAct_9fa48("3652") ? `` : (stryCov_9fa48("3652"), `${normalizedSql}:${paramsStr}`)).digest(stryMutAct_9fa48("3653") ? "" : (stryCov_9fa48("3653"), 'hex')).substring(0, 16)); // 16 chars é suficiente

      return stryMutAct_9fa48("3654") ? `` : (stryCov_9fa48("3654"), `${prefix}:${hash}`);
    }
  }

  /**
   * Invalida cache por pattern
   * 
   * @example
   * ```typescript
   * // Invalidar todos os caches de item
   * await QueryCacheService.invalidate('item:*');
   * 
   * // Invalidar cache específico
   * await QueryCacheService.invalidate('item:abc123def456');
   * ```
   */
  static async invalidate(pattern: string): Promise<number> {
    if (stryMutAct_9fa48("3655")) {
      {}
    } else {
      stryCov_9fa48("3655");
      log.info(stryMutAct_9fa48("3656") ? "" : (stryCov_9fa48("3656"), 'Query cache: INVALIDATE'), stryMutAct_9fa48("3657") ? {} : (stryCov_9fa48("3657"), {
        pattern
      }));
      return CacheManager.delete(pattern);
    }
  }

  /**
   * Invalida múltiplos patterns
   */
  static async invalidateMultiple(patterns: string[]): Promise<number> {
    if (stryMutAct_9fa48("3658")) {
      {}
    } else {
      stryCov_9fa48("3658");
      let total = 0;
      for (const pattern of patterns) {
        if (stryMutAct_9fa48("3659")) {
          {}
        } else {
          stryCov_9fa48("3659");
          stryMutAct_9fa48("3660") ? total -= await this.invalidate(pattern) : (stryCov_9fa48("3660"), total += await this.invalidate(pattern));
        }
      }
      return total;
    }
  }

  /**
   * Wrapper para queries de itens
   */
  static async withItemCache<T>(sql: string, params: any[], queryFn: () => Promise<T>, ttl?: number): Promise<T> {
    if (stryMutAct_9fa48("3661")) {
      {}
    } else {
      stryCov_9fa48("3661");
      return this.withCache(sql, params, queryFn, stryMutAct_9fa48("3662") ? {} : (stryCov_9fa48("3662"), {
        ttl: stryMutAct_9fa48("3665") ? ttl && 600 : stryMutAct_9fa48("3664") ? false : stryMutAct_9fa48("3663") ? true : (stryCov_9fa48("3663", "3664", "3665"), ttl || 600),
        // 10 minutos para itens
        prefix: stryMutAct_9fa48("3666") ? "" : (stryCov_9fa48("3666"), 'item')
      }));
    }
  }

  /**
   * Wrapper para queries de estabelecimentos
   */
  static async withEstabelecimentoCache<T>(sql: string, params: any[], queryFn: () => Promise<T>, ttl?: number): Promise<T> {
    if (stryMutAct_9fa48("3667")) {
      {}
    } else {
      stryCov_9fa48("3667");
      return this.withCache(sql, params, queryFn, stryMutAct_9fa48("3668") ? {} : (stryCov_9fa48("3668"), {
        ttl: stryMutAct_9fa48("3671") ? ttl && 900 : stryMutAct_9fa48("3670") ? false : stryMutAct_9fa48("3669") ? true : (stryCov_9fa48("3669", "3670", "3671"), ttl || 900),
        // 15 minutos para estabelecimentos
        prefix: stryMutAct_9fa48("3672") ? "" : (stryCov_9fa48("3672"), 'estabelecimento')
      }));
    }
  }

  /**
   * Wrapper para queries de health check (TTL curto)
   */
  static async withHealthCache<T>(sql: string, params: any[], queryFn: () => Promise<T>): Promise<T> {
    if (stryMutAct_9fa48("3673")) {
      {}
    } else {
      stryCov_9fa48("3673");
      return this.withCache(sql, params, queryFn, stryMutAct_9fa48("3674") ? {} : (stryCov_9fa48("3674"), {
        ttl: 30,
        // 30 segundos
        prefix: stryMutAct_9fa48("3675") ? "" : (stryCov_9fa48("3675"), 'health')
      }));
    }
  }
}