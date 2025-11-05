// src/shared/services/healthCheck.service.ts

/**
 * Serviço de Health Check do Sistema
 * @module shared/services/healthCheck
 */

import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { checkElasticsearchHealth } from '@config/elasticsearch.config';
import os from 'os';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: DatabaseCheck;
    memory: MemoryCheck;
    disk: DiskCheck;
    elasticsearch: ElasticsearchCheck;
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
  message?: string;
}

interface ElasticsearchCheck {
  status: 'ok' | 'degraded' | 'disabled' | 'error';
  available?: boolean;
  version?: string;
  clusterName?: string;
  error?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MEMORY_THRESHOLDS = {
  CRITICAL: 90,
  WARNING: 75,
} as const;

const DATABASE_RESPONSE_THRESHOLD_MS = 1000;

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

export class HealthCheckService {
  /**
   * Executa verificação completa de saúde do sistema
   */
  static async check(): Promise<HealthStatus> {
    // Executa todos os checks em paralelo
    const [databaseCheck, memoryCheck, diskCheck, elasticsearchCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkElasticsearch(),
    ]);

    // Determina status geral
    const status = this.determineOverallStatus(
      databaseCheck,
      memoryCheck,
      diskCheck,
      elasticsearchCheck
    );

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
        disk: diskCheck,
        elasticsearch: elasticsearchCheck,
      },
    };
  }

  /**
   * Verifica saúde do banco de dados
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

      // Obtém status da conexão
      const connectionStatus = DatabaseManager.getConnectionStatus();

      // Se está usando dados mock, considera degraded
      if (connectionStatus.mode === 'MOCK_DATA') {
        return {
          status: 'degraded',
          mode: 'MOCK_DATA',
          connectionType: connectionStatus.type,
        };
      }

      // Executa query de teste (Progress ODBC não suporta SELECT sem FROM)
      await DatabaseManager.queryEmp('SELECT COUNT(*) as health FROM pub.item');
      const responseTime = Date.now() - startTime;

      // Determina status baseado no tempo de resposta
      const status = responseTime < DATABASE_RESPONSE_THRESHOLD_MS ? 'ok' : 'degraded';

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
   */
  private static async checkMemory(): Promise<MemoryCheck> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Converte para MB
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
   * TODO: Implementar verificação real de disco
   */
  private static async checkDisk(): Promise<DiskCheck> {
    return {
      status: 'ok',
      message: 'Verificação básica - TODO: implementar verificação completa',
    };
  }

  /**
   * Verifica saúde do Elasticsearch
   */
  private static async checkElasticsearch(): Promise<ElasticsearchCheck> {
    try {
      const health = await checkElasticsearchHealth();

      if (!health.available && health.error?.includes('não está habilitado')) {
        return {
          status: 'disabled',
          available: false,
        };
      }

      if (!health.available) {
        return {
          status: 'error',
          available: false,
          error: health.error,
        };
      }

      return {
        status: 'ok',
        available: true,
        version: health.version,
        clusterName: health.clusterName,
      };
    } catch (error) {
      return {
        status: 'error',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determina o status geral baseado nos checks individuais
   */
  private static determineOverallStatus(
    database: DatabaseCheck,
    memory: MemoryCheck,
    disk: DiskCheck,
    elasticsearch: ElasticsearchCheck
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Checks críticos falharam → UNHEALTHY
    if (database.status === 'error' || memory.status === 'critical') {
      return 'unhealthy';
    }

    // Algum check degraded/warning → DEGRADED
    // Nota: Elasticsearch desabilitado não degrada o sistema
    if (
      database.status === 'degraded' ||
      memory.status === 'warning' ||
      disk.status === 'warning' ||
      disk.status === 'critical' ||
      elasticsearch.status === 'error' ||
      elasticsearch.status === 'degraded'
    ) {
      return 'degraded';
    }

    // Todos OK → HEALTHY
    return 'healthy';
  }
}
