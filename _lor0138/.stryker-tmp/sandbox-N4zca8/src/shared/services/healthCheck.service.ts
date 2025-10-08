// @ts-nocheck
// src/shared/services/healthCheck.service.ts

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
    // Executa todos os checks em paralelo
    const [databaseCheck, memoryCheck, diskCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    // Determina status geral
    const status = this.determineOverallStatus(databaseCheck, memoryCheck, diskCheck);

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

  /**
   * Health check do banco de dados
   * Testa conectividade e tempo de resposta
   */
  private static async checkDatabase(): Promise<DatabaseCheck> {
    const startTime = Date.now();

    try {
      // Verifica se está inicializado
      if (!DatabaseManager.isReady()) {
        return {
          status: 'error',
          error: 'Banco de dados não inicializado',
        };
      }

      // Pega o status da conexão
      const connectionStatus = DatabaseManager.getConnectionStatus();

      // Se está usando mock, retorna degraded
      if (connectionStatus.mode === 'MOCK_DATA') {
        return {
          status: 'degraded',
          mode: 'MOCK_DATA',
          connectionType: connectionStatus.type,
        };
      }

      // Testa query simples
      await DatabaseManager.queryEmp('SELECT 1 as test');
      const responseTime = Date.now() - startTime;

      // Determina status baseado no tempo de resposta
      const status = responseTime < 1000 ? 'ok' : 'degraded';

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
   * Health check de memória
   */
  private static async checkMemory(): Promise<MemoryCheck> {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const usedMB = Math.round(usedMem / 1024 / 1024);
    const totalMB = Math.round(totalMem / 1024 / 1024);
    const freeMB = Math.round(freeMem / 1024 / 1024);
    const percentage = Math.round((usedMem / totalMem) * 100);

    // Determina status
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (percentage > 90) {
      status = 'critical';
    } else if (percentage > 75) {
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
   * Health check de disco
   * Nota: Verificação básica - pode ser expandida
   */
  private static async checkDisk(): Promise<DiskCheck> {
    // Por enquanto, sempre retorna OK
    // TODO: Implementar verificação real de disco
    return {
      status: 'ok',
    };
  }

  /**
   * Determina o status geral do sistema
   */
  private static determineOverallStatus(
    database: DatabaseCheck,
    memory: MemoryCheck,
    disk: DiskCheck
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Se qualquer check crítico falhou, sistema unhealthy
    if (database.status === 'error' || memory.status === 'critical') {
      return 'unhealthy';
    }

    // Se algum check está degraded/warning, sistema degraded
    if (
      database.status === 'degraded' ||
      memory.status === 'warning' ||
      disk.status === 'warning'
    ) {
      return 'degraded';
    }

    // Todos OK
    return 'healthy';
  }
}