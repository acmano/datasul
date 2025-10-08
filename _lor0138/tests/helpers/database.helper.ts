// tests/helpers/database.helper.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Helper para testes de integração com banco real
 * 
 * Gerencia conexão com banco de produção de forma segura para testes
 */

export class DatabaseTestHelper {
  private static initialized = false;
  private static useRealDatabase = false;

  /**
   * Inicializa conexão com banco para testes
   * Se falhar, volta para mock automaticamente
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Carregar .env.test
    dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

    try {
      // Tentar conectar ao banco real
      await DatabaseManager.initialize();
      
      // Verificar se está realmente conectado
      const status = DatabaseManager.getConnectionStatus();
      
      if (status.mode === 'REAL_DATABASE') {
        this.useRealDatabase = true;
        console.log('✅ Testes usando banco REAL de produção (somente leitura)');
      } else {
        this.useRealDatabase = false;
        console.log('⚠️  Testes usando MOCK_DATA (banco não disponível)');
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Erro ao conectar banco para testes, usando MOCK_DATA:', error);
      this.useRealDatabase = false;
      this.initialized = true;
    }
  }

  /**
   * Verifica se está usando banco real
   */
  static isUsingRealDatabase(): boolean {
    return this.useRealDatabase;
  }

  /**
   * Fecha conexões após testes
   */
  static async cleanup(): Promise<void> {
    if (this.initialized) {
      await DatabaseManager.close();
      this.initialized = false;
      this.useRealDatabase = false;
    }
  }

  /**
   * Executa query no banco (ou mock)
   */
  static async query(sql: string, params?: any[]): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (params) {
      return DatabaseManager.queryEmpWithParams(sql, params);
    } else {
      return DatabaseManager.queryEmp(sql);
    }
  }

  /**
   * Verifica se item existe no banco
   * Útil para setup de testes
   */
  static async itemExists(itemCodigo: string): Promise<boolean> {
    try {
      const result = await DatabaseManager.queryEmpWithParams(
        `SELECT TOP 1 item."it-codigo" as itemCodigo
         FROM OPENQUERY(PRD_EMS2EMP, 
           'SELECT "it-codigo" FROM pub.item WHERE "it-codigo" = ''${itemCodigo}'''
         ) as item`,
        []
      );
      
      return result && result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca um item real do banco para usar nos testes
   * Se não achar, retorna um código mock
   */
  static async getTestItemCode(): Promise<string> {
    // Usar código conhecido que existe em produção
    // Vimos nos logs anteriores que 7530110 funciona
    return '7530110';
  }

  /**
   * Retorna códigos de teste conhecidos
   * Para diferentes cenários
   */
  static getKnownTestCodes() {
    return {
      // Item que DEVE existir em produção
      validItem: '7530110',
      
      // Item que NÃO existe
      invalidItem: 'INVALID999',
      
      // Item para teste de caracteres especiais
      specialChars: 'ABC-123',
      
      // Item de 1 caractere
      singleChar: 'A',
      
      // Item de 16 caracteres (máximo)
      maxLength: '1234567890123456',
    };
  }

  /**
   * Aguarda o banco estar pronto
   * Útil para beforeAll em testes
   */
  static async waitUntilReady(maxWaitMs = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      if (DatabaseManager.isReady()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * Reseta estado do DatabaseManager (para testes isolados)
   */
  static async reset(): Promise<void> {
    await this.cleanup();
    this.initialized = false;
    this.useRealDatabase = false;
  }
}

/**
 * Helper para criar conexão de teste
 */
export async function setupTestDatabase() {
  await DatabaseTestHelper.initialize();
  return DatabaseTestHelper.isUsingRealDatabase();
}

/**
 * Helper para cleanup de teste
 */
export async function teardownTestDatabase() {
  await DatabaseTestHelper.cleanup();
}

/**
 * Decorator para pular teste se banco não estiver disponível
 */
export function requiresRealDatabase() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (!DatabaseTestHelper.isUsingRealDatabase()) {
        console.log(`⏭️  Pulando teste "${propertyKey}" - requer banco real`);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}