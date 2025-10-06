// src/shared/services/healthCheck.service.ts

import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import os from 'os';

/**
 * @fileoverview Serviço de Health Check do Sistema
 *
 * Este serviço é responsável por verificar a saúde geral do sistema,
 * incluindo banco de dados, memória e disco. É utilizado principalmente
 * por endpoints de monitoramento e probes do Kubernetes/Docker.
 *
 * @module HealthCheckService
 * @category Services
 */

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

/**
 * Status geral de saúde do sistema
 *
 * @interface HealthStatus
 * @property {string} status - Status geral: 'healthy', 'degraded' ou 'unhealthy'
 * @property {string} timestamp - Timestamp ISO da verificação
 * @property {number} uptime - Tempo de atividade do processo em segundos
 * @property {Object} checks - Resultado das verificações individuais
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

/**
 * Resultado da verificação do banco de dados
 *
 * @interface DatabaseCheck
 * @property {string} status - Status: 'ok', 'degraded' ou 'error'
 * @property {number} [responseTime] - Tempo de resposta em ms
 * @property {string} [connectionType] - Tipo de conexão (sqlserver, odbc, mock)
 * @property {string} [mode] - Modo de operação (REAL_DATABASE, MOCK_DATA)
 * @property {string} [error] - Mensagem de erro, se houver
 */
interface DatabaseCheck {
  status: 'ok' | 'degraded' | 'error';
  responseTime?: number;
  connectionType?: string;
  mode?: string;
  error?: string;
}

/**
 * Resultado da verificação de memória
 *
 * @interface MemoryCheck
 * @property {string} status - Status: 'ok', 'warning' ou 'critical'
 * @property {number} used - Memória usada em MB
 * @property {number} total - Memória total em MB
 * @property {number} percentage - Percentual de uso
 * @property {number} free - Memória livre em MB
 */
interface MemoryCheck {
  status: 'ok' | 'warning' | 'critical';
  used: number;
  total: number;
  percentage: number;
  free: number;
}

/**
 * Resultado da verificação de disco
 *
 * @interface DiskCheck
 * @property {string} status - Status: 'ok', 'warning' ou 'critical'
 * @property {string} [message] - Mensagem adicional, se houver
 */
interface DiskCheck {
  status: 'ok' | 'warning' | 'critical';
  message?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Limites de memória para determinação de status
 *
 * @constant
 * @private
 */
const MEMORY_THRESHOLDS = {
  /** Percentual crítico de uso de memória (>90%) */
  CRITICAL: 90,
  /** Percentual de alerta de uso de memória (>75%) */
  WARNING: 75,
} as const;

/**
 * Limite de tempo de resposta do banco de dados
 *
 * @constant
 * @private
 */
const DATABASE_RESPONSE_THRESHOLD_MS = 1000;

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

/**
 * Serviço de Health Check
 *
 * Responsável por verificar a saúde do sistema através de múltiplas verificações:
 * - Conectividade e performance do banco de dados
 * - Uso de memória do sistema
 * - Status do disco (verificação básica)
 *
 * O serviço determina o status geral baseado nos resultados individuais:
 * - **healthy**: Todos os checks estão OK
 * - **degraded**: Algum check está em warning/degraded, mas sistema operacional
 * - **unhealthy**: Algum check crítico falhou, sistema pode estar instável
 *
 * @class HealthCheckService
 * @example
 * ```typescript
 * // Verificar saúde do sistema
 * const health = await HealthCheckService.check();
 *
 * if (health.status === 'healthy') {
 *   console.log('Sistema operando normalmente');
 * } else {
 *   console.warn('Sistema com problemas:', health.checks);
 * }
 * ```
 */
export class HealthCheckService {
  // ==========================================================================
  // MÉTODO PÚBLICO PRINCIPAL
  // ==========================================================================

