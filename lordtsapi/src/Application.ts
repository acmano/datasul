// src/Application.ts

/**
 * Application Wrapper for Testing
 *
 * Esta classe serve como wrapper da classe App para compatibilidade com testes de integração.
 * Fornece métodos de lifecycle (initialize, shutdown) esperados pelos testes.
 *
 * @module Application
 * @since 1.0.0
 */

import { Application as ExpressApplication } from 'express';
import { App } from './app';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { CacheManager } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';

export class Application {
  private app: App;
  private _isInitialized: boolean = false;

  constructor() {
    this.app = new App();
  }

  /**
   * Inicializa a aplicação e suas dependências
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      log.warn('Application já foi inicializada');
      return;
    }

    try {
      // DatabaseManager e CacheManager são inicializados sob demanda
      // Não há necessidade de inicialização explícita aqui
      this._isInitialized = true;
      log.info('✅ Application inicializada com sucesso');
    } catch (error) {
      log.error('Erro ao inicializar Application', { error });
      throw error;
    }
  }

  /**
   * Retorna o servidor Express para uso em testes
   */
  getServer(): ExpressApplication {
    return this.app.getExpressApp();
  }

  /**
   * Encerra a aplicação e suas dependências
   */
  async shutdown(): Promise<void> {
    if (!this._isInitialized) {
      log.warn('Application não estava inicializada');
      return;
    }

    try {
      // Fechar conexões do DatabaseManager
      await DatabaseManager.close();

      // Fechar CacheManager
      await CacheManager.close();

      this._isInitialized = false;
      log.info('✅ Application encerrada com sucesso');
    } catch (error) {
      log.error('Erro ao encerrar Application', { error });
      // Não propagar erro no shutdown
      log.warn('Erro ignorado no shutdown');
    }
  }

  /**
   * Verifica se a aplicação está inicializada
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }
}
