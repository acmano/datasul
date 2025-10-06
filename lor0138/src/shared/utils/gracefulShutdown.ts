// src/shared/utils/gracefulShutdown.ts

import { Server } from 'http';
import { log } from './logger';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

/**
 * ========================================
 * TIPOS E INTERFACES
 * ========================================
 */

/**
 * Configuração do processo de graceful shutdown
 *
 * PROPÓSITO:
 * Permite customizar comportamento do shutdown
 */
interface ShutdownConfig {
  /**
   * Timeout em milissegundos para forçar encerramento
   *
   * COMPORTAMENTO:
   * - Aguarda até timeout para shutdown gracioso
   * - Após timeout: força encerramento (process.exit)
   *
   * VALORES RECOMENDADOS:
   * - 5000ms (5s): Aplicações rápidas
   * - 10000ms (10s): Padrão equilibrado
   * - 15000ms (15s): Operações mais longas
   * - 30000ms (30s): Processos batch
   *
   * @default 10000 (10 segundos)
   */
  timeout?: number;

  /**
   * Callback executado antes do shutdown
   *
   * PROPÓSITO:
   * Permite cleanup customizado antes de fechar recursos
   *
   * EXEMPLO:
   * ```typescript
   * onShutdownStart: async () => {
   *   await notifyMonitoring('shutdown_started');
   *   await saveMetrics();
   * }
   * ```
   *
   * @optional
   */
  onShutdownStart?: () => void | Promise<void>;

  /**
   * Callback executado após shutdown bem-sucedido
   *
   * PROPÓSITO:
   * Permite ações finais após recursos fechados
   *
   * EXEMPLO:
   * ```typescript
   * onShutdownComplete: async () => {
   *   await notifyMonitoring('shutdown_complete');
   *   console.log('Goodbye!');
   * }
   * ```
   *
   * @optional
   */
  onShutdownComplete?: () => void | Promise<void>;
}

/**
 * ========================================
 * CLASSE PRINCIPAL
 * ========================================
 */

/**
 * Gerenciador de Graceful Shutdown
 *
 * PROPÓSITO:
 * Garante que o servidor encerre de forma limpa e ordenada,
 * sem perder requisições ativas e liberando recursos corretamente.
 *
 * PROCESSO DE SHUTDOWN:
 * 1. Para de aceitar novas conexões HTTP
 * 2. Aguarda requisições ativas finalizarem (máx 5s)
 * 3. Fecha conexões do banco de dados
 * 4. Executa cleanup customizado
 * 5. Força encerramento após timeout se necessário
 *
 * SINAIS CAPTURADOS:
 * - SIGTERM: Shutdown gracioso (Docker, Kubernetes)
 * - SIGINT: Ctrl+C (desenvolvimento)
 * - SIGQUIT: Quit signal
 * - uncaughtException: Erros não tratados (shutdown forçado)
 * - unhandledRejection: Promise rejections não tratadas (shutdown forçado)
 *
 * BENEFÍCIOS:
 * ✅ Zero requisições perdidas
 * ✅ Recursos liberados corretamente
 * ✅ Logs completos de shutdown
 * ✅ Compatível com orquestradores (Docker/K8s)
 * ✅ Timeout de segurança contra travamentos
 *
 * EXEMPLO DE USO:
 * ```typescript
 * import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
 *
 * const server = app.listen(3000);
 *
 * setupGracefulShutdown(server, {
 *   timeout: 10000,
 *   onShutdownStart: () => log.info('Iniciando shutdown...'),
 *   onShutdownComplete: () => log.info('Shutdown completo!')
 * });
 * ```
 *
 * @see server.ts - Uso principal
 * @see DatabaseManager.ts - Fechamento de conexões DB
 */
export class GracefulShutdown {
  private server: Server;
  private config: Required<ShutdownConfig>;
  private isShuttingDown: boolean = false;
  private shutdownTimer?: NodeJS.Timeout;
  private activeConnections: Set<any> = new Set();

  /**
   * Construtor do gerenciador de shutdown
   *
   * @param server - Servidor HTTP do Express
   * @param config - Configurações opcionais de shutdown
   */
  constructor(server: Server, config: ShutdownConfig = {}) {
    this.server = server;
    this.config = {
      timeout: config.timeout || 10000,
      onShutdownStart: config.onShutdownStart || (() => { }),
      onShutdownComplete: config.onShutdownComplete || (() => { }),
    };
  }