  /**
   * Executa verificação completa de saúde do sistema
   *
   * Realiza todas as verificações em paralelo para otimizar o tempo de resposta.
   * Este método é thread-safe e pode ser chamado concorrentemente.
   *
   * @returns {Promise<HealthStatus>} Status completo de saúde do sistema
   *
   * @throws {Error} Raramente lança erro, pois captura falhas individuais
   *
   * @example
   * ```typescript
   * const health = await HealthCheckService.check();
   * console.log(`Status: ${health.status}`);
   * console.log(`Database: ${health.checks.database.status}`);
   * console.log(`Memory: ${health.checks.memory.percentage}%`);
   * ```
   *
   * @performance
   * - Execução típica: 10-100ms (banco local)
   * - Com banco remoto: 50-500ms
   * - Timeout: Não há timeout interno, depende do DatabaseManager
   */
  static async check(): Promise<HealthStatus> {
    // Executa todos os checks em paralelo para otimizar tempo
    const [databaseCheck, memoryCheck, diskCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    // Determina status geral baseado nos checks individuais
    const status = this.determineOverallStatus(
      databaseCheck,
      memoryCheck,
      diskCheck
    );

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
        disk: diskCheck,
      },
    };
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - VERIFICAÇÕES INDIVIDUAIS
  // ==========================================================================

