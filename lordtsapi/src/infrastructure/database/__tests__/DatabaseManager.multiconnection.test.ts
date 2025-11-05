// src/infrastructure/database/__tests__/DatabaseManager.multiconnection.test.ts

/**
 * @fileoverview Unit tests for DatabaseManager multi-connection support
 *
 * Tests all new multi-connection features added in v2.0:
 * - getConnectionByDSN()
 * - getConnectionByEnvironment()
 * - queryWithConnection()
 * - Connection pooling and lifecycle
 * - Health checking
 * - Error handling
 * - Backward compatibility
 *
 * @module infrastructure/database/__tests__
 */

// Mock MUST be before imports
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@infrastructure/metrics/helpers/databaseMetrics', () => ({
  DatabaseMetricsHelper: {
    setActiveConnections: jest.fn(),
    recordConnectionError: jest.fn(),
    instrumentQuery: jest.fn((db, sql, fn) => fn()),
  },
}));

jest.mock('../connections/OdbcConnection');
jest.mock('../connections/MockConnection');

// Mock connections.config.ts helper functions
jest.mock('@config/connections.config', () => {
  const original = jest.requireActual('@config/connections.config');
  return {
    ...original,
    findConnectionByDSN: jest.fn(),
    AVAILABLE_CONNECTIONS: original.AVAILABLE_CONNECTIONS,
  };
});

import { DatabaseManager } from '../DatabaseManager';
import { OdbcConnection } from '../connections/OdbcConnection';
import { MockConnection } from '../connections/MockConnection';
import { findConnectionByDSN, AVAILABLE_CONNECTIONS } from '@config/connections.config';