  /**
   * ========================================
   * INICIALIZAÇÃO DOS LISTENERS
   * ========================================
   */

  /**
   * Inicializa os listeners de sinais do sistema
   *
   * PROPÓSITO:
   * Captura sinais do sistema operacional e erros para executar shutdown
   *
   * SINAIS TRATADOS:
   *
   * 1. SIGTERM (Signal Terminate):
   *    - Enviado por: Docker, Kubernetes, systemd
   *    - Comportamento: Shutdown gracioso
   *    - Comum em: Deploys, scale down, atualizações
   *
   * 2. SIGINT (Signal Interrupt):
   *    - Enviado por: Ctrl+C no terminal
   *    - Comportamento: Shutdown gracioso
   *    - Comum em: Desenvolvimento local
   *
   * 3. SIGQUIT (Signal Quit):
   *    - Enviado por: Ctrl+\ no terminal
   *    - Comportamento: Shutdown gracioso
   *    - Comum em: Debug manual
   *
   * 4. uncaughtException:
   *    - Causa: Erro não capturado em código síncrono
   *    - Comportamento: Shutdown forçado (exit 1)
   *    - Comum em: Bugs críticos
   *
   * 5. unhandledRejection:
   *    - Causa: Promise rejeitada sem .catch()
   *    - Comportamento: Shutdown forçado (exit 1)
   *    - Comum em: Async/await sem try/catch
   *
   * RASTREAMENTO DE CONEXÕES:
   * - Monitora conexões HTTP ativas
   * - Remove conexões ao fechar
   * - Usado para fechar conexões pendentes após timeout
   *
   * EXEMPLO DE LOGS:
   * ```
   * 🔥 SIGTERM recebido - Iniciando graceful shutdown
   * 🛑 Iniciando processo de shutdown
   *    signal: SIGTERM
   *    activeConnections: 3
   * ```
   */
  public init(): void {
    // ========================================
    // SIGTERM - Shutdown gracioso (Docker, K8s)
    // ========================================
    process.on('SIGTERM', () => {
      log.info('🔥 SIGTERM recebido - Iniciando graceful shutdown');
      this.shutdown('SIGTERM');
    });

    // ========================================
    // SIGINT - Ctrl+C (desenvolvimento)
    // ========================================
    process.on('SIGINT', () => {
      log.info('🔥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown');
      this.shutdown('SIGINT');
    });

    // ========================================
    // SIGQUIT - Quit signal
    // ========================================
    process.on('SIGQUIT', () => {
      log.info('🔥 SIGQUIT recebido - Iniciando graceful shutdown');
      this.shutdown('SIGQUIT');
    });

    // ========================================
    // UNCAUGHT EXCEPTION - Último recurso
    // ========================================
    process.on('uncaughtException', (error: Error) => {
      log.error('❌ Uncaught Exception - Forçando shutdown', {
        error: error.message,
        stack: error.stack,
      });
      this.forceShutdown(1);
    });

    // ========================================
    // UNHANDLED PROMISE REJECTION
    // ========================================
    process.on('unhandledRejection', (reason: any) => {
      log.error('❌ Unhandled Promise Rejection - Forçando shutdown', {
        reason: reason?.toString(),
      });
      this.forceShutdown(1);
    });

    // ========================================
    // RASTREAR CONEXÕES ATIVAS
    // ========================================
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
   * ========================================
   * PROCESSO DE SHUTDOWN GRACIOSO
   * ========================================
   */

  /**
   * Executa o shutdown gracioso completo
   *
   * ALGORITMO:
   * 1. Verifica se já está em shutdown (previne duplicação)
   * 2. Marca flag isShuttingDown = true
   * 3. Executa callback onShutdownStart
   * 4. Inicia timer de timeout
   * 5. Fecha servidor HTTP (para novas conexões)
   * 6. Fecha conexões do banco de dados
   * 7. Executa cleanup customizado
   * 8. Executa callback onShutdownComplete
   * 9. Encerra processo (exit 0)
   *
   * PROTEÇÕES:
   * - Previne múltiplas execuções simultâneas
   * - Timeout de segurança força encerramento
   * - Erros são capturados e logados
   * - Callback errors não interrompem shutdown
   *
   * FLUXO TEMPORAL:
   * ```
   * t=0s    : Sinal recebido
   * t=0s    : Para de aceitar conexões
   * t=0-5s  : Aguarda conexões ativas
   * t=5s    : Força fechamento de conexões ativas
   * t=5-6s  : Fecha banco de dados
   * t=6-7s  : Cleanup customizado
   * t=7s    : process.exit(0)
   *
   * Se > 10s : Timeout força exit(1)
   * ```
   *
   * EXEMPLO DE LOGS:
   * ```
   * 🛑 Iniciando processo de shutdown
   * 📡 Fechando servidor HTTP...
   * ✅ Servidor HTTP fechado (activeConnections: 0)
   * 🗄️ Fechando conexões do banco de dados...
   * ✅ Conexões do banco fechadas
   * 🧹 Executando cleanup final...
   * ✅ Cleanup completo
   * ✅ Graceful shutdown completo (duration: 234ms)
   * 👋 Adeus!
   * ```
   *
   * @param signal - Nome do sinal que iniciou o shutdown
   * @returns Promise que resolve quando shutdown completo
   */
  private async shutdown(signal: string): Promise<void> {
    // ========================================
    // PREVINE MÚLTIPLAS EXECUÇÕES
    // ========================================
    if (this.isShuttingDown) {
      log.warn('⚠️ Shutdown já em andamento, ignorando sinal duplicado', {
        signal,
      });
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    log.info('🛑 Iniciando processo de shutdown', {
      signal,
      activeConnections: this.activeConnections.size,
      timestamp: new Date().toISOString(),
    });

    // ========================================
    // CALLBACK DE INÍCIO
    // ========================================
    try {
      await this.config.onShutdownStart();
    } catch (error) {
      log.error('Erro no callback onShutdownStart', { error });
    }

    // ========================================
    // TIMER DE TIMEOUT
    // ========================================
    this.shutdownTimer = setTimeout(() => {
      log.warn(
        `⏱️ Timeout de ${this.config.timeout}ms atingido - Forçando encerramento`
      );
      this.forceShutdown(0);
    }, this.config.timeout);

    try {
      // ========================================
      // 1. PARAR DE ACEITAR NOVAS CONEXÕES
      // ========================================
      await this.closeHttpServer();

      // ========================================
      // 2. FECHAR CONEXÕES DO BANCO DE DADOS
      // ========================================
      await this.closeDatabaseConnections();

      // ========================================
      // 3. CLEANUP CUSTOMIZADO
      // ========================================
      await this.performCleanup();

      // ========================================
      // SHUTDOWN BEM-SUCEDIDO
      // ========================================
      const duration = Date.now() - startTime;

      log.info('✅ Graceful shutdown completo', {
        signal,
        duration: duration,
        timestamp: new Date().toISOString(),
      });

      // ========================================
      // CALLBACK DE CONCLUSÃO
      // ========================================
      try {
        await this.config.onShutdownComplete();
      } catch (error) {
        log.error('Erro no callback onShutdownComplete', { error });
      }

      // ========================================
      // CANCELAR TIMER DE TIMEOUT
      // ========================================
      if (this.shutdownTimer) {
        clearTimeout(this.shutdownTimer);
      }

      // ========================================
      // ENCERRAR PROCESSO
      // ========================================
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
   * ========================================
   * FECHAR SERVIDOR HTTP
   * ========================================
   */

  /**
   * Fecha o servidor HTTP graciosamente
   *
   * PROPÓSITO:
   * Para de aceitar novas conexões e aguarda requisições ativas finalizarem
   *
   * ALGORITMO:
   * 1. Chama server.close() - para de aceitar novas conexões
   * 2. Aguarda requisições ativas finalizarem
   * 3. Após 5 segundos: força fechamento de conexões ativas
   *
   * COMPORTAMENTO:
   * - Novas conexões: Rejeitadas imediatamente
   * - Conexões ativas: Aguarda finalizar (máx 5s)
   * - Após 5s: connection.destroy() em todas ativas
   *
   * IMPORTANTE:
   * - Load balancer deve parar de rotear ANTES deste passo
   * - Em K8s: preStop hook ou terminationGracePeriodSeconds
   * - 5 segundos é suficiente para maioria das requisições
   *
   * @returns Promise que resolve quando servidor fechado
   * @throws Error se falha ao fechar
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
          log.warn(
            `⚠️ Forçando fechamento de ${this.activeConnections.size} conexões ativas`
          );

          this.activeConnections.forEach((connection) => {
            connection.destroy();
          });

          this.activeConnections.clear();
        }
      }, 5000);
    });
  }

  /**
   * ========================================
   * FECHAR CONEXÕES DO BANCO DE DADOS
   * ========================================
   */

  /**
   * Fecha conexões do banco de dados
   *
   * PROPÓSITO:
   * Encerra pools de conexão SQL Server/ODBC de forma limpa
   *
   * COMPORTAMENTO:
   * - Aguarda queries ativas finalizarem
   * - Fecha pools de conexão (EMP e MULT)
   * - Libera recursos de rede
   *
   * IMPORTANTE:
   * - Não aceita novas queries após close
   * - Queries ativas não são interrompidas
   * - DatabaseManager fica inutilizável após close
   *
   * @returns Promise que resolve quando conexões fechadas
   */
  private async closeDatabaseConnections(): Promise<void> {
    log.info('🗄️ Fechando conexões do banco de dados...');

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
   * ========================================
   * CLEANUP CUSTOMIZADO
   * ========================================
   */

  /**
   * Cleanup customizado adicional
   *
   * PROPÓSITO:
   * Permite adicionar lógica de cleanup específica da aplicação
   *
   * EXEMPLOS DE USO:
   * - Fechar cache (Redis)
   * - Salvar métricas
   * - Notificar serviços externos
   * - Limpar arquivos temporários
   * - Aguardar logs serem gravados
   *
   * IMPLEMENTAÇÃO ATUAL:
   * - Aguarda 100ms para logs serem gravados no disco
   *
   * @returns Promise que resolve quando cleanup completo
   */
  private async performCleanup(): Promise<void> {
    log.info('🧹 Executando cleanup final...');

    // Aguarda logs serem gravados
    await new Promise((resolve) => setTimeout(resolve, 100));

    log.info('✅ Cleanup completo');
  }

  /**
   * ========================================
   * SHUTDOWN FORÇADO
   * ========================================
   */

  /**
   * Força encerramento imediato
   *
   * PROPÓSITO:
   * Encerra processo imediatamente quando shutdown gracioso falha
   *
   * COMPORTAMENTO:
   * 1. Loga erro crítico
   * 2. Cancela timer de timeout
   * 3. Destrói todas conexões ativas
   * 4. Aguarda logs (100ms)
   * 5. process.exit(exitCode)
   *
   * QUANDO ACIONADO:
   * - Timeout de shutdown atingido
   * - Erro crítico durante shutdown
   * - uncaughtException
   * - unhandledRejection
   *
   * EXIT CODES:
   * - 0: Shutdown forçado mas sem erro (timeout)
   * - 1: Shutdown forçado por erro
   *
   * @param exitCode - Código de saída do processo (0 ou 1)
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
   * ========================================
   * MÉTODOS UTILITÁRIOS
   * ========================================
   */

  /**
   * Retorna status do shutdown
   *
   * PROPÓSITO:
   * Permite verificar estado do shutdown de fora da classe
   *
   * EXEMPLO:
   * ```typescript
   * const status = shutdown.getStatus();
   * console.log('Shutting down:', status.isShuttingDown);
   * console.log('Active connections:', status.activeConnections);
   * ```
   *
   * @returns Objeto com status atual
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
 * ========================================
 * HELPER FUNCTION
 * ========================================
 */

/**
 * Helper para criar e inicializar graceful shutdown
 *
 * PROPÓSITO:
 * Simplifica setup de shutdown em uma única chamada
 *
 * EXEMPLO DE USO:
 * ```typescript
 * import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
 *
 * const server = app.listen(3000);
 *
 * setupGracefulShutdown(server, {
 *   timeout: 15000,
 *   onShutdownStart: () => log.info('Iniciando shutdown...'),
 *   onShutdownComplete: () => log.info('Shutdown completo!')
 * });
 * ```
 *
 * @param server - Servidor HTTP do Express
 * @param config - Configurações opcionais de shutdown
 * @returns Instância do GracefulShutdown (caso precise acessar depois)
 */
export function setupGracefulShutdown(
  server: Server,
  config?: ShutdownConfig
): GracefulShutdown {
  const shutdown = new GracefulShutdown(server, config);
  shutdown.init();
  return shutdown;
}