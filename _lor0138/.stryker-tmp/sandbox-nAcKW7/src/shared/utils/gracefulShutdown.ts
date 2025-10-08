// @ts-nocheck
// src/shared/utils/gracefulShutdown.ts

import { Server } from 'http';
import { log } from './logger';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

interface ShutdownConfig {
  /**
   * Timeout em ms para forçar encerramento
   * @default 10000 (10 segundos)
   */
  timeout?: number;

  /**
   * Callback executado antes do shutdown
   * Útil para cleanup customizado
   */
  onShutdownStart?: () => void | Promise<void>;

  /**
   * Callback executado após shutdown bem-sucedido
   */
  onShutdownComplete?: () => void | Promise<void>;
}

/**
 * Gerenciador de Graceful Shutdown
 * 
 * Garante que o servidor encerre de forma limpa:
 * 1. Para de aceitar novas conexões
 * 2. Aguarda requisições ativas finalizarem
 * 3. Fecha conexões do banco de dados
 * 4. Força encerramento após timeout
 * 
 * @example
 * const shutdown = new GracefulShutdown(server, {
 *   timeout: 10000,
 *   onShutdownStart: () => log.info('Iniciando shutdown...'),
 *   onShutdownComplete: () => log.info('Shutdown completo!')
 * });
 * 
 * shutdown.init();
 */
export class GracefulShutdown {
  private server: Server;
  private config: Required<ShutdownConfig>;
  private isShuttingDown = false;
  private shutdownTimer?: NodeJS.Timeout;
  private activeConnections = new Set<any>();

  constructor(server: Server, config: ShutdownConfig = {}) {
    this.server = server;
    this.config = {
      timeout: config.timeout || 10000,
      onShutdownStart: config.onShutdownStart || (() => {}),
      onShutdownComplete: config.onShutdownComplete || (() => {}),
    };
  }

  /**
   * Inicializa os listeners de sinais
   * Captura: SIGTERM, SIGINT (Ctrl+C), SIGQUIT
   */
  public init(): void {
    // SIGTERM - Shutdown gracioso (usado por sistemas de orquestração)
    process.on('SIGTERM', () => {
      log.info('📥 SIGTERM recebido - Iniciando graceful shutdown');
      this.shutdown('SIGTERM');
    });

    // SIGINT - Ctrl+C (usado em desenvolvimento)
    process.on('SIGINT', () => {
      log.info('📥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown');
      this.shutdown('SIGINT');
    });

    // SIGQUIT - Quit signal
    process.on('SIGQUIT', () => {
      log.info('📥 SIGQUIT recebido - Iniciando graceful shutdown');
      this.shutdown('SIGQUIT');
    });

    // Uncaught exceptions - último recurso
    process.on('uncaughtException', (error: Error) => {
      log.error('❌ Uncaught Exception - Forçando shutdown', {
        error: error.message,
        stack: error.stack,
      });
      this.forceShutdown(1);
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      log.error('❌ Unhandled Promise Rejection - Forçando shutdown', {
        reason: reason?.toString(),
      });
      this.forceShutdown(1);
    });

    // Rastrear conexões ativas
    this.server.on('connection', (connection) => {
      this.activeConnections.add(connection);
      
      connection.on('close', () => {
        this.activeConnections.delete(connection);
      });
    });

    log.info('✅ Graceful shutdown configurado', {
      timeout: `${this.config.timeout}ms`,
      signals: ['SIGTERM', 'SIGINT', 'SIGQUIT'],
    });
  }

