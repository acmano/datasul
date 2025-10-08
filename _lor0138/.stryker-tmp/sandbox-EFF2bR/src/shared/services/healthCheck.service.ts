// @ts-nocheck
// src/shared/services/healthCheck.service.ts
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
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager'; // ✅ CORRIGIDO: path relativo
import os from 'os';

/**
 * Status de saúde do sistema
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: DatabaseCheck;
    memory: MemoryCheck;
    disk: DiskCheck;
  };
}
interface DatabaseCheck {
  status: 'ok' | 'degraded' | 'error';
  responseTime?: number;
  connectionType?: string;
  mode?: string;
  error?: string;
}
interface MemoryCheck {
  status: 'ok' | 'warning' | 'critical';
  used: number;
  total: number;
  percentage: number;
  free: number;
}
interface DiskCheck {
  status: 'ok' | 'warning' | 'critical';
  // Nota: Verificação básica, pode ser expandida
}

/**
 * Serviço de Health Check
 * Testa a saúde real do sistema
 */
export class HealthCheckService {
  /**
   * Executa todos os health checks
   */
  static async check(): Promise<HealthStatus> {
    if (stryMutAct_9fa48("3122")) {
      {}
    } else {
      stryCov_9fa48("3122");
      // Executa todos os checks em paralelo
      const [databaseCheck, memoryCheck, diskCheck] = await Promise.all(stryMutAct_9fa48("3123") ? [] : (stryCov_9fa48("3123"), [this.checkDatabase(), this.checkMemory(), this.checkDisk()]));

      // Determina status geral
      const status = this.determineOverallStatus(databaseCheck, memoryCheck, diskCheck);
      return stryMutAct_9fa48("3124") ? {} : (stryCov_9fa48("3124"), {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: stryMutAct_9fa48("3125") ? {} : (stryCov_9fa48("3125"), {
          database: databaseCheck,
          memory: memoryCheck,
          disk: diskCheck
        })
      });
    }
  }