  /**
   * Verifica saúde do banco de dados
   *
   * Testa conectividade executando uma query simples e medindo o tempo de resposta.
   *
   * **Critérios de Status:**
   * - **ok**: Banco conectado e respondendo em < 1s
   * - **degraded**: Banco conectado mas lento (>1s) OU usando MOCK_DATA
   * - **error**: Banco não inicializado ou query falhou
   *
   * @returns {Promise<DatabaseCheck>} Resultado da verificação
   * @private
   *
   * @example
   * ```typescript
   * const dbCheck = await HealthCheckService.checkDatabase();
   * // { status: 'ok', responseTime: 45, connectionType: 'sqlserver', mode: 'REAL_DATABASE' }
   * ```
   *
   * @performance
   * - Query: SELECT 1 as test (muito rápida)
   * - Timeout: Depende da configuração do DatabaseManager
   *
   * @critical
   * Se o DatabaseManager não estiver inicializado, retorna status 'error'
   * sem tentar conectar (fail-fast)
   */
  private static async checkDatabase(): Promise<DatabaseCheck> {
    const startTime = Date.now();

    try {
      // Verifica se DatabaseManager está pronto
      if (!DatabaseManager.isReady()) {
        return {
          status: 'error',
          error: 'Banco de dados não inicializado',
        };
      }

      // Obtém status da conexão atual
      const connectionStatus = DatabaseManager.getConnectionStatus();

      // Se está usando dados mock, considera degraded (não é erro, mas não é ideal)
      if (connectionStatus.mode === 'MOCK_DATA') {
        return {
          status: 'degraded',
          mode: 'MOCK_DATA',
          connectionType: connectionStatus.type,
        };
      }

      // Executa query de teste simples
      await DatabaseManager.queryEmp('SELECT 1 as test');
      const responseTime = Date.now() - startTime;

      // Determina status baseado no tempo de resposta
      const status =
        responseTime < DATABASE_RESPONSE_THRESHOLD_MS ? 'ok' : 'degraded';

      return {
        status,
        responseTime,
        connectionType: connectionStatus.type,
        mode: connectionStatus.mode,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Verifica uso de memória do sistema
   *
   * Analisa o uso de memória RAM e determina se está em níveis saudáveis.
   *
   * **Critérios de Status:**
   * - **ok**: Uso < 75%
   * - **warning**: Uso entre 75% e 90%
   * - **critical**: Uso > 90% (risco de OOM)
   *
   * @returns {Promise<MemoryCheck>} Resultado da verificação
   * @private
   *
   * @example
   * ```typescript
   * const memCheck = await HealthCheckService.checkMemory();
   * // { status: 'ok', used: 2048, total: 8192, percentage: 25, free: 6144 }
   * ```
   *
   * @performance
   * Operação síncrona muito rápida (< 1ms), usa APIs nativas do Node.js
   *
   * @note
   * Os valores são da memória total do sistema, não apenas do processo Node.js
   */
  private static async checkMemory(): Promise<MemoryCheck> {
    // Obtém informações de memória do Node.js e do SO
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Converte para MB para facilitar leitura
    const usedMB = Math.round(usedMem / 1024 / 1024);
    const totalMB = Math.round(totalMem / 1024 / 1024);
    const freeMB = Math.round(freeMem / 1024 / 1024);
    const percentage = Math.round((usedMem / totalMem) * 100);

    // Determina status baseado em thresholds
    let status: 'ok' | 'warning' | 'critical' = 'ok';

    if (percentage > MEMORY_THRESHOLDS.CRITICAL) {
      status = 'critical';
    } else if (percentage > MEMORY_THRESHOLDS.WARNING) {
      status = 'warning';
    }

    return {
      status,
      used: usedMB,
      total: totalMB,
      free: freeMB,
      percentage,
    };
  }

  /**
   * Verifica status do disco
   *
   * **NOTA:** Implementação básica que sempre retorna 'ok'.
   * Em produção, deveria verificar:
   * - Espaço livre em disco
   * - IOPS (operações de I/O)
   * - Latência de leitura/escrita
   *
   * @returns {Promise<DiskCheck>} Resultado da verificação
   * @private
   *
   * @todo Implementar verificação real de disco usando fs ou bibliotecas específicas
   *
   * @example
   * ```typescript
   * const diskCheck = await HealthCheckService.checkDisk();
   * // { status: 'ok', message: 'Verificação básica' }
   * ```
   */
  private static async checkDisk(): Promise<DiskCheck> {
    // TODO: Implementar verificação real de disco
    // Possíveis verificações:
    // - Espaço livre < 10% = critical
    // - Espaço livre < 20% = warning
    // - IOPS muito alto = warning
    // - Latência alta = degraded

    return {
      status: 'ok',
      message: 'Verificação básica - TODO: implementar verificação completa',
    };
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - DETERMINAÇÃO DE STATUS
  // ==========================================================================

  /**
   * Determina o status geral do sistema baseado nos checks individuais
   *
   * Aplica lógica de prioridade:
   * 1. Se qualquer check crítico falhou → **unhealthy**
   * 2. Se algum check está degraded/warning → **degraded**
   * 3. Se todos estão ok → **healthy**
   *
   * @param {DatabaseCheck} database - Resultado do check de banco
   * @param {MemoryCheck} memory - Resultado do check de memória
   * @param {DiskCheck} disk - Resultado do check de disco
   * @returns {string} Status geral: 'healthy', 'degraded' ou 'unhealthy'
   * @private
   *
   * @example
   * ```typescript
   * const status = HealthCheckService.determineOverallStatus(
   *   { status: 'ok' },
   *   { status: 'warning' },
   *   { status: 'ok' }
   * );
   * // Returns: 'degraded' (devido ao warning de memória)
   * ```
   *
   * @critical
   * A ordem de verificação é importante:
   * 1. Primeiro verifica falhas críticas (error, critical)
   * 2. Depois verifica degradações (degraded, warning)
   * 3. Por último, se tudo ok, retorna healthy
   */
  private static determineOverallStatus(
    database: DatabaseCheck,
    memory: MemoryCheck,
    disk: DiskCheck
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Prioridade 1: Checks críticos falharam → Sistema UNHEALTHY
    if (database.status === 'error' || memory.status === 'critical') {
      return 'unhealthy';
    }

    // Prioridade 2: Algum check está degraded/warning → Sistema DEGRADED
    if (
      database.status === 'degraded' ||
      memory.status === 'warning' ||
      disk.status === 'warning' ||
      disk.status === 'critical'
    ) {
      return 'degraded';
    }

    // Prioridade 3: Todos os checks OK → Sistema HEALTHY
    return 'healthy';
  }
}