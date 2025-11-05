// src/config/__tests__/connections.config.test.ts

import {
  AVAILABLE_CONNECTIONS,
  SystemType,
  EnvironmentType,
  DatasulDatabaseType,
  getDatasulConnection,
  getInformixConnection,
  getConnection,
  findConnectionByDSN,
  getAllDSNs,
  validateDSN,
  getConnectionsByEnvironment,
  getDefaultDatasulConnection,
  getDefaultInformixConnection,
  getPCFactoryConnection,
  getCorporativoConnection,
  getSqlServerConnection,
  getDefaultPCFactoryEnvironment,
  getDefaultCorporativoEnvironment,
  getDefaultPCFactoryConnection,
  getDefaultCorporativoConnection,
} from '../connections.config';

describe('connections.config', () => {
  describe('AVAILABLE_CONNECTIONS', () => {
    it('should have all Datasul production databases', () => {
      const prod = AVAILABLE_CONNECTIONS.datasul.production;

      expect(prod.adt).toBeDefined();
      expect(prod.adt.dsn).toBe('DtsPrdAdt');
      expect(prod.adt.port).toBe(40001);

      expect(prod.emp).toBeDefined();
      expect(prod.emp.dsn).toBe('DtsPrdEmp');
      expect(prod.emp.port).toBe(40002);

      expect(prod.esp).toBeDefined();
      expect(prod.esp.dsn).toBe('DtsPrdEsp');
      expect(prod.esp.port).toBe(40003);

      expect(prod.mult).toBeDefined();
      expect(prod.mult.dsn).toBe('DtsPrdMult');
      expect(prod.mult.port).toBe(40004);

      expect(prod.ems5).toBeDefined();
      expect(prod.ems5.dsn).toBe('DtsPrdEms5');
      expect(prod.ems5.port).toBe(40006);

      expect(prod.fnd).toBeDefined();
      expect(prod.fnd.dsn).toBe('DtsPrdFnd');
      expect(prod.fnd.port).toBe(40007);
    });

    it('should have all Datasul test databases', () => {
      const test = AVAILABLE_CONNECTIONS.datasul.test;

      expect(test.adt.dsn).toBe('DtsTstAdt');
      expect(test.emp.dsn).toBe('DtsTstEmp');
      expect(test.esp.dsn).toBe('DtsTstEsp');
      expect(test.mult.dsn).toBe('DtsTstMult');
      expect(test.ems5.dsn).toBe('DtsTstEms5');
      expect(test.fnd.dsn).toBe('DtsTstFnd');
    });

    it('should have all Datasul homologation databases', () => {
      const hml = AVAILABLE_CONNECTIONS.datasul.homologation;

      expect(hml.adt.dsn).toBe('DtsHmlAdt');
      expect(hml.emp.dsn).toBe('DtsHmlEmp');
      expect(hml.esp.dsn).toBe('DtsHmlEsp');
      expect(hml.mult.dsn).toBe('DtsHmlMult');
      expect(hml.ems5.dsn).toBe('DtsHmlEms5');
      expect(hml.fnd.dsn).toBe('DtsHmlFnd');
    });

    it('should have all Informix environments', () => {
      const informix = AVAILABLE_CONNECTIONS.informix;

      expect(informix.development.logix.dsn).toBe('LgxDev');
      expect(informix.atualização.logix.dsn).toBe('LgxAtu');
      expect(informix.new.logix.dsn).toBe('LgxNew');
      expect(informix.production.logix.dsn).toBe('LgxPrd');
    });

    it('should have correct metadata for all connections', () => {
      const prodEmp = AVAILABLE_CONNECTIONS.datasul.production.emp;

      expect(prodEmp.systemType).toBe(SystemType.DATASUL);
      expect(prodEmp.environment).toBe(EnvironmentType.PRODUCTION);
      expect(prodEmp.purpose).toBe(DatasulDatabaseType.EMP);
      expect(prodEmp.metadata.readOnly).toBe(true);
      expect(prodEmp.metadata.driver).toBe('/usr/dlc/odbc/lib/pgoe27.so');
      expect(prodEmp.metadata.defaultSchema).toBe('pub');
      expect(prodEmp.metadata.useWideCharacterTypes).toBe(true);
    });
  });

  describe('getDatasulConnection', () => {
    it('should return correct production connections', () => {
      const emp = getDatasulConnection('production', 'emp');
      expect(emp.dsn).toBe('DtsPrdEmp');
      expect(emp.hostname).toBe('189.126.146.38');
      expect(emp.database).toBe('ems2emp');

      const mult = getDatasulConnection('production', 'mult');
      expect(mult.dsn).toBe('DtsPrdMult');
      expect(mult.database).toBe('ems2mult');
    });

    it('should return correct test connections', () => {
      const emp = getDatasulConnection('test', 'emp');
      expect(emp.dsn).toBe('DtsTstEmp');
      expect(emp.hostname).toBe('189.126.146.71');

      const fnd = getDatasulConnection('test', 'fnd');
      expect(fnd.dsn).toBe('DtsTstFnd');
    });

    it('should return correct homologation connections', () => {
      const emp = getDatasulConnection('homologation', 'emp');
      expect(emp.dsn).toBe('DtsHmlEmp');
      expect(emp.hostname).toBe('189.126.146.135');
    });
  });

  describe('getInformixConnection', () => {
    it('should return correct development connection', () => {
      const dev = getInformixConnection('development');
      expect(dev.dsn).toBe('LgxDev');
      expect(dev.hostname).toBe('10.1.0.84');
      expect(dev.port).toBe(3515);
    });

    it('should return correct production connection', () => {
      const prod = getInformixConnection('production');
      expect(prod.dsn).toBe('LgxPrd');
      expect(prod.hostname).toBe('10.105.0.39');
      expect(prod.port).toBe(5511);
    });
  });

  describe('getConnection', () => {
    it('should return Datasul connection with purpose', () => {
      const config = getConnection('datasul', 'production', 'emp');
      expect(config).toBeDefined();
      expect(config?.dsn).toBe('DtsPrdEmp');
    });

    it('should return Informix connection without purpose', () => {
      const config = getConnection('informix', 'development');
      expect(config).toBeDefined();
      expect(config?.dsn).toBe('LgxDev');
    });

    it('should return null for Datasul without purpose', () => {
      const config = getConnection('datasul', 'production');
      expect(config).toBeNull();
    });

    it('should return null for invalid environment', () => {
      const config = getConnection('datasul', 'invalid', 'emp');
      expect(config).toBeNull();
    });
  });

  describe('findConnectionByDSN', () => {
    it('should find Datasul connections by DSN', () => {
      const config = findConnectionByDSN('DtsPrdEmp');
      expect(config).toBeDefined();
      expect(config?.description).toBe('Datasul Production - Empresa');
      expect(config?.systemType).toBe(SystemType.DATASUL);
    });

    it('should find Informix connections by DSN', () => {
      const config = findConnectionByDSN('LgxDev');
      expect(config).toBeDefined();
      expect(config?.description).toBe('Logix Development Environment');
      expect(config?.systemType).toBe(SystemType.INFORMIX);
    });

    it('should return null for non-existent DSN', () => {
      const config = findConnectionByDSN('InvalidDSN');
      expect(config).toBeNull();
    });

    it('should find all test environment DSNs', () => {
      const testDSNs = [
        'DtsTstAdt',
        'DtsTstEmp',
        'DtsTstEsp',
        'DtsTstMult',
        'DtsTstEms5',
        'DtsTstFnd',
      ];

      testDSNs.forEach((dsn) => {
        const config = findConnectionByDSN(dsn);
        expect(config).toBeDefined();
        expect(config?.environment).toBe(EnvironmentType.TEST);
      });
    });
  });

  describe('getAllDSNs', () => {
    it('should return all Datasul DSNs', () => {
      const dsns = getAllDSNs('datasul');

      // Should have 18 Datasul DSNs (3 environments × 6 databases)
      expect(dsns.length).toBe(18);

      // Check production
      expect(dsns).toContain('DtsPrdAdt');
      expect(dsns).toContain('DtsPrdEmp');
      expect(dsns).toContain('DtsPrdEsp');
      expect(dsns).toContain('DtsPrdMult');
      expect(dsns).toContain('DtsPrdEms5');
      expect(dsns).toContain('DtsPrdFnd');

      // Check test
      expect(dsns).toContain('DtsTstAdt');
      expect(dsns).toContain('DtsTstEmp');

      // Check homologation
      expect(dsns).toContain('DtsHmlAdt');
      expect(dsns).toContain('DtsHmlEmp');
    });

    it('should return all Informix DSNs', () => {
      const dsns = getAllDSNs('informix');

      // Should have 4 Informix DSNs
      expect(dsns.length).toBe(4);
      expect(dsns).toContain('LgxDev');
      expect(dsns).toContain('LgxAtu');
      expect(dsns).toContain('LgxNew');
      expect(dsns).toContain('LgxPrd');
    });
  });

  describe('validateDSN', () => {
    it('should validate existing Datasul DSNs', () => {
      expect(validateDSN('DtsPrdEmp')).toBe(true);
      expect(validateDSN('DtsTstMult')).toBe(true);
      expect(validateDSN('DtsHmlFnd')).toBe(true);
    });

    it('should validate existing Informix DSNs', () => {
      expect(validateDSN('LgxDev')).toBe(true);
      expect(validateDSN('LgxPrd')).toBe(true);
    });

    it('should return false for invalid DSNs', () => {
      expect(validateDSN('InvalidDSN')).toBe(false);
      expect(validateDSN('')).toBe(false);
      expect(validateDSN('DtsPrdInvalid')).toBe(false);
    });
  });

  describe('getConnectionsByEnvironment', () => {
    it('should return all production connections', () => {
      const connections = getConnectionsByEnvironment(EnvironmentType.PRODUCTION);

      // 6 Datasul + 1 Informix = 7 total
      expect(connections.length).toBe(7);

      // Check Datasul production connections
      const datasulConnections = connections.filter((c) => c.systemType === SystemType.DATASUL);
      expect(datasulConnections.length).toBe(6);

      // Check Informix production connection
      const informixConnections = connections.filter((c) => c.systemType === SystemType.INFORMIX);
      expect(informixConnections.length).toBe(1);
      expect(informixConnections[0]?.dsn).toBe('LgxPrd');
    });

    it('should return all test connections', () => {
      const connections = getConnectionsByEnvironment(EnvironmentType.TEST);

      // Only 6 Datasul test connections
      expect(connections.length).toBe(6);
      expect(connections.every((c) => c.environment === EnvironmentType.TEST)).toBe(true);
    });

    it('should return all development connections', () => {
      const connections = getConnectionsByEnvironment(EnvironmentType.DEVELOPMENT);

      // Only 1 Informix dev connection
      expect(connections.length).toBe(1);
      expect(connections[0]?.dsn).toBe('LgxDev');
    });
  });

  describe('getDefaultDatasulConnection', () => {
    it('should return production connection by default', () => {
      // Assuming DATASUL_ENVIRONMENT is not set or set to production
      const emp = getDefaultDatasulConnection('emp');
      expect(emp.dsn).toBe('DtsPrdEmp');

      const mult = getDefaultDatasulConnection('mult');
      expect(mult.dsn).toBe('DtsPrdMult');
    });
  });

  describe('getDefaultInformixConnection', () => {
    it('should return production connection by default', () => {
      // Assuming INFORMIX_ENVIRONMENT is not set or set to production
      const logix = getDefaultInformixConnection();
      expect(logix.dsn).toBe('LgxPrd');
    });
  });

  describe('Connection configuration structure', () => {
    it('should have consistent structure across all Datasul connections', () => {
      const allDatasulEnvs = [
        AVAILABLE_CONNECTIONS.datasul.production,
        AVAILABLE_CONNECTIONS.datasul.test,
        AVAILABLE_CONNECTIONS.datasul.homologation,
      ];

      allDatasulEnvs.forEach((env) => {
        Object.values(env).forEach((config) => {
          expect(config).toHaveProperty('dsn');
          expect(config).toHaveProperty('description');
          expect(config).toHaveProperty('systemType');
          expect(config).toHaveProperty('environment');
          expect(config).toHaveProperty('hostname');
          expect(config).toHaveProperty('port');
          expect(config).toHaveProperty('database');
          expect(config).toHaveProperty('purpose');
          expect(config).toHaveProperty('metadata');
          expect(config.metadata).toHaveProperty('readOnly');
          expect(config.metadata).toHaveProperty('driver');
          expect(config.metadata).toHaveProperty('defaultSchema');
          expect(config.metadata).toHaveProperty('useWideCharacterTypes');
        });
      });
    });

    it('should have consistent ports for each Datasul environment', () => {
      // Production: 40001-40007
      const prod = AVAILABLE_CONNECTIONS.datasul.production;
      expect(prod.adt.port).toBe(40001);
      expect(prod.emp.port).toBe(40002);
      expect(prod.esp.port).toBe(40003);
      expect(prod.mult.port).toBe(40004);
      expect(prod.ems5.port).toBe(40006);
      expect(prod.fnd.port).toBe(40007);

      // Test: 41001-41007
      const test = AVAILABLE_CONNECTIONS.datasul.test;
      expect(test.adt.port).toBe(41001);
      expect(test.emp.port).toBe(41002);
      expect(test.esp.port).toBe(41003);
      expect(test.mult.port).toBe(41004);
      expect(test.ems5.port).toBe(41006);
      expect(test.fnd.port).toBe(41007);

      // Homologation: 42001-42007
      const hml = AVAILABLE_CONNECTIONS.datasul.homologation;
      expect(hml.adt.port).toBe(42001);
      expect(hml.emp.port).toBe(42002);
      expect(hml.esp.port).toBe(42003);
      expect(hml.mult.port).toBe(42004);
      expect(hml.ems5.port).toBe(42006);
      expect(hml.fnd.port).toBe(42007);
    });

    it('should have correct hostnames for each environment', () => {
      // Production
      const prodHostname = '189.126.146.38';
      Object.values(AVAILABLE_CONNECTIONS.datasul.production).forEach((config) => {
        expect(config.hostname).toBe(prodHostname);
      });

      // Test
      const testHostname = '189.126.146.71';
      Object.values(AVAILABLE_CONNECTIONS.datasul.test).forEach((config) => {
        expect(config.hostname).toBe(testHostname);
      });

      // Homologation
      const hmlHostname = '189.126.146.135';
      Object.values(AVAILABLE_CONNECTIONS.datasul.homologation).forEach((config) => {
        expect(config.hostname).toBe(hmlHostname);
      });
    });
  });

  describe('DSN naming conventions', () => {
    it('should follow consistent naming pattern for Datasul', () => {
      // Pattern: Dts{Env}{Purpose}
      // Env: Prd, Tst, Hml
      // Purpose: Adt, Emp, Esp, Mult, Ems5, Fnd

      expect(AVAILABLE_CONNECTIONS.datasul.production.adt.dsn).toBe('DtsPrdAdt');
      expect(AVAILABLE_CONNECTIONS.datasul.test.emp.dsn).toBe('DtsTstEmp');
      expect(AVAILABLE_CONNECTIONS.datasul.homologation.mult.dsn).toBe('DtsHmlMult');
    });

    it('should follow consistent naming pattern for Informix', () => {
      // Pattern: Lgx{Env}
      // Env: Dev, Atu, New, Prd

      expect(AVAILABLE_CONNECTIONS.informix.development.logix.dsn).toBe('LgxDev');
      expect(AVAILABLE_CONNECTIONS.informix.atualização.logix.dsn).toBe('LgxAtu');
      expect(AVAILABLE_CONNECTIONS.informix.new.logix.dsn).toBe('LgxNew');
      expect(AVAILABLE_CONNECTIONS.informix.production.logix.dsn).toBe('LgxPrd');
    });
  });

  describe('SQL Server Connections', () => {
    describe('AVAILABLE_CONNECTIONS.sqlserver', () => {
      it('should have PCFactory and Corporativo sections', () => {
        expect(AVAILABLE_CONNECTIONS.sqlserver).toBeDefined();
        expect(AVAILABLE_CONNECTIONS.sqlserver.pcfactory).toBeDefined();
        expect(AVAILABLE_CONNECTIONS.sqlserver.corporativo).toBeDefined();
      });

      it('should have PCFactory production sistema connection', () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.pcfactory.production.sistema;

        expect(config.dsn).toBe('PCF4_PRD');
        expect(config.description).toBe('PCFactory Production - Sistema');
        expect(config.systemType).toBe(SystemType.SQLSERVER);
        expect(config.hostname).toBe('T-SRVSQL2022-01');
        expect(config.instance).toBe('mes');
        expect(config.port).toBe(1433);
        expect(config.database).toBe('PCF4_PRD');
        expect(config.user).toBe('sql_ppi');
        expect(config.password).toBe('pcf');
      });

      it('should have Corporativo production connection', () => {
        const config = AVAILABLE_CONNECTIONS.sqlserver.corporativo.production.datacorp;

        expect(config.dsn).toBe('DATACORP_PRD');
        expect(config.description).toBe('Corporativo Lorenzetti Production');
        expect(config.systemType).toBe(SystemType.SQLSERVER);
        expect(config.hostname).toBe('T-SRVSQL2022-01');
        expect(config.instance).toBe('LOREN');
        expect(config.password).toBe('#dcloren#');
      });
    });

    describe('findConnectionByDSN - SQL Server', () => {
      it('should find PCFactory connections', () => {
        expect(findConnectionByDSN('PCF4_PRD')?.dsn).toBe('PCF4_PRD');
        expect(findConnectionByDSN('PCF_Integ_PRD')?.dsn).toBe('PCF_Integ_PRD');
        expect(findConnectionByDSN('PCF4_DEV')?.dsn).toBe('PCF4_DEV');
        expect(findConnectionByDSN('PCF_Integ_DEV')?.dsn).toBe('PCF_Integ_DEV');
      });

      it('should find Corporativo connections', () => {
        expect(findConnectionByDSN('DATACORP_PRD')?.dsn).toBe('DATACORP_PRD');
        expect(findConnectionByDSN('DATACORP_DEV')?.dsn).toBe('DATACORP_DEV');
      });
    });

    describe('getPCFactoryConnection', () => {
      it('should return production sistema', () => {
        const config = getPCFactoryConnection('production', 'sistema');
        expect(config.dsn).toBe('PCF4_PRD');
        expect(config.instance).toBe('mes');
      });

      it('should return development integracao', () => {
        const config = getPCFactoryConnection('development', 'integracao');
        expect(config.dsn).toBe('PCF_Integ_DEV');
      });
    });

    describe('getCorporativoConnection', () => {
      it('should return production', () => {
        const config = getCorporativoConnection('production');
        expect(config.dsn).toBe('DATACORP_PRD');
      });

      it('should return development', () => {
        const config = getCorporativoConnection('development');
        expect(config.dsn).toBe('DATACORP_DEV');
        expect(config.hostname).toBe('T-SRVSQLDEV2022-01');
      });
    });

    describe('getSqlServerConnection', () => {
      it('should get PCFactory connections', () => {
        const sistema = getSqlServerConnection('pcfactory', 'production', 'sistema');
        expect(sistema?.dsn).toBe('PCF4_PRD');

        const integ = getSqlServerConnection('pcfactory', 'development', 'integracao');
        expect(integ?.dsn).toBe('PCF_Integ_DEV');
      });

      it('should get Corporativo connections', () => {
        const corp = getSqlServerConnection('corporativo', 'production');
        expect(corp?.dsn).toBe('DATACORP_PRD');
      });

      it('should return null for invalid combinations', () => {
        expect(getSqlServerConnection('pcfactory', 'production')).toBeNull();
        expect(getSqlServerConnection('pcfactory', 'production', 'invalid')).toBeNull();
      });
    });

    describe('Environment defaults', () => {
      it('getDefaultPCFactoryEnvironment should default to production', () => {
        delete process.env.PCFACTORY_ENVIRONMENT;
        expect(getDefaultPCFactoryEnvironment()).toBe('production');
      });

      it('getDefaultCorporativoEnvironment should default to production', () => {
        delete process.env.CORPORATIVO_ENVIRONMENT;
        expect(getDefaultCorporativoEnvironment()).toBe('production');
      });

      it('getDefaultPCFactoryConnection should work', () => {
        delete process.env.PCFACTORY_ENVIRONMENT;
        const config = getDefaultPCFactoryConnection('sistema');
        expect(config.dsn).toBe('PCF4_PRD');
      });

      it('getDefaultCorporativoConnection should work', () => {
        delete process.env.CORPORATIVO_ENVIRONMENT;
        const config = getDefaultCorporativoConnection();
        expect(config.dsn).toBe('DATACORP_PRD');
      });
    });

    describe('Server instance format', () => {
      it('should have instance field for SQL Server connections', () => {
        const pcf = getPCFactoryConnection('production', 'sistema');
        expect(pcf.instance).toBe('mes');

        const corp = getCorporativoConnection('production');
        expect(corp.instance).toBe('LOREN');
      });
    });

    describe('validateDSN - SQL Server', () => {
      it('should validate PCFactory DSNs', () => {
        expect(validateDSN('PCF4_PRD')).toBe(true);
        expect(validateDSN('PCF_Integ_PRD')).toBe(true);
        expect(validateDSN('PCF4_DEV')).toBe(true);
        expect(validateDSN('PCF_Integ_DEV')).toBe(true);
      });

      it('should validate Corporativo DSNs', () => {
        expect(validateDSN('DATACORP_PRD')).toBe(true);
        expect(validateDSN('DATACORP_DEV')).toBe(true);
      });
    });
  });
});