describe('DatabaseManager - Multi-Connection Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton state
    (DatabaseManager as any).connectionPool = new Map();
    (DatabaseManager as any).useMockData = false;
  });

  describe('getConnectionByDSN', () => {
    it('deve criar nova conexão quando DSN não existe no pool', async () => {
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
        hostname: '189.126.146.38',
        port: 40002,
        database: 'ems2emp',
        purpose: 'emp',
        metadata: {
          readOnly: true,
          driver: '/usr/dlc/odbc/lib/pgoe27.so',
          defaultSchema: 'pub',
          useWideCharacterTypes: true,
        },
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);

      const mockOdbcInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(true),
      };

      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockOdbcInstance as any
      );

      const connection = await DatabaseManager.getConnectionByDSN('DtsPrdEmp');

      expect(findConnectionByDSN).toHaveBeenCalledWith('DtsPrdEmp');
      expect(OdbcConnection).toHaveBeenCalledWith('DtsPrdEmp', {
        driver: mockConfig.metadata.driver,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      expect(mockOdbcInstance.connect).toHaveBeenCalled();
      expect(connection).toBe(mockOdbcInstance);
    });

    it('deve reutilizar conexão existente do pool', async () => {
      const mockConfig = {
        dsn: 'DtsTstEmp',
        description: 'Datasul Test - Empresa',
        systemType: 'datasul',
        environment: 'test',
        metadata: { readOnly: true, driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockConnection = {
        connect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
      };

      // Simula conexão já existente no pool
      const poolEntry = {
        connection: mockConnection,
        config: mockConfig,
        lastUsed: new Date(),
        activeQueries: 0,
      };

      (DatabaseManager as any).connectionPool.set('DtsTstEmp', poolEntry);

      const connection = await DatabaseManager.getConnectionByDSN('DtsTstEmp');

      expect(connection).toBe(mockConnection);
      expect(findConnectionByDSN).not.toHaveBeenCalled();
      expect(OdbcConnection).not.toHaveBeenCalled();
      expect(mockConnection.connect).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando DSN não é encontrado na configuração', async () => {
      (findConnectionByDSN as jest.Mock).mockReturnValue(null);

      await expect(DatabaseManager.getConnectionByDSN('InvalidDSN')).rejects.toThrow(
        "DSN 'InvalidDSN' não encontrado em connections.config.ts"
      );
    });

    it('deve retornar MockConnection quando useMockData está ativo', async () => {
      (DatabaseManager as any).useMockData = true;

      const mockConnectionInstance = new MockConnection();
      (MockConnection as jest.MockedClass<typeof MockConnection>).mockImplementation(
        () => mockConnectionInstance
      );

      const connection = await DatabaseManager.getConnectionByDSN('DtsPrdEmp');

      expect(connection).toBeInstanceOf(MockConnection);
      expect(findConnectionByDSN).not.toHaveBeenCalled();
    });

    it('deve atualizar lastUsed quando reutiliza conexão', async () => {
      const mockConfig = {
        dsn: 'DtsHmlEmp',
        description: 'Datasul Homologation - Empresa',
      };

      const mockConnection = { isConnected: jest.fn().mockReturnValue(true) };
      const oldDate = new Date('2025-01-01');

      const poolEntry = {
        connection: mockConnection,
        config: mockConfig,
        lastUsed: oldDate,
        activeQueries: 0,
      };

      (DatabaseManager as any).connectionPool.set('DtsHmlEmp', poolEntry);

      await DatabaseManager.getConnectionByDSN('DtsHmlEmp');

      const updatedEntry = (DatabaseManager as any).connectionPool.get('DtsHmlEmp');
      expect(updatedEntry.lastUsed).not.toEqual(oldDate);
      expect(updatedEntry.lastUsed.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('deve adicionar conexão ao pool após criação bem-sucedida', async () => {
      const mockConfig = {
        dsn: 'LgxDev',
        description: 'Logix Development',
        systemType: 'informix',
        metadata: { readOnly: true, driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so' },
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);

      const mockOdbcInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
      };

      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockOdbcInstance as any
      );

      await DatabaseManager.getConnectionByDSN('LgxDev');

      const poolEntry = (DatabaseManager as any).connectionPool.get('LgxDev');
      expect(poolEntry).toBeDefined();
      expect(poolEntry.connection).toBe(mockOdbcInstance);
      expect(poolEntry.config).toBe(mockConfig);
      expect(poolEntry.activeQueries).toBe(0);
    });

    it('deve propagar erro quando conexão falha', async () => {
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);

      const connectionError = new Error('Connection timeout');
      const mockOdbcInstance = {
        connect: jest.fn().mockRejectedValue(connectionError),
      };

      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockOdbcInstance as any
      );

      await expect(DatabaseManager.getConnectionByDSN('DtsPrdEmp')).rejects.toThrow(
        'Connection timeout'
      );
    });
  });

  describe('getConnectionByEnvironment', () => {
    beforeEach(() => {
      const mockOdbcInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
      };

      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockOdbcInstance as any
      );
    });

    describe('Datasul connections', () => {
      it('deve retornar conexão Datasul Production EMP', async () => {
        const expectedConfig = AVAILABLE_CONNECTIONS.datasul.production.emp;
        (findConnectionByDSN as jest.Mock).mockReturnValue(expectedConfig);

        const conn = await DatabaseManager.getConnectionByEnvironment(
          'datasul',
          'production',
          'emp'
        );

        expect(findConnectionByDSN).toHaveBeenCalledWith(expectedConfig.dsn);
        expect(conn).toBeDefined();
      });

      it('deve retornar conexão Datasul Test MULT', async () => {
        const expectedConfig = AVAILABLE_CONNECTIONS.datasul.test.mult;
        (findConnectionByDSN as jest.Mock).mockReturnValue(expectedConfig);

        const conn = await DatabaseManager.getConnectionByEnvironment('datasul', 'test', 'mult');

        expect(findConnectionByDSN).toHaveBeenCalledWith(expectedConfig.dsn);
      });

      it('deve retornar conexão Datasul Homologation FND', async () => {
        const expectedConfig = AVAILABLE_CONNECTIONS.datasul.homologation.fnd;
        (findConnectionByDSN as jest.Mock).mockReturnValue(expectedConfig);

        const conn = await DatabaseManager.getConnectionByEnvironment(
          'datasul',
          'homologation',
          'fnd'
        );

        expect(findConnectionByDSN).toHaveBeenCalledWith(expectedConfig.dsn);
      });

      it('deve aceitar aliases de ambiente (prod, tst, hml)', async () => {
        const prodConfig = AVAILABLE_CONNECTIONS.datasul.production.emp;
        const testConfig = AVAILABLE_CONNECTIONS.datasul.test.emp;
        const hmlConfig = AVAILABLE_CONNECTIONS.datasul.homologation.emp;

        (findConnectionByDSN as jest.Mock)
          .mockReturnValueOnce(prodConfig)
          .mockReturnValueOnce(testConfig)
          .mockReturnValueOnce(hmlConfig);

        await DatabaseManager.getConnectionByEnvironment('datasul', 'prod', 'emp');
        expect(findConnectionByDSN).toHaveBeenCalledWith(prodConfig.dsn);

        await DatabaseManager.getConnectionByEnvironment('datasul', 'tst', 'emp');
        expect(findConnectionByDSN).toHaveBeenCalledWith(testConfig.dsn);

        await DatabaseManager.getConnectionByEnvironment('datasul', 'hml', 'emp');
        expect(findConnectionByDSN).toHaveBeenCalledWith(hmlConfig.dsn);
      });

      it('deve lançar erro quando dbType não é fornecido para Datasul', async () => {
        await expect(
          DatabaseManager.getConnectionByEnvironment('datasul', 'production', undefined)
        ).rejects.toThrow('dbType é obrigatório para conexões Datasul');
      });

      it('deve lançar erro quando ambiente Datasul é inválido', async () => {
        await expect(
          DatabaseManager.getConnectionByEnvironment('datasul', 'invalid', 'emp')
        ).rejects.toThrow('Ambiente Datasul inválido: invalid');
      });

      it('deve lançar erro quando dbType é inválido', async () => {
        await expect(
          DatabaseManager.getConnectionByEnvironment('datasul', 'production', 'invalid')
        ).rejects.toThrow('Tipo de database inválido: invalid');
      });
    });

    describe('Informix connections', () => {
      it('deve retornar conexão Informix Development', async () => {
        const expectedConfig = AVAILABLE_CONNECTIONS.informix.development.logix;
        (findConnectionByDSN as jest.Mock).mockReturnValue(expectedConfig);

        const conn = await DatabaseManager.getConnectionByEnvironment('informix', 'development');

        expect(findConnectionByDSN).toHaveBeenCalledWith(expectedConfig.dsn);
      });

      it('deve retornar conexão Informix Production', async () => {
        const expectedConfig = AVAILABLE_CONNECTIONS.informix.production.logix;
        (findConnectionByDSN as jest.Mock).mockReturnValue(expectedConfig);

        const conn = await DatabaseManager.getConnectionByEnvironment('informix', 'production');

        expect(findConnectionByDSN).toHaveBeenCalledWith(expectedConfig.dsn);
      });

      it('deve retornar conexão Informix Atualização', async () => {
        const expectedConfig = AVAILABLE_CONNECTIONS.informix.atualização.logix;
        (findConnectionByDSN as jest.Mock).mockReturnValue(expectedConfig);

        const conn = await DatabaseManager.getConnectionByEnvironment('informix', 'atualização');

        expect(findConnectionByDSN).toHaveBeenCalledWith(expectedConfig.dsn);
      });

      it('deve aceitar aliases de ambiente (dev, atu, prd)', async () => {
        const devConfig = AVAILABLE_CONNECTIONS.informix.development.logix;
        const atuConfig = AVAILABLE_CONNECTIONS.informix.atualização.logix;
        const prdConfig = AVAILABLE_CONNECTIONS.informix.production.logix;

        (findConnectionByDSN as jest.Mock)
          .mockReturnValueOnce(devConfig)
          .mockReturnValueOnce(atuConfig)
          .mockReturnValueOnce(prdConfig);

        await DatabaseManager.getConnectionByEnvironment('informix', 'dev');
        expect(findConnectionByDSN).toHaveBeenCalledWith(devConfig.dsn);

        await DatabaseManager.getConnectionByEnvironment('informix', 'atu');
        expect(findConnectionByDSN).toHaveBeenCalledWith(atuConfig.dsn);

        await DatabaseManager.getConnectionByEnvironment('informix', 'prod');
        expect(findConnectionByDSN).toHaveBeenCalledWith(prdConfig.dsn);
      });

      it('deve lançar erro quando ambiente Informix é inválido', async () => {
        await expect(
          DatabaseManager.getConnectionByEnvironment('informix', 'invalid')
        ).rejects.toThrow('Ambiente Informix inválido: invalid');
      });
    });

    it('deve lançar erro quando sistema é inválido', async () => {
      await expect(
        DatabaseManager.getConnectionByEnvironment('invalid' as any, 'production', 'emp')
      ).rejects.toThrow('Sistema inválido: invalid');
    });
  });

  describe('queryWithConnection', () => {
    it('deve executar query com parâmetros usando conexão especificada', async () => {
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockResult = [{ id: 1, name: 'Test Item' }];
      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        queryWithParams: jest.fn().mockResolvedValue(mockResult),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      const sql = 'SELECT * FROM item WHERE "it-codigo" = ?';
      const params = [{ name: 'codigo', type: 'varchar', value: '7530110' }];

      const result = await DatabaseManager.queryWithConnection('DtsPrdEmp', sql, params);

      expect(mockConnection.queryWithParams).toHaveBeenCalledWith(sql, params);
      expect(result).toEqual(mockResult);
    });

    it('deve executar query sem parâmetros usando conexão especificada', async () => {
      const mockConfig = {
        dsn: 'DtsTstEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockResult = [{ count: 100 }];
      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue(mockResult),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      const sql = 'SELECT COUNT(*) as count FROM item';

      const result = await DatabaseManager.queryWithConnection('DtsTstEmp', sql);

      expect(mockConnection.query).toHaveBeenCalledWith(sql);
      expect(result).toEqual(mockResult);
    });

    it('deve decrementar contador de queries ativas após conclusão', async () => {
      const mockConfig = {
        dsn: 'DtsHmlEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([]),
        queryWithParams: jest.fn().mockResolvedValue([]),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      await DatabaseManager.queryWithConnection('DtsHmlEmp', 'SELECT 1', []);

      // Deve decrementar após conclusão
      const poolEntry = (DatabaseManager as any).connectionPool.get('DtsHmlEmp');
      expect(poolEntry.activeQueries).toBe(0);
    });

    it('deve decrementar contador de queries ativas mesmo em caso de erro', async () => {
      const mockConfig = {
        dsn: 'DtsPrdMult',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        queryWithParams: jest.fn().mockRejectedValue(new Error('Query failed')),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      await expect(
        DatabaseManager.queryWithConnection('DtsPrdMult', 'SELECT 1', [])
      ).rejects.toThrow('Query failed');

      const poolEntry = (DatabaseManager as any).connectionPool.get('DtsPrdMult');
      expect(poolEntry.activeQueries).toBe(0);
    });

    it('deve atualizar lastUsed após execução da query', async () => {
      const mockConfig = {
        dsn: 'LgxPrd',
        metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([]),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      const beforeTime = new Date();
      await DatabaseManager.queryWithConnection('LgxPrd', 'SELECT 1');
      const afterTime = new Date();

      const poolEntry = (DatabaseManager as any).connectionPool.get('LgxPrd');
      expect(poolEntry.lastUsed.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(poolEntry.lastUsed.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('closeConnection', () => {
    it('deve fechar e remover conexão do pool', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      const poolEntry = {
        connection: mockConnection,
        config: { dsn: 'DtsTstEmp' },
        lastUsed: new Date(),
        activeQueries: 0,
      };

      (DatabaseManager as any).connectionPool.set('DtsTstEmp', poolEntry);

      await DatabaseManager.closeConnection('DtsTstEmp');

      expect(mockConnection.close).toHaveBeenCalled();
      expect((DatabaseManager as any).connectionPool.has('DtsTstEmp')).toBe(false);
    });

    it('deve aguardar queries ativas terminarem antes de fechar', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      const poolEntry = {
        connection: mockConnection,
        config: { dsn: 'DtsHmlMult' },
        lastUsed: new Date(),
        activeQueries: 2,
      };

      (DatabaseManager as any).connectionPool.set('DtsHmlMult', poolEntry);

      // Simula queries terminando após 50ms
      setTimeout(() => {
        poolEntry.activeQueries = 0;
      }, 50);

      await DatabaseManager.closeConnection('DtsHmlMult');

      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('deve retornar silenciosamente quando conexão não existe no pool', async () => {
      await expect(DatabaseManager.closeConnection('NonExistentDSN')).resolves.not.toThrow();
    });

    it('deve forçar fechamento se queries não terminarem em 5s', async () => {
      jest.useFakeTimers();

      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      const poolEntry = {
        connection: mockConnection,
        config: { dsn: 'DtsPrdEsp' },
        lastUsed: new Date(),
        activeQueries: 1,
      };

      (DatabaseManager as any).connectionPool.set('DtsPrdEsp', poolEntry);

      const closePromise = DatabaseManager.closeConnection('DtsPrdEsp');

      // Avança 5000ms (timeout)
      jest.advanceTimersByTime(5000);

      await closePromise;

      expect(mockConnection.close).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('closeAllConnections', () => {
    it('deve fechar todas as conexões do pool', async () => {
      const mockConnection1 = { close: jest.fn().mockResolvedValue(undefined) };
      const mockConnection2 = { close: jest.fn().mockResolvedValue(undefined) };
      const mockConnection3 = { close: jest.fn().mockResolvedValue(undefined) };

      (DatabaseManager as any).connectionPool.set('DSN1', {
        connection: mockConnection1,
        config: { dsn: 'DSN1' },
        lastUsed: new Date(),
        activeQueries: 0,
      });

      (DatabaseManager as any).connectionPool.set('DSN2', {
        connection: mockConnection2,
        config: { dsn: 'DSN2' },
        lastUsed: new Date(),
        activeQueries: 0,
      });

      (DatabaseManager as any).connectionPool.set('DSN3', {
        connection: mockConnection3,
        config: { dsn: 'DSN3' },
        lastUsed: new Date(),
        activeQueries: 0,
      });

      await DatabaseManager.closeAllConnections();

      expect(mockConnection1.close).toHaveBeenCalled();
      expect(mockConnection2.close).toHaveBeenCalled();
      expect(mockConnection3.close).toHaveBeenCalled();
      expect((DatabaseManager as any).connectionPool.size).toBe(0);
    });

    it('deve retornar silenciosamente quando pool está vazio', async () => {
      await expect(DatabaseManager.closeAllConnections()).resolves.not.toThrow();
    });

    it('deve fechar conexões em paralelo', async () => {
      const closeTimes: number[] = [];

      const createMockConnection = (delay: number) => ({
        close: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          closeTimes.push(Date.now());
        }),
      });

      (DatabaseManager as any).connectionPool.set('DSN1', {
        connection: createMockConnection(100),
        config: { dsn: 'DSN1' },
        lastUsed: new Date(),
        activeQueries: 0,
      });

      (DatabaseManager as any).connectionPool.set('DSN2', {
        connection: createMockConnection(100),
        config: { dsn: 'DSN2' },
        lastUsed: new Date(),
        activeQueries: 0,
      });

      const startTime = Date.now();
      await DatabaseManager.closeAllConnections();
      const totalTime = Date.now() - startTime;

      // Se fossem sequenciais, levaria 200ms+
      // Em paralelo, deve levar ~100ms
      expect(totalTime).toBeLessThan(150);
    });
  });

  describe('getActiveConnections', () => {
    it('deve retornar array vazio quando pool está vazio', () => {
      const active = DatabaseManager.getActiveConnections();
      expect(active).toEqual([]);
    });

    it('deve retornar informações de todas as conexões ativas', () => {
      const date1 = new Date('2025-10-24T10:00:00Z');
      const date2 = new Date('2025-10-24T11:00:00Z');

      (DatabaseManager as any).connectionPool.set('DtsPrdEmp', {
        connection: {},
        config: {
          dsn: 'DtsPrdEmp',
          description: 'Datasul Production - Empresa',
        },
        lastUsed: date1,
        activeQueries: 2,
      });

      (DatabaseManager as any).connectionPool.set('LgxDev', {
        connection: {},
        config: {
          dsn: 'LgxDev',
          description: 'Logix Development',
        },
        lastUsed: date2,
        activeQueries: 0,
      });

      const active = DatabaseManager.getActiveConnections();

      expect(active).toHaveLength(2);
      expect(active[0]).toEqual({
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        lastUsed: date1,
        activeQueries: 2,
      });
      expect(active[1]).toEqual({
        dsn: 'LgxDev',
        description: 'Logix Development',
        lastUsed: date2,
        activeQueries: 0,
      });
    });

    it('deve retornar snapshot do estado atual', () => {
      (DatabaseManager as any).connectionPool.set('DSN1', {
        connection: {},
        config: { dsn: 'DSN1', description: 'Test' },
        lastUsed: new Date(),
        activeQueries: 1,
      });

      const snapshot1 = DatabaseManager.getActiveConnections();

      // Modificar pool
      (DatabaseManager as any).connectionPool.set('DSN2', {
        connection: {},
        config: { dsn: 'DSN2', description: 'Test 2' },
        lastUsed: new Date(),
        activeQueries: 0,
      });

      const snapshot2 = DatabaseManager.getActiveConnections();

      expect(snapshot1).toHaveLength(1);
      expect(snapshot2).toHaveLength(2);
    });
  });

  describe('healthCheckConnection', () => {
    it('deve executar health check e retornar resultado positivo', async () => {
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        healthCheck: jest.fn().mockResolvedValue({
          connected: true,
          responseTime: 45,
        }),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      const result = await DatabaseManager.healthCheckConnection('DtsPrdEmp');

      expect(result.connected).toBe(true);
      expect(result.responseTime).toBe(45);
      expect(mockConnection.healthCheck).toHaveBeenCalled();
    });

    it('deve retornar resultado negativo quando conexão falha', async () => {
      const mockConfig = {
        dsn: 'DtsTstEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        healthCheck: jest.fn().mockResolvedValue({
          connected: false,
          responseTime: 5000,
        }),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      const result = await DatabaseManager.healthCheckConnection('DtsTstEmp');

      expect(result.connected).toBe(false);
      expect(result.responseTime).toBe(5000);
    });

    it('deve usar fallback para query simples se healthCheck não existir', async () => {
      const mockConfig = {
        dsn: 'LgxPrd',
        metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([{ health: 1 }]),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      const result = await DatabaseManager.healthCheckConnection('LgxPrd');

      expect(result.connected).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT 1 AS health');
    });

    it('deve capturar e retornar erro em caso de falha', async () => {
      const mockConfig = {
        dsn: 'DtsHmlEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await DatabaseManager.healthCheckConnection('DtsHmlEmp');

      expect(result.connected).toBe(false);
      expect(result.responseTime).toBe(0);
    });
  });

  describe('Backward Compatibility - Legacy Methods', () => {
    it('deve manter funcionalidade de queryEmpWithParams', async () => {
      const mockConnection = {
        queryWithParams: jest.fn().mockResolvedValue([{ id: 1 }]),
      };

      (DatabaseManager as any).connectionEmp = mockConnection;
      (DatabaseManager as any).useMockData = false;

      const result = await DatabaseManager.queryEmpWithParams('SELECT * FROM item WHERE id = ?', [
        { name: 'id', type: 'int', value: 1 },
      ]);

      expect(mockConnection.queryWithParams).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1 }]);
    });

    it('deve manter funcionalidade de queryMultWithParams', async () => {
      const mockConnection = {
        queryWithParams: jest.fn().mockResolvedValue([{ code: 'ABC' }]),
      };

      (DatabaseManager as any).connectionMult = mockConnection;
      (DatabaseManager as any).useMockData = false;

      const result = await DatabaseManager.queryMultWithParams(
        'SELECT * FROM estabelec WHERE code = ?',
        [{ name: 'code', type: 'varchar', value: 'ABC' }]
      );

      expect(mockConnection.queryWithParams).toHaveBeenCalled();
      expect(result).toEqual([{ code: 'ABC' }]);
    });

    it('deve manter funcionalidade de getConnection', () => {
      const mockConnection = {};
      (DatabaseManager as any).connectionEmp = mockConnection;
      (DatabaseManager as any).useMockData = false;

      const conn = DatabaseManager.getConnection();

      expect(conn).toBe(mockConnection);
    });

    it('deve retornar MockConnection em modo mock para métodos legacy', async () => {
      (DatabaseManager as any).useMockData = true;

      const mockConnectionInstance = new MockConnection();
      (MockConnection as jest.MockedClass<typeof MockConnection>).mockImplementation(
        () => mockConnectionInstance
      );

      mockConnectionInstance.queryWithParams = jest.fn().mockResolvedValue([]);

      const result = await DatabaseManager.queryEmpWithParams('SELECT 1', []);

      expect(mockConnectionInstance.queryWithParams).toHaveBeenCalled();
    });
  });

  describe('Integration - Full Lifecycle', () => {
    it('deve criar, usar e fechar conexão completa', async () => {
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([{ result: 'ok' }]),
        queryWithParams: jest.fn().mockResolvedValue([{ result: 'ok' }]),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      // 1. Criar conexão
      await DatabaseManager.getConnectionByDSN('DtsPrdEmp');
      expect(mockConnection.connect).toHaveBeenCalled();

      // 2. Verificar pool tem a conexão
      const active = DatabaseManager.getActiveConnections();
      expect(active).toHaveLength(1);
      expect(active[0].dsn).toBe('DtsPrdEmp');

      // 3. Fechar conexão
      await DatabaseManager.closeConnection('DtsPrdEmp');
      expect(mockConnection.close).toHaveBeenCalled();

      // 4. Verificar pool vazio
      const activeAfter = DatabaseManager.getActiveConnections();
      expect(activeAfter).toHaveLength(0);
    });

    it('deve criar múltiplas conexões e gerenciar pool corretamente', async () => {
      const createMockConfig = (dsn: string) => ({
        dsn,
        description: `Connection ${dsn}`,
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so' },
      });

      const createMockConnection = () => ({
        connect: jest.fn().mockResolvedValue(undefined),
        queryWithParams: jest.fn().mockResolvedValue([]),
        close: jest.fn().mockResolvedValue(undefined),
      });

      const dsns = ['DtsPrdEmp', 'DtsPrdMult', 'LgxDev'];
      const connections: any[] = [];

      for (const dsn of dsns) {
        const mockConfig = createMockConfig(dsn);
        const mockConn = createMockConnection();
        connections.push(mockConn);

        (findConnectionByDSN as jest.Mock).mockImplementation((searchDsn: string) => {
          return searchDsn === dsn ? mockConfig : null;
        });

        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementationOnce(
          () => mockConn as any
        );

        await DatabaseManager.getConnectionByDSN(dsn);
      }

      // Verificar todas as conexões no pool
      const active = DatabaseManager.getActiveConnections();
      expect(active).toHaveLength(3);

      // Fechar todas
      await DatabaseManager.closeAllConnections();

      // Verificar todas foram fechadas
      connections.forEach((conn) => {
        expect(conn.close).toHaveBeenCalled();
      });

      const activeAfter = DatabaseManager.getActiveConnections();
      expect(activeAfter).toHaveLength(0);
    });
  });
});
