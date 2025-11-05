// src/infrastructure/database/connections/__tests__/OdbcConnection.test.ts

/**
 * @fileoverview Unit tests for OdbcConnection with dynamic DSN support
 *
 * Tests the updated OdbcConnection class with:
 * - New constructor with DSN parameter
 * - Connection string building
 * - Options handling
 * - Metadata properties
 * - Error tracking
 *
 * @module infrastructure/database/connections/__tests__
 */

import { OdbcConnection } from '../OdbcConnection';
import odbc from 'odbc';

// Mock ODBC library
jest.mock('odbc');
jest.mock('@shared/utils/logger');
jest.mock('@shared/utils/retry', () => ({
  retryWithBackoff: jest.fn((fn) => fn()),
  isRetryableError: jest.fn().mockReturnValue(true),
}));

describe('OdbcConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
  });

  afterEach(() => {
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
  });

  describe('Constructor', () => {
    it('deve criar instância com DSN simples', () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      expect(conn.dsn).toBe('DtsPrdEmp');
      expect(conn.lastError).toBeUndefined();
    });

    it('deve construir connection string a partir de DSN e credenciais do ambiente', () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      // Access private property for testing
      const connStr = (conn as any).connectionString;

      expect(connStr).toContain('DSN=DtsPrdEmp');
      expect(connStr).toContain('UID=testuser');
      expect(connStr).toContain('PWD=testpass');
    });

    it('deve aceitar credenciais customizadas via options', () => {
      const conn = new OdbcConnection('DtsTstEmp', {
        username: 'customuser',
        password: 'custompass',
      });

      const connStr = (conn as any).connectionString;

      expect(connStr).toContain('UID=customuser');
      expect(connStr).toContain('PWD=custompass');
    });

    it('deve aceitar driver customizado via options', () => {
      const conn = new OdbcConnection('DtsHmlEmp', {
        driver: '/custom/path/pgoe27.so',
      });

      const connStr = (conn as any).connectionString;

      expect(connStr).toContain('DSN=DtsHmlEmp');
      expect(connStr).toContain('DRIVER=/custom/path/pgoe27.so');
    });

    it('deve aceitar connection string override completa via options', () => {
      const customConnStr = 'DSN=CustomDSN;UID=admin;PWD=admin123;DRIVER=/path/driver.so';

      const conn = new OdbcConnection('DtsPrdEmp', {
        connectionString: customConnStr,
      });

      const connStr = (conn as any).connectionString;

      expect(connStr).toBe(customConnStr);
    });

    it('deve criar connection string sem credenciais se não fornecidas', () => {
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;

      const conn = new OdbcConnection('LgxDev', {});

      const connStr = (conn as any).connectionString;

      expect(connStr).toBe('DSN=LgxDev');
      expect(connStr).not.toContain('UID=');
      expect(connStr).not.toContain('PWD=');
    });

    it('deve priorizar options sobre variáveis de ambiente', () => {
      process.env.DB_USER = 'envuser';
      process.env.DB_PASSWORD = 'envpass';

      const conn = new OdbcConnection('DtsPrdMult', {
        username: 'optuser',
        password: 'optpass',
      });

      const connStr = (conn as any).connectionString;

      expect(connStr).toContain('UID=optuser');
      expect(connStr).toContain('PWD=optpass');
      expect(connStr).not.toContain('envuser');
      expect(connStr).not.toContain('envpass');
    });

    it('deve inicializar com lastError undefined', () => {
      const conn = new OdbcConnection('DtsPrdEmp');
      expect(conn.lastError).toBeUndefined();
    });
  });

  describe('buildConnectionString', () => {
    it('deve construir connection string com todos os componentes', () => {
      const conn = new OdbcConnection('DtsPrdEmp', {
        username: 'user1',
        password: 'pass1',
        driver: '/usr/dlc/odbc/lib/pgoe27.so',
      });

      const connStr = (conn as any).connectionString;

      expect(connStr).toContain('DSN=DtsPrdEmp');
      expect(connStr).toContain('UID=user1');
      expect(connStr).toContain('PWD=pass1');
      expect(connStr).toContain('DRIVER=/usr/dlc/odbc/lib/pgoe27.so');
    });

    it('deve separar componentes com ponto e vírgula', () => {
      const conn = new OdbcConnection('DtsTstEmp', {
        username: 'testuser',
        password: 'testpass',
      });

      const connStr = (conn as any).connectionString;
      const parts = connStr.split(';');

      expect(parts).toContain('DSN=DtsTstEmp');
      expect(parts).toContain('UID=testuser');
      expect(parts).toContain('PWD=testpass');
    });

    it('deve construir connection string mínima apenas com DSN', () => {
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;

      const conn = new OdbcConnection('LgxPrd', {});

      const connStr = (conn as any).connectionString;

      expect(connStr).toBe('DSN=LgxPrd');
    });
  });

  describe('sanitizeConnectionString', () => {
    it('deve mascarar senha na connection string para logging', () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      const sanitized = (conn as any).sanitizeConnectionString(
        'DSN=DtsPrdEmp;UID=totvs;PWD=senha123'
      );

      expect(sanitized).toBe('DSN=DtsPrdEmp;UID=totvs;PWD=***');
    });

    it('deve mascarar senha case-insensitive', () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      const sanitized = (conn as any).sanitizeConnectionString(
        'DSN=DtsPrdEmp;UID=totvs;pwd=senha123'
      );

      expect(sanitized).toBe('DSN=DtsPrdEmp;UID=totvs;PWD=***');
    });

    it('deve preservar connection string sem senha', () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      const sanitized = (conn as any).sanitizeConnectionString('DSN=DtsPrdEmp;UID=totvs');

      expect(sanitized).toBe('DSN=DtsPrdEmp;UID=totvs');
    });
  });

  describe('connect', () => {
    it('deve conectar com sucesso e limpar lastError', async () => {
      const mockOdbcConnection = {
        query: jest.fn(),
        close: jest.fn(),
      };

      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');
      await conn.connect();

      expect(odbc.connect).toHaveBeenCalled();
      expect(conn.isConnected()).toBe(true);
      expect(conn.lastError).toBeUndefined();
    });

    it('deve passar connection string correta para odbc.connect', async () => {
      const mockOdbcConnection = {};
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsTstEmp', {
        username: 'test',
        password: 'pass',
      });

      await conn.connect();

      expect(odbc.connect).toHaveBeenCalledWith(expect.stringContaining('DSN=DtsTstEmp'));
      expect(odbc.connect).toHaveBeenCalledWith(expect.stringContaining('UID=test'));
      expect(odbc.connect).toHaveBeenCalledWith(expect.stringContaining('PWD=pass'));
    });

    it('deve atualizar lastError em caso de falha', async () => {
      const connectionError = new Error('Connection timeout');
      (odbc.connect as jest.Mock).mockRejectedValue(connectionError);

      const conn = new OdbcConnection('DtsHmlEmp');

      await expect(conn.connect()).rejects.toThrow('Connection timeout');
      expect(conn.lastError).toBeDefined();
      expect(conn.lastError?.message).toBe('Connection timeout');
    });

    it('deve propagar erro de conexão', async () => {
      (odbc.connect as jest.Mock).mockRejectedValue(new Error('Data source name not found'));

      const conn = new OdbcConnection('InvalidDSN');

      await expect(conn.connect()).rejects.toThrow('Data source name not found');
    });

    it('deve conectar com custom DSN via options.connectionString', async () => {
      const customConnStr = 'DSN=CustomDSN;UID=admin;PWD=admin';
      const mockOdbcConnection = {};
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp', {
        connectionString: customConnStr,
      });

      await conn.connect();

      expect(odbc.connect).toHaveBeenCalledWith(customConnStr);
    });
  });

  describe('isConnected', () => {
    it('deve retornar false antes de conectar', () => {
      const conn = new OdbcConnection('DtsPrdEmp');
      expect(conn.isConnected()).toBe(false);
    });

    it('deve retornar true após conectar com sucesso', async () => {
      const mockOdbcConnection = {};
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsTstEmp');
      await conn.connect();

      expect(conn.isConnected()).toBe(true);
    });

    it('deve retornar false após fechar conexão', async () => {
      const mockOdbcConnection = {
        close: jest.fn().mockResolvedValue(undefined),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsHmlEmp');
      await conn.connect();
      await conn.close();

      expect(conn.isConnected()).toBe(false);
    });
  });

  describe('query', () => {
    it('deve executar query com sucesso', async () => {
      const mockResult = [{ id: 1, name: 'Test' }];
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue(mockResult),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');
      await conn.connect();

      const result = await conn.query('SELECT * FROM item');

      expect(mockOdbcConnection.query).toHaveBeenCalledWith('SELECT * FROM item');
      expect(result).toEqual(mockResult);
    });

    it('deve lançar erro quando não conectado', async () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      await expect(conn.query('SELECT 1')).rejects.toThrow(
        'DSN DtsPrdEmp: Conexão não inicializada'
      );
    });

    it('deve atualizar lastError em caso de falha na query', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockRejectedValue(new Error('Syntax error')),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsTstEmp');
      await conn.connect();

      await expect(conn.query('INVALID SQL')).rejects.toThrow('Syntax error');
      expect(conn.lastError).toBeDefined();
      expect(conn.lastError?.message).toBe('Syntax error');
    });

    it('deve incluir DSN na mensagem de erro', async () => {
      const conn = new OdbcConnection('DtsHmlEmp');

      try {
        await conn.query('SELECT 1');
      } catch (error) {
        expect((error as Error).message).toContain('DtsHmlEmp');
      }
    });
  });

  describe('queryWithParams', () => {
    it('deve executar query parametrizada com sucesso', async () => {
      const mockResult = [{ id: 1, codigo: '7530110' }];
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue(mockResult),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');
      await conn.connect();

      const result = await conn.queryWithParams('SELECT * FROM item WHERE "it-codigo" = ?', [
        { name: 'codigo', type: 'varchar', value: '7530110' },
      ]);

      expect(mockOdbcConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM item WHERE "it-codigo" = ?',
        ['7530110']
      );
      expect(result).toEqual(mockResult);
    });

    it('deve extrair valores dos parâmetros na ordem correta', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue([]),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsTstEmp');
      await conn.connect();

      await conn.queryWithParams('SELECT * FROM item WHERE grupo = ? AND obsoleto = ?', [
        { name: 'grupo', type: 'int', value: 1 },
        { name: 'obsoleto', type: 'int', value: 0 },
      ]);

      expect(mockOdbcConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM item WHERE grupo = ? AND obsoleto = ?',
        [1, 0]
      );
    });

    it('deve lançar erro quando não conectado', async () => {
      const conn = new OdbcConnection('DtsPrdEmp');

      await expect(
        conn.queryWithParams('SELECT 1 WHERE id = ?', [{ name: 'id', type: 'int', value: 1 }])
      ).rejects.toThrow('DSN DtsPrdEmp: Conexão não inicializada');
    });

    it('deve atualizar lastError em caso de falha', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockRejectedValue(new Error('Invalid parameter')),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsHmlEmp');
      await conn.connect();

      await expect(
        conn.queryWithParams('SELECT * WHERE id = ?', [{ name: 'id', type: 'int', value: 1 }])
      ).rejects.toThrow('Invalid parameter');

      expect(conn.lastError).toBeDefined();
      expect(conn.lastError?.message).toBe('Invalid parameter');
    });

    it('deve suportar múltiplos parâmetros', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue([]),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdMult');
      await conn.connect();

      const params = [
        { name: 'p1', type: 'varchar', value: 'ABC' },
        { name: 'p2', type: 'int', value: 123 },
        { name: 'p3', type: 'decimal', value: 45.67 },
      ];

      await conn.queryWithParams('SELECT * WHERE c1 = ? AND c2 = ? AND c3 = ?', params);

      expect(mockOdbcConnection.query).toHaveBeenCalledWith(
        'SELECT * WHERE c1 = ? AND c2 = ? AND c3 = ?',
        ['ABC', 123, 45.67]
      );
    });

    it('deve suportar query sem parâmetros (array vazio)', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue([]),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('LgxDev');
      await conn.connect();

      await conn.queryWithParams('SELECT * FROM item', []);

      expect(mockOdbcConnection.query).toHaveBeenCalledWith('SELECT * FROM item', []);
    });
  });

  describe('close', () => {
    it('deve fechar conexão com sucesso', async () => {
      const mockOdbcConnection = {
        close: jest.fn().mockResolvedValue(undefined),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');
      await conn.connect();
      await conn.close();

      expect(mockOdbcConnection.close).toHaveBeenCalled();
      expect(conn.isConnected()).toBe(false);
    });

    it('não deve lançar erro quando conexão já está fechada', async () => {
      const conn = new OdbcConnection('DtsTstEmp');

      await expect(conn.close()).resolves.not.toThrow();
    });

    it('deve atualizar lastError em caso de falha ao fechar', async () => {
      const mockOdbcConnection = {
        close: jest.fn().mockRejectedValue(new Error('Close failed')),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsHmlEmp');
      await conn.connect();

      await expect(conn.close()).rejects.toThrow('Close failed');
      expect(conn.lastError).toBeDefined();
      expect(conn.lastError?.message).toBe('Close failed');
    });

    it('deve incluir DSN em mensagens de erro ao fechar', async () => {
      const mockOdbcConnection = {
        close: jest.fn().mockRejectedValue(new Error('Error')),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdMult');
      await conn.connect();

      try {
        await conn.close();
      } catch (error) {
        expect((error as Error).message).toBe('Error');
      }
    });
  });

  describe('healthCheck', () => {
    it('deve retornar connected: true e responseTime para conexão saudável', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue([{ health: 1 }]),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');
      await conn.connect();

      const result = await conn.healthCheck();

      expect(result.connected).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(mockOdbcConnection.query).toHaveBeenCalledWith('SELECT 1 AS health');
    });

    it('deve retornar connected: false quando não conectado', async () => {
      const conn = new OdbcConnection('DtsTstEmp');

      const result = await conn.healthCheck();

      expect(result.connected).toBe(false);
      expect(result.responseTime).toBe(0);
    });

    it('deve retornar connected: false e atualizar lastError em caso de falha', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockRejectedValue(new Error('Database unavailable')),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsHmlEmp');
      await conn.connect();

      const result = await conn.healthCheck();

      expect(result.connected).toBe(false);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(conn.lastError).toBeDefined();
      expect(conn.lastError?.message).toBe('Database unavailable');
    });

    it('deve medir responseTime corretamente', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return [{ health: 1 }];
        }),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('LgxPrd');
      await conn.connect();

      const result = await conn.healthCheck();

      expect(result.connected).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Metadata Properties', () => {
    it('deve expor propriedade dsn publicamente', () => {
      const conn = new OdbcConnection('DtsPrdEmp');
      expect(conn.dsn).toBe('DtsPrdEmp');
    });

    it('deve expor propriedade lastError publicamente', () => {
      const conn = new OdbcConnection('DtsTstEmp');
      expect(conn.lastError).toBeUndefined();
    });

    it('deve atualizar lastError quando operações falham', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockRejectedValue(new Error('Test error')),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsHmlEmp');
      await conn.connect();

      try {
        await conn.query('INVALID');
      } catch {
        // Error expected
      }

      expect(conn.lastError).toBeDefined();
      expect(conn.lastError).toBeInstanceOf(Error);
      expect(conn.lastError?.message).toBe('Test error');
    });

    it('deve limpar lastError em operações bem-sucedidas', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockResolvedValue([]),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');

      // Simula erro anterior
      (conn as any).lastError = new Error('Previous error');

      await conn.connect();

      expect(conn.lastError).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com DSN vazio', () => {
      const conn = new OdbcConnection('');
      expect(conn.dsn).toBe('');

      const connStr = (conn as any).connectionString;
      expect(connStr).toContain('DSN=');
    });

    it('deve lidar com DSN com caracteres especiais', () => {
      const conn = new OdbcConnection('DSN-With_Special.Chars');
      expect(conn.dsn).toBe('DSN-With_Special.Chars');
    });

    it('deve lidar com senha contendo caracteres especiais', () => {
      const conn = new OdbcConnection('DtsPrdEmp', {
        username: 'user',
        password: 'p@ssw0rd!#$%',
      });

      const connStr = (conn as any).connectionString;
      expect(connStr).toContain('PWD=p@ssw0rd!#$%');
    });

    it('deve lidar com timeout option', () => {
      const conn = new OdbcConnection('DtsPrdEmp', {
        timeout: 30000,
      });

      expect((conn as any).options.timeout).toBe(30000);
    });

    it('deve converter erros não-Error para Error objects', async () => {
      const mockOdbcConnection = {
        query: jest.fn().mockRejectedValue('String error'),
      };
      (odbc.connect as jest.Mock).mockResolvedValue(mockOdbcConnection);

      const conn = new OdbcConnection('DtsPrdEmp');
      await conn.connect();

      try {
        await conn.query('SELECT 1');
      } catch {
        // Error expected
      }

      expect(conn.lastError).toBeDefined();
      expect(conn.lastError).toBeInstanceOf(Error);
      expect(conn.lastError?.message).toBe('String error');
    });
  });
});