  /**
   * Health check do banco de dados
   * Testa conectividade e tempo de resposta
   */
  private static async checkDatabase(): Promise<DatabaseCheck> {
    if (stryMutAct_9fa48("3126")) {
      {}
    } else {
      stryCov_9fa48("3126");
      const startTime = Date.now();
      try {
        if (stryMutAct_9fa48("3127")) {
          {}
        } else {
          stryCov_9fa48("3127");
          // Verifica se está inicializado
          if (stryMutAct_9fa48("3130") ? false : stryMutAct_9fa48("3129") ? true : stryMutAct_9fa48("3128") ? DatabaseManager.isReady() : (stryCov_9fa48("3128", "3129", "3130"), !DatabaseManager.isReady())) {
            if (stryMutAct_9fa48("3131")) {
              {}
            } else {
              stryCov_9fa48("3131");
              return stryMutAct_9fa48("3132") ? {} : (stryCov_9fa48("3132"), {
                status: stryMutAct_9fa48("3133") ? "" : (stryCov_9fa48("3133"), 'error'),
                error: stryMutAct_9fa48("3134") ? "" : (stryCov_9fa48("3134"), 'Banco de dados não inicializado')
              });
            }
          }

          // Pega o status da conexão
          const connectionStatus = DatabaseManager.getConnectionStatus();

          // Se está usando mock, retorna degraded
          if (stryMutAct_9fa48("3137") ? connectionStatus.mode !== 'MOCK_DATA' : stryMutAct_9fa48("3136") ? false : stryMutAct_9fa48("3135") ? true : (stryCov_9fa48("3135", "3136", "3137"), connectionStatus.mode === (stryMutAct_9fa48("3138") ? "" : (stryCov_9fa48("3138"), 'MOCK_DATA')))) {
            if (stryMutAct_9fa48("3139")) {
              {}
            } else {
              stryCov_9fa48("3139");
              return stryMutAct_9fa48("3140") ? {} : (stryCov_9fa48("3140"), {
                status: stryMutAct_9fa48("3141") ? "" : (stryCov_9fa48("3141"), 'degraded'),
                mode: stryMutAct_9fa48("3142") ? "" : (stryCov_9fa48("3142"), 'MOCK_DATA'),
                connectionType: connectionStatus.type
              });
            }
          }

          // Testa query simples
          await DatabaseManager.queryEmp(stryMutAct_9fa48("3143") ? "" : (stryCov_9fa48("3143"), 'SELECT 1 as test'));
          const responseTime = stryMutAct_9fa48("3144") ? Date.now() + startTime : (stryCov_9fa48("3144"), Date.now() - startTime);

          // Determina status baseado no tempo de resposta
          const status = (stryMutAct_9fa48("3148") ? responseTime >= 1000 : stryMutAct_9fa48("3147") ? responseTime <= 1000 : stryMutAct_9fa48("3146") ? false : stryMutAct_9fa48("3145") ? true : (stryCov_9fa48("3145", "3146", "3147", "3148"), responseTime < 1000)) ? stryMutAct_9fa48("3149") ? "" : (stryCov_9fa48("3149"), 'ok') : stryMutAct_9fa48("3150") ? "" : (stryCov_9fa48("3150"), 'degraded');
          return stryMutAct_9fa48("3151") ? {} : (stryCov_9fa48("3151"), {
            status,
            responseTime,
            connectionType: connectionStatus.type,
            mode: connectionStatus.mode
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3152")) {
          {}
        } else {
          stryCov_9fa48("3152");
          return stryMutAct_9fa48("3153") ? {} : (stryCov_9fa48("3153"), {
            status: stryMutAct_9fa48("3154") ? "" : (stryCov_9fa48("3154"), 'error'),
            error: error instanceof Error ? error.message : stryMutAct_9fa48("3155") ? "" : (stryCov_9fa48("3155"), 'Unknown error'),
            responseTime: stryMutAct_9fa48("3156") ? Date.now() + startTime : (stryCov_9fa48("3156"), Date.now() - startTime)
          });
        }
      }
    }
  }

  /**
   * Health check de memória
   */
  private static async checkMemory(): Promise<MemoryCheck> {
    if (stryMutAct_9fa48("3157")) {
      {}
    } else {
      stryCov_9fa48("3157");
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = stryMutAct_9fa48("3158") ? totalMem + freeMem : (stryCov_9fa48("3158"), totalMem - freeMem);
      const usedMB = Math.round(stryMutAct_9fa48("3159") ? usedMem / 1024 * 1024 : (stryCov_9fa48("3159"), (stryMutAct_9fa48("3160") ? usedMem * 1024 : (stryCov_9fa48("3160"), usedMem / 1024)) / 1024));
      const totalMB = Math.round(stryMutAct_9fa48("3161") ? totalMem / 1024 * 1024 : (stryCov_9fa48("3161"), (stryMutAct_9fa48("3162") ? totalMem * 1024 : (stryCov_9fa48("3162"), totalMem / 1024)) / 1024));
      const freeMB = Math.round(stryMutAct_9fa48("3163") ? freeMem / 1024 * 1024 : (stryCov_9fa48("3163"), (stryMutAct_9fa48("3164") ? freeMem * 1024 : (stryCov_9fa48("3164"), freeMem / 1024)) / 1024));
      const percentage = Math.round(stryMutAct_9fa48("3165") ? usedMem / totalMem / 100 : (stryCov_9fa48("3165"), (stryMutAct_9fa48("3166") ? usedMem * totalMem : (stryCov_9fa48("3166"), usedMem / totalMem)) * 100));

      // Determina status
      let status: 'ok' | 'warning' | 'critical' = stryMutAct_9fa48("3167") ? "" : (stryCov_9fa48("3167"), 'ok');
      if (stryMutAct_9fa48("3171") ? percentage <= 90 : stryMutAct_9fa48("3170") ? percentage >= 90 : stryMutAct_9fa48("3169") ? false : stryMutAct_9fa48("3168") ? true : (stryCov_9fa48("3168", "3169", "3170", "3171"), percentage > 90)) {
        if (stryMutAct_9fa48("3172")) {
          {}
        } else {
          stryCov_9fa48("3172");
          status = stryMutAct_9fa48("3173") ? "" : (stryCov_9fa48("3173"), 'critical');
        }
      } else if (stryMutAct_9fa48("3177") ? percentage <= 75 : stryMutAct_9fa48("3176") ? percentage >= 75 : stryMutAct_9fa48("3175") ? false : stryMutAct_9fa48("3174") ? true : (stryCov_9fa48("3174", "3175", "3176", "3177"), percentage > 75)) {
        if (stryMutAct_9fa48("3178")) {
          {}
        } else {
          stryCov_9fa48("3178");
          status = stryMutAct_9fa48("3179") ? "" : (stryCov_9fa48("3179"), 'warning');
        }
      }
      return stryMutAct_9fa48("3180") ? {} : (stryCov_9fa48("3180"), {
        status,
        used: usedMB,
        total: totalMB,
        free: freeMB,
        percentage
      });
    }
  }

  /**
   * Health check de disco
   * Nota: Verificação básica - pode ser expandida
   */
  private static async checkDisk(): Promise<DiskCheck> {
    if (stryMutAct_9fa48("3181")) {
      {}
    } else {
      stryCov_9fa48("3181");
      // Por enquanto, sempre retorna OK
      // TODO: Implementar verificação real de disco
      return stryMutAct_9fa48("3182") ? {} : (stryCov_9fa48("3182"), {
        status: stryMutAct_9fa48("3183") ? "" : (stryCov_9fa48("3183"), 'ok')
      });
    }
  }

  /**
   * Determina o status geral do sistema
   */
  private static determineOverallStatus(database: DatabaseCheck, memory: MemoryCheck, disk: DiskCheck): 'healthy' | 'degraded' | 'unhealthy' {
    if (stryMutAct_9fa48("3184")) {
      {}
    } else {
      stryCov_9fa48("3184");
      // Se qualquer check crítico falhou, sistema unhealthy
      if (stryMutAct_9fa48("3187") ? database.status === 'error' && memory.status === 'critical' : stryMutAct_9fa48("3186") ? false : stryMutAct_9fa48("3185") ? true : (stryCov_9fa48("3185", "3186", "3187"), (stryMutAct_9fa48("3189") ? database.status !== 'error' : stryMutAct_9fa48("3188") ? false : (stryCov_9fa48("3188", "3189"), database.status === (stryMutAct_9fa48("3190") ? "" : (stryCov_9fa48("3190"), 'error')))) || (stryMutAct_9fa48("3192") ? memory.status !== 'critical' : stryMutAct_9fa48("3191") ? false : (stryCov_9fa48("3191", "3192"), memory.status === (stryMutAct_9fa48("3193") ? "" : (stryCov_9fa48("3193"), 'critical')))))) {
        if (stryMutAct_9fa48("3194")) {
          {}
        } else {
          stryCov_9fa48("3194");
          return stryMutAct_9fa48("3195") ? "" : (stryCov_9fa48("3195"), 'unhealthy');
        }
      }

      // Se algum check está degraded/warning, sistema degraded
      if (stryMutAct_9fa48("3198") ? (database.status === 'degraded' || memory.status === 'warning') && disk.status === 'warning' : stryMutAct_9fa48("3197") ? false : stryMutAct_9fa48("3196") ? true : (stryCov_9fa48("3196", "3197", "3198"), (stryMutAct_9fa48("3200") ? database.status === 'degraded' && memory.status === 'warning' : stryMutAct_9fa48("3199") ? false : (stryCov_9fa48("3199", "3200"), (stryMutAct_9fa48("3202") ? database.status !== 'degraded' : stryMutAct_9fa48("3201") ? false : (stryCov_9fa48("3201", "3202"), database.status === (stryMutAct_9fa48("3203") ? "" : (stryCov_9fa48("3203"), 'degraded')))) || (stryMutAct_9fa48("3205") ? memory.status !== 'warning' : stryMutAct_9fa48("3204") ? false : (stryCov_9fa48("3204", "3205"), memory.status === (stryMutAct_9fa48("3206") ? "" : (stryCov_9fa48("3206"), 'warning')))))) || (stryMutAct_9fa48("3208") ? disk.status !== 'warning' : stryMutAct_9fa48("3207") ? false : (stryCov_9fa48("3207", "3208"), disk.status === (stryMutAct_9fa48("3209") ? "" : (stryCov_9fa48("3209"), 'warning')))))) {
        if (stryMutAct_9fa48("3210")) {
          {}
        } else {
          stryCov_9fa48("3210");
          return stryMutAct_9fa48("3211") ? "" : (stryCov_9fa48("3211"), 'degraded');
        }
      }

      // Todos OK
      return stryMutAct_9fa48("3212") ? "" : (stryCov_9fa48("3212"), 'healthy');
    }
  }
}