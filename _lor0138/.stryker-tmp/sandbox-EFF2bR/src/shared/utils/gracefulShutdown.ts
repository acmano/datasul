// @ts-nocheck
// src/shared/utils/gracefulShutdown.ts
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
  private isShuttingDown = stryMutAct_9fa48("4019") ? true : (stryCov_9fa48("4019"), false);
  private shutdownTimer?: NodeJS.Timeout;
  private activeConnections = new Set<any>();
  constructor(server: Server, config: ShutdownConfig = {}) {
    if (stryMutAct_9fa48("4020")) {
      {}
    } else {
      stryCov_9fa48("4020");
      this.server = server;
      this.config = stryMutAct_9fa48("4021") ? {} : (stryCov_9fa48("4021"), {
        timeout: stryMutAct_9fa48("4024") ? config.timeout && 10000 : stryMutAct_9fa48("4023") ? false : stryMutAct_9fa48("4022") ? true : (stryCov_9fa48("4022", "4023", "4024"), config.timeout || 10000),
        onShutdownStart: stryMutAct_9fa48("4027") ? config.onShutdownStart && (() => {}) : stryMutAct_9fa48("4026") ? false : stryMutAct_9fa48("4025") ? true : (stryCov_9fa48("4025", "4026", "4027"), config.onShutdownStart || (() => {})),
        onShutdownComplete: stryMutAct_9fa48("4030") ? config.onShutdownComplete && (() => {}) : stryMutAct_9fa48("4029") ? false : stryMutAct_9fa48("4028") ? true : (stryCov_9fa48("4028", "4029", "4030"), config.onShutdownComplete || (() => {}))
      });
    }
  }

  /**
   * Inicializa os listeners de sinais
   * Captura: SIGTERM, SIGINT (Ctrl+C), SIGQUIT
   */
  public init(): void {
    if (stryMutAct_9fa48("4031")) {
      {}
    } else {
      stryCov_9fa48("4031");
      // SIGTERM - Shutdown gracioso (usado por sistemas de orquestração)
      process.on(stryMutAct_9fa48("4032") ? "" : (stryCov_9fa48("4032"), 'SIGTERM'), () => {
        if (stryMutAct_9fa48("4033")) {
          {}
        } else {
          stryCov_9fa48("4033");
          log.info(stryMutAct_9fa48("4034") ? "" : (stryCov_9fa48("4034"), '📥 SIGTERM recebido - Iniciando graceful shutdown'));
          this.shutdown(stryMutAct_9fa48("4035") ? "" : (stryCov_9fa48("4035"), 'SIGTERM'));
        }
      });

      // SIGINT - Ctrl+C (usado em desenvolvimento)
      process.on(stryMutAct_9fa48("4036") ? "" : (stryCov_9fa48("4036"), 'SIGINT'), () => {
        if (stryMutAct_9fa48("4037")) {
          {}
        } else {
          stryCov_9fa48("4037");
          log.info(stryMutAct_9fa48("4038") ? "" : (stryCov_9fa48("4038"), '📥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown'));
          this.shutdown(stryMutAct_9fa48("4039") ? "" : (stryCov_9fa48("4039"), 'SIGINT'));
        }
      });

      // SIGQUIT - Quit signal
      process.on(stryMutAct_9fa48("4040") ? "" : (stryCov_9fa48("4040"), 'SIGQUIT'), () => {
        if (stryMutAct_9fa48("4041")) {
          {}
        } else {
          stryCov_9fa48("4041");
          log.info(stryMutAct_9fa48("4042") ? "" : (stryCov_9fa48("4042"), '📥 SIGQUIT recebido - Iniciando graceful shutdown'));
          this.shutdown(stryMutAct_9fa48("4043") ? "" : (stryCov_9fa48("4043"), 'SIGQUIT'));
        }
      });

      // Uncaught exceptions - último recurso
      process.on(stryMutAct_9fa48("4044") ? "" : (stryCov_9fa48("4044"), 'uncaughtException'), (error: Error) => {
        if (stryMutAct_9fa48("4045")) {
          {}
        } else {
          stryCov_9fa48("4045");
          log.error(stryMutAct_9fa48("4046") ? "" : (stryCov_9fa48("4046"), '❌ Uncaught Exception - Forçando shutdown'), stryMutAct_9fa48("4047") ? {} : (stryCov_9fa48("4047"), {
            error: error.message,
            stack: error.stack
          }));
          this.forceShutdown(1);
        }
      });

      // Unhandled promise rejections
      process.on(stryMutAct_9fa48("4048") ? "" : (stryCov_9fa48("4048"), 'unhandledRejection'), (reason: any) => {
        if (stryMutAct_9fa48("4049")) {
          {}
        } else {
          stryCov_9fa48("4049");
          log.error(stryMutAct_9fa48("4050") ? "" : (stryCov_9fa48("4050"), '❌ Unhandled Promise Rejection - Forçando shutdown'), stryMutAct_9fa48("4051") ? {} : (stryCov_9fa48("4051"), {
            reason: stryMutAct_9fa48("4052") ? reason.toString() : (stryCov_9fa48("4052"), reason?.toString())
          }));
          this.forceShutdown(1);
        }
      });

      // Rastrear conexões ativas
      this.server.on(stryMutAct_9fa48("4053") ? "" : (stryCov_9fa48("4053"), 'connection'), connection => {
        if (stryMutAct_9fa48("4054")) {
          {}
        } else {
          stryCov_9fa48("4054");
          this.activeConnections.add(connection);
          connection.on(stryMutAct_9fa48("4055") ? "" : (stryCov_9fa48("4055"), 'close'), () => {
            if (stryMutAct_9fa48("4056")) {
              {}
            } else {
              stryCov_9fa48("4056");
              this.activeConnections.delete(connection);
            }
          });
        }
      });
      log.info(stryMutAct_9fa48("4057") ? "" : (stryCov_9fa48("4057"), '✅ Graceful shutdown configurado'), stryMutAct_9fa48("4058") ? {} : (stryCov_9fa48("4058"), {
        timeout: stryMutAct_9fa48("4059") ? `` : (stryCov_9fa48("4059"), `${this.config.timeout}ms`),
        signals: stryMutAct_9fa48("4060") ? [] : (stryCov_9fa48("4060"), [stryMutAct_9fa48("4061") ? "" : (stryCov_9fa48("4061"), 'SIGTERM'), stryMutAct_9fa48("4062") ? "" : (stryCov_9fa48("4062"), 'SIGINT'), stryMutAct_9fa48("4063") ? "" : (stryCov_9fa48("4063"), 'SIGQUIT')])
      }));
    }
  }

  /**
   * Executa o shutdown gracioso
   */
  private async shutdown(signal: string): Promise<void> {
    if (stryMutAct_9fa48("4064")) {
      {}
    } else {
      stryCov_9fa48("4064");
      // Previne múltiplas execuções
      if (stryMutAct_9fa48("4066") ? false : stryMutAct_9fa48("4065") ? true : (stryCov_9fa48("4065", "4066"), this.isShuttingDown)) {
        if (stryMutAct_9fa48("4067")) {
          {}
        } else {
          stryCov_9fa48("4067");
          log.warn(stryMutAct_9fa48("4068") ? "" : (stryCov_9fa48("4068"), '⚠️  Shutdown já em andamento, ignorando sinal duplicado'), stryMutAct_9fa48("4069") ? {} : (stryCov_9fa48("4069"), {
            signal
          }));
          return;
        }
      }
      this.isShuttingDown = stryMutAct_9fa48("4070") ? false : (stryCov_9fa48("4070"), true);
      const startTime = Date.now();
      log.info(stryMutAct_9fa48("4071") ? "" : (stryCov_9fa48("4071"), '🛑 Iniciando processo de shutdown'), stryMutAct_9fa48("4072") ? {} : (stryCov_9fa48("4072"), {
        signal,
        activeConnections: this.activeConnections.size,
        timestamp: new Date().toISOString()
      }));

      // Callback de início
      try {
        if (stryMutAct_9fa48("4073")) {
          {}
        } else {
          stryCov_9fa48("4073");
          await this.config.onShutdownStart();
        }
      } catch (error) {
        if (stryMutAct_9fa48("4074")) {
          {}
        } else {
          stryCov_9fa48("4074");
          log.error(stryMutAct_9fa48("4075") ? "" : (stryCov_9fa48("4075"), 'Erro no callback onShutdownStart'), stryMutAct_9fa48("4076") ? {} : (stryCov_9fa48("4076"), {
            error
          }));
        }
      }

      // Timer de timeout
      this.shutdownTimer = setTimeout(() => {
        if (stryMutAct_9fa48("4077")) {
          {}
        } else {
          stryCov_9fa48("4077");
          log.warn(stryMutAct_9fa48("4078") ? `` : (stryCov_9fa48("4078"), `⏱️  Timeout de ${this.config.timeout}ms atingido - Forçando encerramento`));
          this.forceShutdown(0);
        }
      }, this.config.timeout);
      try {
        if (stryMutAct_9fa48("4079")) {
          {}
        } else {
          stryCov_9fa48("4079");
          // 1. Parar de aceitar novas conexões
          await this.closeHttpServer();

          // 2. Fechar conexões do banco de dados
          await this.closeDatabaseConnections();

          // 3. Cleanup customizado (se houver)
          await this.performCleanup();

          // Shutdown bem-sucedido
          const duration = stryMutAct_9fa48("4080") ? Date.now() + startTime : (stryCov_9fa48("4080"), Date.now() - startTime);
          log.info(stryMutAct_9fa48("4081") ? "" : (stryCov_9fa48("4081"), '✅ Graceful shutdown completo'), stryMutAct_9fa48("4082") ? {} : (stryCov_9fa48("4082"), {
            signal,
            duration: duration,
            timestamp: new Date().toISOString()
          }));

          // Callback de conclusão
          try {
            if (stryMutAct_9fa48("4083")) {
              {}
            } else {
              stryCov_9fa48("4083");
              await this.config.onShutdownComplete();
            }
          } catch (error) {
            if (stryMutAct_9fa48("4084")) {
              {}
            } else {
              stryCov_9fa48("4084");
              log.error(stryMutAct_9fa48("4085") ? "" : (stryCov_9fa48("4085"), 'Erro no callback onShutdownComplete'), stryMutAct_9fa48("4086") ? {} : (stryCov_9fa48("4086"), {
                error
              }));
            }
          }

          // Cancelar timer de timeout
          if (stryMutAct_9fa48("4088") ? false : stryMutAct_9fa48("4087") ? true : (stryCov_9fa48("4087", "4088"), this.shutdownTimer)) {
            if (stryMutAct_9fa48("4089")) {
              {}
            } else {
              stryCov_9fa48("4089");
              clearTimeout(this.shutdownTimer);
            }
          }

          // Encerrar processo
          process.exit(0);
        }
      } catch (error) {
        if (stryMutAct_9fa48("4090")) {
          {}
        } else {
          stryCov_9fa48("4090");
          log.error(stryMutAct_9fa48("4091") ? "" : (stryCov_9fa48("4091"), '❌ Erro durante graceful shutdown'), stryMutAct_9fa48("4092") ? {} : (stryCov_9fa48("4092"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("4093") ? "" : (stryCov_9fa48("4093"), 'Unknown error'),
            stack: error instanceof Error ? error.stack : undefined
          }));
          this.forceShutdown(1);
        }
      }
    }
  }

  /**
   * Fecha o servidor HTTP graciosamente
   */
  private closeHttpServer(): Promise<void> {
    if (stryMutAct_9fa48("4094")) {
      {}
    } else {
      stryCov_9fa48("4094");
      return new Promise((resolve, reject) => {
        if (stryMutAct_9fa48("4095")) {
          {}
        } else {
          stryCov_9fa48("4095");
          log.info(stryMutAct_9fa48("4096") ? "" : (stryCov_9fa48("4096"), '📡 Fechando servidor HTTP...'));

          // Para de aceitar novas conexões
          this.server.close(error => {
            if (stryMutAct_9fa48("4097")) {
              {}
            } else {
              stryCov_9fa48("4097");
              if (stryMutAct_9fa48("4099") ? false : stryMutAct_9fa48("4098") ? true : (stryCov_9fa48("4098", "4099"), error)) {
                if (stryMutAct_9fa48("4100")) {
                  {}
                } else {
                  stryCov_9fa48("4100");
                  log.error(stryMutAct_9fa48("4101") ? "" : (stryCov_9fa48("4101"), 'Erro ao fechar servidor HTTP'), stryMutAct_9fa48("4102") ? {} : (stryCov_9fa48("4102"), {
                    error: error.message
                  }));
                  reject(error);
                }
              } else {
                if (stryMutAct_9fa48("4103")) {
                  {}
                } else {
                  stryCov_9fa48("4103");
                  log.info(stryMutAct_9fa48("4104") ? "" : (stryCov_9fa48("4104"), '✅ Servidor HTTP fechado'), stryMutAct_9fa48("4105") ? {} : (stryCov_9fa48("4105"), {
                    activeConnections: this.activeConnections.size
                  }));
                  resolve();
                }
              }
            }
          });

          // Fechar conexões ativas após 5 segundos
          setTimeout(() => {
            if (stryMutAct_9fa48("4106")) {
              {}
            } else {
              stryCov_9fa48("4106");
              if (stryMutAct_9fa48("4110") ? this.activeConnections.size <= 0 : stryMutAct_9fa48("4109") ? this.activeConnections.size >= 0 : stryMutAct_9fa48("4108") ? false : stryMutAct_9fa48("4107") ? true : (stryCov_9fa48("4107", "4108", "4109", "4110"), this.activeConnections.size > 0)) {
                if (stryMutAct_9fa48("4111")) {
                  {}
                } else {
                  stryCov_9fa48("4111");
                  log.warn(stryMutAct_9fa48("4112") ? `` : (stryCov_9fa48("4112"), `⚠️  Forçando fechamento de ${this.activeConnections.size} conexões ativas`));
                  this.activeConnections.forEach(connection => {
                    if (stryMutAct_9fa48("4113")) {
                      {}
                    } else {
                      stryCov_9fa48("4113");
                      connection.destroy();
                    }
                  });
                  this.activeConnections.clear();
                }
              }
            }
          }, 5000);
        }
      });
    }
  }

  /**
   * Fecha conexões do banco de dados
   */
  private async closeDatabaseConnections(): Promise<void> {
    if (stryMutAct_9fa48("4114")) {
      {}
    } else {
      stryCov_9fa48("4114");
      log.info(stryMutAct_9fa48("4115") ? "" : (stryCov_9fa48("4115"), '🗄️  Fechando conexões do banco de dados...'));
      try {
        if (stryMutAct_9fa48("4116")) {
          {}
        } else {
          stryCov_9fa48("4116");
          await DatabaseManager.close();
          log.info(stryMutAct_9fa48("4117") ? "" : (stryCov_9fa48("4117"), '✅ Conexões do banco fechadas'));
        }
      } catch (error) {
        if (stryMutAct_9fa48("4118")) {
          {}
        } else {
          stryCov_9fa48("4118");
          log.error(stryMutAct_9fa48("4119") ? "" : (stryCov_9fa48("4119"), 'Erro ao fechar conexões do banco'), stryMutAct_9fa48("4120") ? {} : (stryCov_9fa48("4120"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("4121") ? "" : (stryCov_9fa48("4121"), 'Unknown error')
          }));
          throw error;
        }
      }
    }
  }

  /**
   * Cleanup customizado adicional
   */
  private async performCleanup(): Promise<void> {
    if (stryMutAct_9fa48("4122")) {
      {}
    } else {
      stryCov_9fa48("4122");
      log.info(stryMutAct_9fa48("4123") ? "" : (stryCov_9fa48("4123"), '🧹 Executando cleanup final...'));

      // Aguarda logs serem gravados
      await new Promise(stryMutAct_9fa48("4124") ? () => undefined : (stryCov_9fa48("4124"), resolve => setTimeout(resolve, 100)));
      log.info(stryMutAct_9fa48("4125") ? "" : (stryCov_9fa48("4125"), '✅ Cleanup completo'));
    }
  }

  /**
   * Força encerramento imediato
   */
  private forceShutdown(exitCode: number): void {
    if (stryMutAct_9fa48("4126")) {
      {}
    } else {
      stryCov_9fa48("4126");
      log.error(stryMutAct_9fa48("4127") ? "" : (stryCov_9fa48("4127"), '🔴 FORÇANDO ENCERRAMENTO IMEDIATO'), stryMutAct_9fa48("4128") ? {} : (stryCov_9fa48("4128"), {
        exitCode,
        timestamp: new Date().toISOString()
      }));

      // Cancela timer se existir
      if (stryMutAct_9fa48("4130") ? false : stryMutAct_9fa48("4129") ? true : (stryCov_9fa48("4129", "4130"), this.shutdownTimer)) {
        if (stryMutAct_9fa48("4131")) {
          {}
        } else {
          stryCov_9fa48("4131");
          clearTimeout(this.shutdownTimer);
        }
      }

      // Destrói todas as conexões
      this.activeConnections.forEach(connection => {
        if (stryMutAct_9fa48("4132")) {
          {}
        } else {
          stryCov_9fa48("4132");
          connection.destroy();
        }
      });

      // Aguarda logs serem gravados
      setTimeout(() => {
        if (stryMutAct_9fa48("4133")) {
          {}
        } else {
          stryCov_9fa48("4133");
          process.exit(exitCode);
        }
      }, 100);
    }
  }

  /**
   * Retorna status do shutdown
   */
  public getStatus(): {
    isShuttingDown: boolean;
    activeConnections: number;
  } {
    if (stryMutAct_9fa48("4134")) {
      {}
    } else {
      stryCov_9fa48("4134");
      return stryMutAct_9fa48("4135") ? {} : (stryCov_9fa48("4135"), {
        isShuttingDown: this.isShuttingDown,
        activeConnections: this.activeConnections.size
      });
    }
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
export function setupGracefulShutdown(server: Server, config?: ShutdownConfig): GracefulShutdown {
  if (stryMutAct_9fa48("4136")) {
    {}
  } else {
    stryCov_9fa48("4136");
    const shutdown = new GracefulShutdown(server, config);
    shutdown.init();
    return shutdown;
  }
}