  /**
   * Executa o shutdown gracioso
   */
  private async shutdown(signal: string): Promise<void> {
    // Previne múltiplas execuções
    if (this.isShuttingDown) {
      log.warn('⚠️  Shutdown já em andamento, ignorando sinal duplicado', { signal });
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    log.info('🛑 Iniciando processo de shutdown', {
      signal,
      activeConnections: this.activeConnections.size,
      timestamp: new Date().toISOString(),
    });

    // Callback de início
    try {
      await this.config.onShutdownStart();
    } catch (error) {
      log.error('Erro no callback onShutdownStart', { error });
    }

    // Timer de timeout
    this.shutdownTimer = setTimeout(() => {
      log.warn(`⏱️  Timeout de ${this.config.timeout}ms atingido - Forçando encerramento`);
      this.forceShutdown(0);
    }, this.config.timeout);

    try {
      // 1. Parar de aceitar novas conexões
      await this.closeHttpServer();

      // 2. Fechar conexões do banco de dados
      await this.closeDatabaseConnections();

      // 3. Cleanup customizado (se houver)
      await this.performCleanup();

      // Shutdown bem-sucedido
      const duration = Date.now() - startTime;
      
      log.info('✅ Graceful shutdown completo', {
        signal,
        duration: duration,
        timestamp: new Date().toISOString(),
      });

      // Callback de conclusão
      try {
        await this.config.onShutdownComplete();
      } catch (error) {
        log.error('Erro no callback onShutdownComplete', { error });
      }

      // Cancelar timer de timeout
      if (this.shutdownTimer) {
        clearTimeout(this.shutdownTimer);
      }

      // Encerrar processo
      process.exit(0);
    } catch (error) {
      log.error('❌ Erro durante graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      this.forceShutdown(1);
    }
  }

  /**
   * Fecha o servidor HTTP graciosamente
   */
  private closeHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      log.info('📡 Fechando servidor HTTP...');

      // Para de aceitar novas conexões
      this.server.close((error) => {
        if (error) {
          log.error('Erro ao fechar servidor HTTP', { error: error.message });
          reject(error);
        } else {
          log.info('✅ Servidor HTTP fechado', {
            activeConnections: this.activeConnections.size,
          });
          resolve();
        }
      });

      // Fechar conexões ativas após 5 segundos
      setTimeout(() => {
        if (this.activeConnections.size > 0) {
          log.warn(`⚠️  Forçando fechamento de ${this.activeConnections.size} conexões ativas`);
          
          this.activeConnections.forEach((connection) => {
            connection.destroy();
          });
          
          this.activeConnections.clear();
        }
      }, 5000);
    });
  }

  /**
   * Fecha conexões do banco de dados
   */
  private async closeDatabaseConnections(): Promise<void> {
    log.info('🗄️  Fechando conexões do banco de dados...');

    try {
      await DatabaseManager.close();
      log.info('✅ Conexões do banco fechadas');
    } catch (error) {
      log.error('Erro ao fechar conexões do banco', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cleanup customizado adicional
   */
  private async performCleanup(): Promise<void> {
    log.info('🧹 Executando cleanup final...');

    // Aguarda logs serem gravados
    await new Promise((resolve) => setTimeout(resolve, 100));

    log.info('✅ Cleanup completo');
  }

  /**
   * Força encerramento imediato
   */
  private forceShutdown(exitCode: number): void {
    log.error('🔴 FORÇANDO ENCERRAMENTO IMEDIATO', {
      exitCode,
      timestamp: new Date().toISOString(),
    });

    // Cancela timer se existir
    if (this.shutdownTimer) {
      clearTimeout(this.shutdownTimer);
    }

    // Destrói todas as conexões
    this.activeConnections.forEach((connection) => {
      connection.destroy();
    });

    // Aguarda logs serem gravados
    setTimeout(() => {
      process.exit(exitCode);
    }, 100);
  }

  /**
   * Retorna status do shutdown
   */
  public getStatus(): {
    isShuttingDown: boolean;
    activeConnections: number;
  } {
    return {
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections.size,
    };
  }
}

/**
 * Helper para criar e inicializar graceful shutdown
 * 
 * @example
 * import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
 * 
 * const server = app.listen(3000);
 * setupGracefulShutdown(server, { timeout: 15000 });
 */
export function setupGracefulShutdown(
  server: Server,
  config?: ShutdownConfig
): GracefulShutdown {
  const shutdown = new GracefulShutdown(server, config);
  shutdown.init();
  return shutdown;
}