// src/infrastructure/database/__tests__/DatabaseManager.queryByContext.test.ts

/**
 * @fileoverview Tests for DatabaseManager queryByContext and syntax sugar helpers
 *
 * Tests all new query-by-context features:
 * - queryByContext() with automatic environment resolution
 * - resolveConnectionId() internal method
 * - pcfactory.sistema.query() and pcfactory.integracao.query()
 * - corporativo.query()
 * - datasul(purpose).query()
 * - informix(environment).query()
 * - Environment variable overrides
 * - Error handling
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
jest.mock('../connections/SqlServerConnection');
jest.mock('../connections/MockConnection');

// Mock connections.config.ts helper functions
jest.mock('@config/connections.config', () => {
  const original = jest.requireActual('@config/connections.config');
  return {
    ...original,
    findConnectionByDSN: jest.fn(),
    getDefaultDatasulEnvironment: jest.fn(),
    getDefaultInformixEnvironment: jest.fn(),
    getDefaultPCFactoryEnvironment: jest.fn(),
    getDefaultCorporativoEnvironment: jest.fn(),
    getDatasulConnection: jest.fn(),
    getInformixConnection: jest.fn(),
    getPCFactoryConnection: jest.fn(),
    getCorporativoConnection: jest.fn(),
  };
});

import { DatabaseManager } from '../DatabaseManager';
import { OdbcConnection } from '../connections/OdbcConnection';
import { SqlServerConnection } from '../connections/SqlServerConnection';
import {
  findConnectionByDSN,
  getDefaultDatasulEnvironment,
  getDefaultInformixEnvironment,
  getDefaultPCFactoryEnvironment,
  getDefaultCorporativoEnvironment,
  getDatasulConnection,
  getInformixConnection,
  getPCFactoryConnection,
  getCorporativoConnection,
  AVAILABLE_CONNECTIONS,
} from '@config/connections.config';

describe('DatabaseManager - queryByContext & Syntax Sugar Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton state
    (DatabaseManager as any).connectionPool = new Map();
    (DatabaseManager as any).useMockData = false;

    // Reset mock implementations
    (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
      () =>
        ({
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([]),
          queryWithParams: jest.fn().mockResolvedValue([]),
        }) as any
    );

    (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
      () =>
        ({
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([]),
          queryWithParams: jest.fn().mockResolvedValue([]),
        }) as any
    );
  });

  describe('queryByContext', () => {
    describe('Datasul system', () => {
      it('deve executar query com environment automático (via DATASUL_ENVIRONMENT)', async () => {
        // Setup
        const mockConfig = {
          dsn: 'DtsTstEmp',
          description: 'Datasul Test - Empresa',
          systemType: 'datasul',
          metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ id: 1, name: 'Test' }]),
        };

        (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('test');
        (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        // Execute
        const result = await DatabaseManager.queryByContext(
          { system: 'datasul', purpose: 'emp' },
          'SELECT * FROM item WHERE "it-codigo" = ?',
          [{ name: 'codigo', type: 'varchar', value: '7530110' }]
        );

        // Assert
        expect(getDefaultDatasulEnvironment).toHaveBeenCalled();
        expect(getDatasulConnection).toHaveBeenCalledWith('test', 'emp');
        expect(findConnectionByDSN).toHaveBeenCalledWith('DtsTstEmp');
        expect(result).toEqual([{ id: 1, name: 'Test' }]);
      });

      it('deve executar query com environment explícito', async () => {
        const mockConfig = {
          dsn: 'DtsHmlEmp',
          description: 'Datasul Homologation - Empresa',
          metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ count: 10 }]),
        };

        (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'datasul', environment: 'homologation', purpose: 'emp' },
          'SELECT COUNT(*) as count FROM item'
        );

        expect(getDefaultDatasulEnvironment).not.toHaveBeenCalled();
        expect(getDatasulConnection).toHaveBeenCalledWith('homologation', 'emp');
        expect(result).toEqual([{ count: 10 }]);
      });

      it('deve lançar erro quando purpose não é fornecido para Datasul', async () => {
        (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');

        await expect(
          DatabaseManager.queryByContext({ system: 'datasul' }, 'SELECT 1')
        ).rejects.toThrow('Purpose required for Datasul');
      });

      it('deve funcionar com todos os purposes (emp, mult, adt, esp, ems5, fnd)', async () => {
        const purposes = ['emp', 'mult', 'adt', 'esp', 'ems5', 'fnd'];

        for (const purpose of purposes) {
          const mockConfig = {
            dsn: `DtsPrd${purpose.charAt(0).toUpperCase() + purpose.slice(1)}`,
            metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
          };

          const mockConnection = {
            connect: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([]),
          };

          (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');
          (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
          (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
          (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
            () => mockConnection as any
          );

          await DatabaseManager.queryByContext({ system: 'datasul', purpose }, 'SELECT 1');

          expect(getDatasulConnection).toHaveBeenCalledWith('production', purpose);
        }
      });
    });

    describe('Informix system', () => {
      it('deve executar query com environment automático (via INFORMIX_ENVIRONMENT)', async () => {
        const mockConfig = {
          dsn: 'LgxDev',
          description: 'Logix Development',
          metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ item: '123' }]),
        };

        (getDefaultInformixEnvironment as jest.Mock).mockReturnValue('development');
        (getInformixConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'informix' },
          'SELECT * FROM logix.item WHERE cod_item = ?',
          [{ name: 'codigo', type: 'varchar', value: '123' }]
        );

        expect(getDefaultInformixEnvironment).toHaveBeenCalled();
        expect(getInformixConnection).toHaveBeenCalledWith('development');
        expect(result).toEqual([{ item: '123' }]);
      });

      it('deve executar query com environment explícito', async () => {
        const mockConfig = {
          dsn: 'LgxPrd',
          metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ count: 100 }]),
        };

        (getInformixConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'informix', environment: 'production' },
          'SELECT COUNT(*) as count FROM logix.item'
        );

        expect(getDefaultInformixEnvironment).not.toHaveBeenCalled();
        expect(getInformixConnection).toHaveBeenCalledWith('production');
        expect(result).toEqual([{ count: 100 }]);
      });
    });

    describe('PCFactory system', () => {
      it('deve executar query no database sistema com environment automático', async () => {
        const mockConfig = {
          dsn: 'PCF4_PRD',
          description: 'PCFactory Production - Sistema',
          systemType: 'sqlserver',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ OrderID: 12345 }]),
        };

        (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('production');
        (getPCFactoryConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'pcfactory', purpose: 'sistema' },
          'SELECT * FROM Orders WHERE OrderID = ?',
          [{ name: 'id', type: 'int', value: 12345 }]
        );

        expect(getDefaultPCFactoryEnvironment).toHaveBeenCalled();
        expect(getPCFactoryConnection).toHaveBeenCalledWith('production', 'sistema');
        expect(result).toEqual([{ OrderID: 12345 }]);
      });

      it('deve executar query no database integracao com environment explícito', async () => {
        const mockConfig = {
          dsn: 'PCF_Integ_DEV',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ Status: 'PENDING' }]),
        };

        (getPCFactoryConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'pcfactory', environment: 'development', purpose: 'integracao' },
          'SELECT * FROM IntegrationLog'
        );

        expect(getDefaultPCFactoryEnvironment).not.toHaveBeenCalled();
        expect(getPCFactoryConnection).toHaveBeenCalledWith('development', 'integracao');
        expect(result).toEqual([{ Status: 'PENDING' }]);
      });

      it('deve lançar erro quando purpose não é fornecido para PCFactory', async () => {
        (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('production');

        await expect(
          DatabaseManager.queryByContext({ system: 'pcfactory' }, 'SELECT 1')
        ).rejects.toThrow('Purpose required for PCFactory');
      });
    });

    describe('Corporativo system', () => {
      it('deve executar query com environment automático (via CORPORATIVO_ENVIRONMENT)', async () => {
        const mockConfig = {
          dsn: 'DATACORP_PRD',
          description: 'Corporativo Lorenzetti Production',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ ID: 1, Data: 'Test' }]),
        };

        (getDefaultCorporativoEnvironment as jest.Mock).mockReturnValue('production');
        (getCorporativoConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'corporativo' },
          'SELECT * FROM dbo.Dados WHERE ID = ?',
          [{ name: 'id', type: 'int', value: 1 }]
        );

        expect(getDefaultCorporativoEnvironment).toHaveBeenCalled();
        expect(getCorporativoConnection).toHaveBeenCalledWith('production');
        expect(result).toEqual([{ ID: 1, Data: 'Test' }]);
      });

      it('deve executar query com environment explícito', async () => {
        const mockConfig = {
          dsn: 'DATACORP_DEV',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ count: 50 }]),
        };

        (getCorporativoConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.queryByContext(
          { system: 'corporativo', environment: 'development' },
          'SELECT COUNT(*) as count FROM dbo.Dados'
        );

        expect(getDefaultCorporativoEnvironment).not.toHaveBeenCalled();
        expect(getCorporativoConnection).toHaveBeenCalledWith('development');
        expect(result).toEqual([{ count: 50 }]);
      });
    });

    describe('Error handling', () => {
      it('deve lançar erro quando sistema é desconhecido', async () => {
        await expect(
          DatabaseManager.queryByContext({ system: 'invalid' as any }, 'SELECT 1')
        ).rejects.toThrow('Unknown system: invalid');
      });

      it('deve propagar erro quando conexão falha', async () => {
        const mockConfig = {
          dsn: 'DtsPrdEmp',
          metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
        };

        (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');
        (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(() => {
          throw new Error('Connection failed');
        });

        await expect(
          DatabaseManager.queryByContext({ system: 'datasul', purpose: 'emp' }, 'SELECT 1')
        ).rejects.toThrow('Connection failed');
      });
    });
  });

  describe('Syntax Sugar Helpers', () => {
    describe('pcfactory.sistema.query', () => {
      it('deve executar query no database sistema', async () => {
        const mockConfig = {
          dsn: 'PCF4_PRD',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ OrderID: 123 }]),
        };

        (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('production');
        (getPCFactoryConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.pcfactory.sistema.query(
          'SELECT * FROM Orders WHERE OrderID = ?',
          [{ name: 'id', type: 'int', value: 123 }]
        );

        expect(getPCFactoryConnection).toHaveBeenCalledWith('production', 'sistema');
        expect(result).toEqual([{ OrderID: 123 }]);
      });
    });

    describe('pcfactory.integracao.query', () => {
      it('deve executar query no database integração', async () => {
        const mockConfig = {
          dsn: 'PCF_Integ_PRD',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ Status: 'OK' }]),
        };

        (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('production');
        (getPCFactoryConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.pcfactory.integracao.query(
          'SELECT * FROM IntegrationLog'
        );

        expect(getPCFactoryConnection).toHaveBeenCalledWith('production', 'integracao');
        expect(result).toEqual([{ Status: 'OK' }]);
      });
    });

    describe('corporativo.query', () => {
      it('deve executar query no database corporativo', async () => {
        const mockConfig = {
          dsn: 'DATACORP_PRD',
          metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ ID: 1 }]),
        };

        (getDefaultCorporativoEnvironment as jest.Mock).mockReturnValue('production');
        (getCorporativoConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.corporativo.query(
          'SELECT * FROM dbo.Dados WHERE ID = ?',
          [{ name: 'id', type: 'int', value: 1 }]
        );

        expect(getCorporativoConnection).toHaveBeenCalledWith('production');
        expect(result).toEqual([{ ID: 1 }]);
      });
    });

    describe('datasul(purpose).query', () => {
      it('deve executar query no database EMP', async () => {
        const mockConfig = {
          dsn: 'DtsPrdEmp',
          metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ 'it-codigo': '7530110' }]),
        };

        (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');
        (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.datasul('emp').query(
          'SELECT * FROM item WHERE "it-codigo" = ?',
          [{ name: 'codigo', type: 'varchar', value: '7530110' }]
        );

        expect(getDatasulConnection).toHaveBeenCalledWith('production', 'emp');
        expect(result).toEqual([{ 'it-codigo': '7530110' }]);
      });

      it('deve executar query no database MULT', async () => {
        const mockConfig = {
          dsn: 'DtsPrdMult',
          metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ 'ep-codigo': '01.01' }]),
        };

        (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');
        (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.datasul('mult').query('SELECT * FROM estabelec');

        expect(getDatasulConnection).toHaveBeenCalledWith('production', 'mult');
        expect(result).toEqual([{ 'ep-codigo': '01.01' }]);
      });

      it('deve funcionar com todos os purposes', async () => {
        const purposes: Array<'emp' | 'mult' | 'adt' | 'esp' | 'ems5' | 'fnd'> = [
          'emp',
          'mult',
          'adt',
          'esp',
          'ems5',
          'fnd',
        ];

        for (const purpose of purposes) {
          const mockConfig = {
            dsn: `DtsPrd${purpose.charAt(0).toUpperCase() + purpose.slice(1)}`,
            metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
          };

          const mockConnection = {
            connect: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([]),
          };

          (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');
          (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
          (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
          (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
            () => mockConnection as any
          );

          await DatabaseManager.datasul(purpose).query('SELECT 1');

          expect(getDatasulConnection).toHaveBeenCalledWith('production', purpose);
        }
      });
    });

    describe('informix(environment).query', () => {
      it('deve executar query com environment automático', async () => {
        const mockConfig = {
          dsn: 'LgxPrd',
          metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          queryWithParams: jest.fn().mockResolvedValue([{ cod_item: '123' }]),
        };

        (getDefaultInformixEnvironment as jest.Mock).mockReturnValue('production');
        (getInformixConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.informix().query(
          'SELECT * FROM logix.item WHERE cod_item = ?',
          [{ name: 'codigo', type: 'varchar', value: '123' }]
        );

        expect(getInformixConnection).toHaveBeenCalledWith('production');
        expect(result).toEqual([{ cod_item: '123' }]);
      });

      it('deve executar query com environment explícito', async () => {
        const mockConfig = {
          dsn: 'LgxDev',
          metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so', readOnly: true },
        };

        const mockConnection = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: jest.fn().mockResolvedValue([{ test: 'data' }]),
        };

        (getInformixConnection as jest.Mock).mockReturnValue(mockConfig);
        (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
        (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
          () => mockConnection as any
        );

        const result = await DatabaseManager.informix('development').query(
          'SELECT * FROM logix.test_data'
        );

        expect(getDefaultInformixEnvironment).not.toHaveBeenCalled();
        expect(getInformixConnection).toHaveBeenCalledWith('development');
        expect(result).toEqual([{ test: 'data' }]);
      });
    });
  });

  describe('Environment variable resolution', () => {
    it('deve usar DATASUL_ENVIRONMENT quando não especificado', async () => {
      const mockConfig = {
        dsn: 'DtsTstEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([]),
      };

      (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('test');
      (getDatasulConnection as jest.Mock).mockReturnValue(mockConfig);
      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(
        () => mockConnection as any
      );

      await DatabaseManager.datasul('emp').query('SELECT 1');

      expect(getDefaultDatasulEnvironment).toHaveBeenCalled();
      expect(getDatasulConnection).toHaveBeenCalledWith('test', 'emp');
    });

    it('deve usar PCFACTORY_ENVIRONMENT quando não especificado', async () => {
      const mockConfig = {
        dsn: 'PCF4_DEV',
        metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([]),
      };

      (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('development');
      (getPCFactoryConnection as jest.Mock).mockReturnValue(mockConfig);
      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
        () => mockConnection as any
      );

      await DatabaseManager.pcfactory.sistema.query('SELECT 1');

      expect(getDefaultPCFactoryEnvironment).toHaveBeenCalled();
      expect(getPCFactoryConnection).toHaveBeenCalledWith('development', 'sistema');
    });
  });

  describe('Integration - Complete workflow', () => {
    it('deve criar conexão, executar query e reutilizar conexão', async () => {
      const mockConfig = {
        dsn: 'PCF4_PRD',
        metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
      };

      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([{ id: 1 }]),
      };

      (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('production');
      (getPCFactoryConnection as jest.Mock).mockReturnValue(mockConfig);
      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
        () => mockConnection as any
      );

      // Primeira query - cria conexão
      await DatabaseManager.pcfactory.sistema.query('SELECT 1');
      expect(mockConnection.connect).toHaveBeenCalledTimes(1);

      // Segunda query - reutiliza conexão
      await DatabaseManager.pcfactory.sistema.query('SELECT 2');
      expect(mockConnection.connect).toHaveBeenCalledTimes(1); // Não conecta novamente

      // Verificar pool
      const active = DatabaseManager.getActiveConnections();
      expect(active).toHaveLength(1);
      expect(active[0].dsn).toBe('PCF4_PRD');
    });

    it('deve permitir queries em múltiplos sistemas simultaneamente', async () => {
      // Setup Datasul
      const datasulConfig = {
        dsn: 'DtsPrdEmp',
        metadata: { driver: '/usr/dlc/odbc/lib/pgoe27.so', readOnly: true },
      };

      const datasulConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([{ system: 'datasul' }]),
      };

      // Setup Informix
      const informixConfig = {
        dsn: 'LgxPrd',
        metadata: { driver: '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so', readOnly: true },
      };

      const informixConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([{ system: 'informix' }]),
      };

      // Setup PCFactory
      const pcfactoryConfig = {
        dsn: 'PCF4_PRD',
        metadata: { driver: 'SQL Server Native Client 11.0', readOnly: false },
      };

      const pcfactoryConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([{ system: 'pcfactory' }]),
      };

      // Mock findConnectionByDSN to return appropriate config
      (findConnectionByDSN as jest.Mock).mockImplementation((dsn: string) => {
        if (dsn === 'DtsPrdEmp') return datasulConfig;
        if (dsn === 'LgxPrd') return informixConfig;
        if (dsn === 'PCF4_PRD') return pcfactoryConfig;
        return null;
      });

      // Mock environment getters
      (getDefaultDatasulEnvironment as jest.Mock).mockReturnValue('production');
      (getDatasulConnection as jest.Mock).mockReturnValue(datasulConfig);

      (getDefaultInformixEnvironment as jest.Mock).mockReturnValue('production');
      (getInformixConnection as jest.Mock).mockReturnValue(informixConfig);

      (getDefaultPCFactoryEnvironment as jest.Mock).mockReturnValue('production');
      (getPCFactoryConnection as jest.Mock).mockReturnValue(pcfactoryConfig);

      // Mock connections to return specific instances
      let connectionCallCount = 0;
      (OdbcConnection as jest.MockedClass<typeof OdbcConnection>).mockImplementation(() => {
        connectionCallCount++;
        if (connectionCallCount === 1) return datasulConnection as any;
        if (connectionCallCount === 2) return informixConnection as any;
        return datasulConnection as any; // fallback
      });

      (SqlServerConnection as jest.MockedClass<typeof SqlServerConnection>).mockImplementation(
        () => pcfactoryConnection as any
      );

      // Execute queries em paralelo
      const [datasulResult, informixResult, pcfactoryResult] = await Promise.all([
        DatabaseManager.datasul('emp').query('SELECT 1'),
        DatabaseManager.informix().query('SELECT 2'),
        DatabaseManager.pcfactory.sistema.query('SELECT 3'),
      ]);

      // Verificar resultados
      expect(datasulResult).toEqual([{ system: 'datasul' }]);
      expect(informixResult).toEqual([{ system: 'informix' }]);
      expect(pcfactoryResult).toEqual([{ system: 'pcfactory' }]);

      // Verificar pool
      const active = DatabaseManager.getActiveConnections();
      expect(active.length).toBeGreaterThanOrEqual(1); // Pelo menos uma conexão criada
    });
  });
});
