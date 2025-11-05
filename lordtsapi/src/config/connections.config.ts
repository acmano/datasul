// src/config/connections.config.ts

/**
 * @fileoverview Comprehensive ODBC Connection Configuration System
 *
 * This module provides a type-safe, extensible configuration system for all
 * ODBC connections defined in /etc/odbc.ini. It organizes connections by:
 * - System type (Informix/Datasul)
 * - Environment (Production/Test/Homologation/Development)
 * - Database purpose (EMP, MULT, ADT, ESP, EMS5, FND)
 *
 * The system supports:
 * - All Informix connections (Dev, Atu, New, Prd)
 * - All Datasul Production databases (6 databases)
 * - All Datasul Test databases (6 databases)
 * - All Datasul Homologation databases (6 databases)
 * - Environment variable overrides for flexible deployment
 *
 * @module config/connections.config
 *
 * @example Basic usage
 * ```typescript
 * import { AVAILABLE_CONNECTIONS, getConnection } from '@config/connections.config';
 *
 * // Get a specific connection
 * const prodEmp = getConnection('datasul', 'production', 'emp');
 * console.log(prodEmp.dsn); // 'DtsPrdEmp'
 *
 * // List all production Datasul connections
 * const allProd = AVAILABLE_CONNECTIONS.datasul.production;
 * ```
 *
 * @example Environment override
 * ```bash
 * # .env
 * DATASUL_ENVIRONMENT=test  # Use test environment instead of production
 * INFORMIX_ENVIRONMENT=dev  # Use dev environment for Informix
 * ```
 *
 * @remarks
 * ⚠️ CRITICAL: All DSN names must match exactly with /etc/odbc.ini entries
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * System types supported by the application
 *
 * @enum {string}
 */
export enum SystemType {
  /** Informix database system (Logix ERP) */
  INFORMIX = 'informix',
  /** Datasul database system (Progress OpenEdge) */
  DATASUL = 'datasul',
  /** SQL Server database system (PCFactory, Corporativo) */
  SQLSERVER = 'sqlserver',
}

/**
 * Environment types for database connections
 *
 * @enum {string}
 */
export enum EnvironmentType {
  /** Development environment */
  DEVELOPMENT = 'development',
  /** Test/QA environment */
  TEST = 'test',
  /** Homologation/Staging environment */
  HOMOLOGATION = 'homologation',
  /** Production environment */
  PRODUCTION = 'production',
  /** Update environment (Informix specific) */
  ATUALIZAÇÃO = 'atualização',
  /** New environment (Informix specific) */
  NEW = 'new',
}

/**
 * Datasul database purposes
 *
 * @enum {string}
 */
export enum DatasulDatabaseType {
  /** Auditoria (Audit) database */
  ADT = 'adt',
  /** Empresa (Company) database - main business data */
  EMP = 'emp',
  /** Especial (Special) database */
  ESP = 'esp',
  /** Múltiplas empresas (Multi-company) database */
  MULT = 'mult',
  /** EMS5 database */
  EMS5 = 'ems5',
  /** Foundation database */
  FND = 'fnd',
}

/**
 * Connection configuration interface
 *
 * @interface ConnectionConfig
 *
 * @property {string} dsn - Data Source Name as defined in /etc/odbc.ini (or connection ID for SQL Server)
 * @property {string} description - Human-readable connection description
 * @property {SystemType} systemType - Type of database system
 * @property {EnvironmentType} environment - Deployment environment
 * @property {string} hostname - Server hostname or IP address
 * @property {number} port - Server port number
 * @property {string} database - Database name
 * @property {DatasulDatabaseType} [purpose] - Database purpose (Datasul only)
 * @property {ConnectionMetadata} metadata - Additional metadata
 * @property {string} [instance] - SQL Server instance name (SQL Server only)
 * @property {string} [user] - Database user (SQL Server only)
 * @property {string} [password] - Database password (SQL Server only)
 */
export interface ConnectionConfig {
  /** Data Source Name from /etc/odbc.ini (or connection ID for SQL Server) */
  dsn: string;
  /** Human-readable description */
  description: string;
  /** Database system type */
  systemType: SystemType;
  /** Deployment environment */
  environment: EnvironmentType;
  /** Server hostname or IP */
  hostname: string;
  /** Server port */
  port: number;
  /** Database name */
  database: string;
  /** Database purpose (Datasul only) */
  purpose?: DatasulDatabaseType;
  /** Additional metadata */
  metadata: ConnectionMetadata;
  /** SQL Server instance name (format: HOSTNAME\INSTANCE) */
  instance?: string;
  /** Database user (SQL Server) */
  user?: string;
  /** Database password (SQL Server) */
  password?: string;
}

/**
 * Connection metadata for additional information
 *
 * @interface ConnectionMetadata
 *
 * @property {boolean} readOnly - Whether connection is read-only
 * @property {string} driver - ODBC driver path
 * @property {string} [defaultSchema] - Default database schema
 * @property {boolean} [useWideCharacterTypes] - Use wide character types
 * @property {Record<string, unknown>} [custom] - Custom metadata
 */
export interface ConnectionMetadata {
  /** Read-only connection flag */
  readOnly: boolean;
  /** ODBC driver path */
  driver: string;
  /** Default schema (Datasul uses 'pub') */
  defaultSchema?: string;
  /** Wide character types support */
  useWideCharacterTypes?: boolean;
  /** Custom metadata fields */
  custom?: Record<string, unknown>;
}

/**
 * Datasul environment configuration
 * Contains all 6 database connections for a specific environment
 *
 * @interface DatasulEnvironment
 */
export interface DatasulEnvironment {
  adt: ConnectionConfig;
  emp: ConnectionConfig;
  esp: ConnectionConfig;
  mult: ConnectionConfig;
  ems5: ConnectionConfig;
  fnd: ConnectionConfig;
}

/**
 * Informix environment configuration
 *
 * @interface InformixEnvironment
 */
export interface InformixEnvironment {
  logix: ConnectionConfig;
}

/**
 * PCFactory environment configuration
 *
 * @interface PCFactoryEnvironment
 */
export interface PCFactoryEnvironment {
  sistema: ConnectionConfig;
  integracao: ConnectionConfig;
}

/**
 * Corporativo environment configuration
 *
 * @interface CorporativoEnvironment
 */
export interface CorporativoEnvironment {
  datacorp: ConnectionConfig;
}

/**
 * Complete connection registry
 *
 * @interface ConnectionRegistry
 */
export interface ConnectionRegistry {
  datasul: {
    production: DatasulEnvironment;
    test: DatasulEnvironment;
    homologation: DatasulEnvironment;
  };
  informix: {
    development: InformixEnvironment;
    atualização: InformixEnvironment;
    new: InformixEnvironment;
    production: InformixEnvironment;
  };
  sqlserver: {
    pcfactory: {
      production: PCFactoryEnvironment;
      development: PCFactoryEnvironment;
    };
    corporativo: {
      production: CorporativoEnvironment;
      development: CorporativoEnvironment;
    };
  };
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Informix ODBC driver path
 * @constant
 */
const INFORMIX_DRIVER = '/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so';

/**
 * Datasul (Progress OpenEdge) ODBC driver path
 * @constant
 */
const DATASUL_DRIVER = '/usr/dlc/odbc/lib/pgoe27.so';

// ============================================
// INFORMIX CONNECTIONS
// ============================================

/**
 * Informix Development environment (LgxDev)
 */
const informixDevelopment: InformixEnvironment = {
  logix: {
    dsn: 'LgxDev',
    description: 'Logix Development Environment',
    systemType: SystemType.INFORMIX,
    environment: EnvironmentType.DEVELOPMENT,
    hostname: '10.1.0.84',
    port: 3515,
    database: 'logix',
    metadata: {
      readOnly: true,
      driver: INFORMIX_DRIVER,
      custom: {
        server: 'lgxdev_tcp',
        protocol: 'onsoctcp',
      },
    },
  },
};

/**
 * Informix Atualização environment (LgxAtu)
 */
const informixAtualização: InformixEnvironment = {
  logix: {
    dsn: 'LgxAtu',
    description: 'Logix Atualização Environment',
    systemType: SystemType.INFORMIX,
    environment: EnvironmentType.ATUALIZAÇÃO,
    hostname: '10.1.0.84',
    port: 3516,
    database: 'logix',
    metadata: {
      readOnly: true,
      driver: INFORMIX_DRIVER,
      custom: {
        server: 'lgxatu_tcp',
        protocol: 'onsoctcp',
      },
    },
  },
};

/**
 * Informix New environment (LgxNew)
 */
const informixNew: InformixEnvironment = {
  logix: {
    dsn: 'LgxNew',
    description: 'Logix New Environment',
    systemType: SystemType.INFORMIX,
    environment: EnvironmentType.NEW,
    hostname: '10.1.0.84',
    port: 3517,
    database: 'logix',
    metadata: {
      readOnly: true,
      driver: INFORMIX_DRIVER,
      custom: {
        server: 'lgxnew_tcp',
        protocol: 'onsoctcp',
      },
    },
  },
};

/**
 * Informix Production environment (LgxPrd)
 */
const informixProduction: InformixEnvironment = {
  logix: {
    dsn: 'LgxPrd',
    description: 'Logix Production Environment',
    systemType: SystemType.INFORMIX,
    environment: EnvironmentType.PRODUCTION,
    hostname: '10.105.0.39',
    port: 5511,
    database: 'logix',
    metadata: {
      readOnly: true,
      driver: INFORMIX_DRIVER,
      custom: {
        server: 't_ifxprd_tcp',
        protocol: 'onsoctcp',
      },
    },
  },
};

// ============================================
// DATASUL PRODUCTION CONNECTIONS
// ============================================

/**
 * Datasul Production environment (all 6 databases)
 */
const datasulProduction: DatasulEnvironment = {
  adt: {
    dsn: 'DtsPrdAdt',
    description: 'Datasul Production - Auditoria',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.PRODUCTION,
    purpose: DatasulDatabaseType.ADT,
    hostname: '189.126.146.38',
    port: 40001,
    database: 'ems2adt',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  emp: {
    dsn: 'DtsPrdEmp',
    description: 'Datasul Production - Empresa',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.PRODUCTION,
    purpose: DatasulDatabaseType.EMP,
    hostname: '189.126.146.38',
    port: 40002,
    database: 'ems2emp',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  esp: {
    dsn: 'DtsPrdEsp',
    description: 'Datasul Production - Especial',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.PRODUCTION,
    purpose: DatasulDatabaseType.ESP,
    hostname: '189.126.146.38',
    port: 40003,
    database: 'ems2esp',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  mult: {
    dsn: 'DtsPrdMult',
    description: 'Datasul Production - Múltiplas Empresas',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.PRODUCTION,
    purpose: DatasulDatabaseType.MULT,
    hostname: '189.126.146.38',
    port: 40004,
    database: 'ems2mult',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  ems5: {
    dsn: 'DtsPrdEms5',
    description: 'Datasul Production - EMS5',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.PRODUCTION,
    purpose: DatasulDatabaseType.EMS5,
    hostname: '189.126.146.38',
    port: 40006,
    database: 'ems5',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  fnd: {
    dsn: 'DtsPrdFnd',
    description: 'Datasul Production - Foundation',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.PRODUCTION,
    purpose: DatasulDatabaseType.FND,
    hostname: '189.126.146.38',
    port: 40007,
    database: 'emsfnd',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
};

// ============================================
// DATASUL TEST CONNECTIONS
// ============================================

/**
 * Datasul Test environment (all 6 databases)
 */
const datasulTest: DatasulEnvironment = {
  adt: {
    dsn: 'DtsTstAdt',
    description: 'Datasul Test - Auditoria',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.TEST,
    purpose: DatasulDatabaseType.ADT,
    hostname: '189.126.146.71',
    port: 41001,
    database: 'ems2adt',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  emp: {
    dsn: 'DtsTstEmp',
    description: 'Datasul Test - Empresa',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.TEST,
    purpose: DatasulDatabaseType.EMP,
    hostname: '189.126.146.71',
    port: 41002,
    database: 'ems2emp',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  esp: {
    dsn: 'DtsTstEsp',
    description: 'Datasul Test - Especial',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.TEST,
    purpose: DatasulDatabaseType.ESP,
    hostname: '189.126.146.71',
    port: 41003,
    database: 'ems2esp',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  mult: {
    dsn: 'DtsTstMult',
    description: 'Datasul Test - Múltiplas Empresas',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.TEST,
    purpose: DatasulDatabaseType.MULT,
    hostname: '189.126.146.71',
    port: 41004,
    database: 'ems2mult',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  ems5: {
    dsn: 'DtsTstEms5',
    description: 'Datasul Test - EMS5',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.TEST,
    purpose: DatasulDatabaseType.EMS5,
    hostname: '189.126.146.71',
    port: 41006,
    database: 'ems5',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  fnd: {
    dsn: 'DtsTstFnd',
    description: 'Datasul Test - Foundation',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.TEST,
    purpose: DatasulDatabaseType.FND,
    hostname: '189.126.146.71',
    port: 41007,
    database: 'emsfnd',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
};

// ============================================
// DATASUL HOMOLOGATION CONNECTIONS
// ============================================

/**
 * Datasul Homologation environment (all 6 databases)
 */
const datasulHomologation: DatasulEnvironment = {
  adt: {
    dsn: 'DtsHmlAdt',
    description: 'Datasul Homologation - Auditoria',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.HOMOLOGATION,
    purpose: DatasulDatabaseType.ADT,
    hostname: '189.126.146.135',
    port: 42001,
    database: 'ems2adt',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  emp: {
    dsn: 'DtsHmlEmp',
    description: 'Datasul Homologation - Empresa',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.HOMOLOGATION,
    purpose: DatasulDatabaseType.EMP,
    hostname: '189.126.146.135',
    port: 42002,
    database: 'ems2emp',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  esp: {
    dsn: 'DtsHmlEsp',
    description: 'Datasul Homologation - Especial',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.HOMOLOGATION,
    purpose: DatasulDatabaseType.ESP,
    hostname: '189.126.146.135',
    port: 42003,
    database: 'ems2esp',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  mult: {
    dsn: 'DtsHmlMult',
    description: 'Datasul Homologation - Múltiplas Empresas',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.HOMOLOGATION,
    purpose: DatasulDatabaseType.MULT,
    hostname: '189.126.146.135',
    port: 42004,
    database: 'ems2mult',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  ems5: {
    dsn: 'DtsHmlEms5',
    description: 'Datasul Homologation - EMS5',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.HOMOLOGATION,
    purpose: DatasulDatabaseType.EMS5,
    hostname: '189.126.146.135',
    port: 42006,
    database: 'ems5',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
  fnd: {
    dsn: 'DtsHmlFnd',
    description: 'Datasul Homologation - Foundation',
    systemType: SystemType.DATASUL,
    environment: EnvironmentType.HOMOLOGATION,
    purpose: DatasulDatabaseType.FND,
    hostname: '189.126.146.135',
    port: 42007,
    database: 'emsfnd',
    metadata: {
      readOnly: true,
      driver: DATASUL_DRIVER,
      defaultSchema: 'pub',
      useWideCharacterTypes: true,
    },
  },
};

// ============================================
// SQL SERVER CONNECTIONS (PCFactory + Corporativo)
// ============================================

/**
 * PCFactory Production environment (Sistema + Integração)
 */
const pcfactoryProduction: PCFactoryEnvironment = {
  sistema: {
    dsn: 'PCF4_PRD',
    description: 'PCFactory Production - Sistema',
    systemType: SystemType.SQLSERVER,
    environment: EnvironmentType.PRODUCTION,
    hostname: 'T-SRVSQL2022-01',
    instance: 'mes',
    port: 1433,
    database: 'PCF4_PRD',
    user: 'sql_ppi',
    password: 'pcf',
    metadata: {
      readOnly: false,
      driver: 'SQL Server Native Client 11.0',
    },
  },
  integracao: {
    dsn: 'PCF_Integ_PRD',
    description: 'PCFactory Production - Integração',
    systemType: SystemType.SQLSERVER,
    environment: EnvironmentType.PRODUCTION,
    hostname: 'T-SRVSQL2022-01',
    instance: 'mes',
    port: 1433,
    database: 'PCF_Integ_PRD',
    user: 'sql_ppi',
    password: 'pcf',
    metadata: {
      readOnly: false,
      driver: 'SQL Server Native Client 11.0',
    },
  },
};

/**
 * PCFactory Development environment (Sistema + Integração)
 */
const pcfactoryDevelopment: PCFactoryEnvironment = {
  sistema: {
    dsn: 'PCF4_DEV',
    description: 'PCFactory Development - Sistema',
    systemType: SystemType.SQLSERVER,
    environment: EnvironmentType.DEVELOPMENT,
    hostname: 'T-SRVSQL2022-01',
    instance: 'mes',
    port: 1433,
    database: 'PCF4_DEV',
    user: 'sql_ppi',
    password: 'pcf',
    metadata: {
      readOnly: false,
      driver: 'SQL Server Native Client 11.0',
    },
  },
  integracao: {
    dsn: 'PCF_Integ_DEV',
    description: 'PCFactory Development - Integração',
    systemType: SystemType.SQLSERVER,
    environment: EnvironmentType.DEVELOPMENT,
    hostname: 'T-SRVSQL2022-01',
    instance: 'mes',
    port: 1433,
    database: 'PCF_Integ_DEV',
    user: 'sql_ppi',
    password: 'pcf',
    metadata: {
      readOnly: false,
      driver: 'SQL Server Native Client 11.0',
    },
  },
};

/**
 * Corporativo Lorenzetti Production environment
 */
const corporativoProduction: CorporativoEnvironment = {
  datacorp: {
    dsn: 'DATACORP_PRD',
    description: 'Corporativo Lorenzetti Production',
    systemType: SystemType.SQLSERVER,
    environment: EnvironmentType.PRODUCTION,
    hostname: '10.105.0.4',
    instance: 'LOREN',
    port: 1433,
    database: 'DATACORP',
    user: 'dcloren',
    password: '#dcloren#',
    metadata: {
      readOnly: false,
      driver: 'SQL Server Native Client 11.0',
    },
  },
};

/**
 * Corporativo Lorenzetti Development environment
 */
const corporativoDevelopment: CorporativoEnvironment = {
  datacorp: {
    dsn: 'DATACORP_DEV',
    description: 'Corporativo Lorenzetti Development',
    systemType: SystemType.SQLSERVER,
    environment: EnvironmentType.DEVELOPMENT,
    hostname: 'T-SRVSQLDEV2022-01',
    instance: 'LOREN',
    port: 1433,
    database: 'DATACORP',
    user: 'dcloren',
    password: '#dclorendev#',
    metadata: {
      readOnly: false,
      driver: 'SQL Server Native Client 11.0',
    },
  },
};

// ============================================
// CONNECTION REGISTRY
// ============================================

/**
 * Complete registry of all available ODBC connections
 *
 * @constant AVAILABLE_CONNECTIONS
 * @type {ConnectionRegistry}
 *
 * @description
 * Central registry containing all configured ODBC connections organized by:
 * - System type (Datasul/Informix)
 * - Environment (Production/Test/Homologation/Development/etc)
 * - Database purpose (EMP/MULT/ADT/ESP/EMS5/FND for Datasul)
 *
 * All DSN names match exactly with /etc/odbc.ini entries.
 *
 * @example Access Datasul Production EMP
 * ```typescript
 * const prodEmp = AVAILABLE_CONNECTIONS.datasul.production.emp;
 * console.log(prodEmp.dsn);  // 'DtsPrdEmp'
 * console.log(prodEmp.hostname);  // '189.126.146.38'
 * console.log(prodEmp.port);  // 40002
 * ```
 *
 * @example Access Informix Development
 * ```typescript
 * const devLogix = AVAILABLE_CONNECTIONS.informix.development.logix;
 * console.log(devLogix.dsn);  // 'LgxDev'
 * console.log(devLogix.hostname);  // '10.1.0.84'
 * ```
 *
 * @example List all Datasul Test databases
 * ```typescript
 * const testDbs = AVAILABLE_CONNECTIONS.datasul.test;
 * Object.entries(testDbs).forEach(([purpose, config]) => {
 *   console.log(`${purpose.toUpperCase()}: ${config.dsn}`);
 * });
 * // Output:
 * // ADT: DtsTstAdt
 * // EMP: DtsTstEmp
 * // ESP: DtsTstEsp
 * // MULT: DtsTstMult
 * // EMS5: DtsTstEms5
 * // FND: DtsTstFnd
 * ```
 */
export const AVAILABLE_CONNECTIONS: ConnectionRegistry = {
  datasul: {
    production: datasulProduction,
    test: datasulTest,
    homologation: datasulHomologation,
  },
  informix: {
    development: informixDevelopment,
    atualização: informixAtualização,
    new: informixNew,
    production: informixProduction,
  },
  sqlserver: {
    pcfactory: {
      production: pcfactoryProduction,
      development: pcfactoryDevelopment,
    },
    corporativo: {
      production: corporativoProduction,
      development: corporativoDevelopment,
    },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a Datasul connection by environment and purpose
 *
 * @param {keyof ConnectionRegistry['datasul']} environment - Environment name
 * @param {keyof DatasulEnvironment} purpose - Database purpose
 * @returns {ConnectionConfig} Connection configuration
 *
 * @example
 * ```typescript
 * const prodEmp = getDatasulConnection('production', 'emp');
 * const testMult = getDatasulConnection('test', 'mult');
 * const hmlFnd = getDatasulConnection('homologation', 'fnd');
 * ```
 */
export function getDatasulConnection(
  environment: keyof ConnectionRegistry['datasul'],
  purpose: keyof DatasulEnvironment
): ConnectionConfig {
  return AVAILABLE_CONNECTIONS.datasul[environment][purpose];
}

/**
 * Get an Informix connection by environment
 *
 * @param {keyof ConnectionRegistry['informix']} environment - Environment name
 * @returns {ConnectionConfig} Connection configuration
 *
 * @example
 * ```typescript
 * const devLogix = getInformixConnection('development');
 * const prdLogix = getInformixConnection('production');
 * ```
 */
export function getInformixConnection(
  environment: keyof ConnectionRegistry['informix']
): ConnectionConfig {
  return AVAILABLE_CONNECTIONS.informix[environment].logix;
}

/**
 * Get connection configuration by system type, environment, and purpose
 *
 * @param {'datasul' | 'informix'} systemType - System type
 * @param {string} environment - Environment name
 * @param {string} [purpose] - Database purpose (required for Datasul)
 * @returns {ConnectionConfig | null} Connection configuration or null if not found
 *
 * @example
 * ```typescript
 * // Datasul
 * const config = getConnection('datasul', 'production', 'emp');
 *
 * // Informix
 * const config = getConnection('informix', 'development');
 * ```
 */
export function getConnection(
  systemType: 'datasul' | 'informix',
  environment: string,
  purpose?: string
): ConnectionConfig | null {
  try {
    if (systemType === 'datasul') {
      if (!purpose) {
        throw new Error('Purpose is required for Datasul connections');
      }
      return getDatasulConnection(
        environment as keyof ConnectionRegistry['datasul'],
        purpose as keyof DatasulEnvironment
      );
    } else if (systemType === 'informix') {
      return getInformixConnection(environment as keyof ConnectionRegistry['informix']);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Find connection by DSN name
 *
 * @param {string} dsn - DSN name to search for
 * @returns {ConnectionConfig | null} Connection configuration or null if not found
 *
 * @example
 * ```typescript
 * const config = findConnectionByDSN('DtsPrdEmp');
 * console.log(config?.description);  // 'Datasul Production - Empresa'
 *
 * const lgx = findConnectionByDSN('LgxDev');
 * console.log(lgx?.description);  // 'Logix Development Environment'
 * ```
 */
export function findConnectionByDSN(dsn: string): ConnectionConfig | null {
  // Search in Datasul connections
  for (const env of Object.values(AVAILABLE_CONNECTIONS.datasul)) {
    for (const config of Object.values(env)) {
      if (config.dsn === dsn) {
        return config;
      }
    }
  }

  // Search in Informix connections
  for (const env of Object.values(AVAILABLE_CONNECTIONS.informix)) {
    if (env.logix.dsn === dsn) {
      return env.logix;
    }
  }

  // Search in SQL Server connections (PCFactory)
  for (const env of Object.values(AVAILABLE_CONNECTIONS.sqlserver.pcfactory)) {
    for (const config of Object.values(env)) {
      if (config.dsn === dsn) {
        return config;
      }
    }
  }

  // Search in SQL Server connections (Corporativo)
  for (const env of Object.values(AVAILABLE_CONNECTIONS.sqlserver.corporativo)) {
    if (env.datacorp.dsn === dsn) {
      return env.datacorp;
    }
  }

  return null;
}

/**
 * Get all DSN names for a specific system type
 *
 * @param {'datasul' | 'informix'} systemType - System type
 * @returns {string[]} Array of DSN names
 *
 * @example
 * ```typescript
 * const datasulDSNs = getAllDSNs('datasul');
 * // ['DtsPrdAdt', 'DtsPrdEmp', 'DtsPrdEsp', ...]
 *
 * const informixDSNs = getAllDSNs('informix');
 * // ['LgxDev', 'LgxAtu', 'LgxNew', 'LgxPrd']
 * ```
 */
export function getAllDSNs(systemType: 'datasul' | 'informix'): string[] {
  const dsns: string[] = [];

  if (systemType === 'datasul') {
    for (const env of Object.values(AVAILABLE_CONNECTIONS.datasul)) {
      for (const config of Object.values(env)) {
        dsns.push(config.dsn);
      }
    }
  } else if (systemType === 'informix') {
    for (const env of Object.values(AVAILABLE_CONNECTIONS.informix)) {
      dsns.push(env.logix.dsn);
    }
  }

  return dsns;
}

/**
 * Validate if a DSN exists in the configuration
 *
 * @param {string} dsn - DSN name to validate
 * @returns {boolean} True if DSN exists
 *
 * @example
 * ```typescript
 * validateDSN('DtsPrdEmp');  // true
 * validateDSN('InvalidDSN');  // false
 * ```
 */
export function validateDSN(dsn: string): boolean {
  return findConnectionByDSN(dsn) !== null;
}

/**
 * Get connections for a specific environment across all systems
 *
 * @param {EnvironmentType} environment - Environment type
 * @returns {ConnectionConfig[]} Array of connection configurations
 *
 * @example
 * ```typescript
 * const prodConnections = getConnectionsByEnvironment(EnvironmentType.PRODUCTION);
 * // Returns all production connections (Datasul + Informix)
 * ```
 */
export function getConnectionsByEnvironment(environment: EnvironmentType): ConnectionConfig[] {
  const connections: ConnectionConfig[] = [];

  // Add Datasul connections
  const datasulEnvMap: Record<string, keyof ConnectionRegistry['datasul'] | undefined> = {
    [EnvironmentType.PRODUCTION]: 'production',
    [EnvironmentType.TEST]: 'test',
    [EnvironmentType.HOMOLOGATION]: 'homologation',
  };

  const datasulEnv = datasulEnvMap[environment];
  if (datasulEnv) {
    const env = AVAILABLE_CONNECTIONS.datasul[datasulEnv];
    connections.push(...Object.values(env));
  }

  // Add Informix connections
  const informixEnvMap: Record<string, keyof ConnectionRegistry['informix'] | undefined> = {
    [EnvironmentType.DEVELOPMENT]: 'development',
    [EnvironmentType.ATUALIZAÇÃO]: 'atualização',
    [EnvironmentType.NEW]: 'new',
    [EnvironmentType.PRODUCTION]: 'production',
  };

  const informixEnv = informixEnvMap[environment];
  if (informixEnv) {
    connections.push(AVAILABLE_CONNECTIONS.informix[informixEnv].logix);
  }

  return connections;
}

/**
 * Get a PCFactory connection by environment and purpose
 *
 * @param {keyof ConnectionRegistry['sqlserver']['pcfactory']} environment - Environment name
 * @param {'sistema' | 'integracao'} purpose - Database purpose
 * @returns {ConnectionConfig} Connection configuration
 *
 * @example
 * ```typescript
 * const prodSistema = getPCFactoryConnection('production', 'sistema');
 * const devIntegracao = getPCFactoryConnection('development', 'integracao');
 * ```
 */
export function getPCFactoryConnection(
  environment: keyof ConnectionRegistry['sqlserver']['pcfactory'],
  purpose: 'sistema' | 'integracao'
): ConnectionConfig {
  return AVAILABLE_CONNECTIONS.sqlserver.pcfactory[environment][purpose];
}

/**
 * Get a Corporativo connection by environment
 *
 * @param {keyof ConnectionRegistry['sqlserver']['corporativo']} environment - Environment name
 * @returns {ConnectionConfig} Connection configuration
 *
 * @example
 * ```typescript
 * const prodCorp = getCorporativoConnection('production');
 * const devCorp = getCorporativoConnection('development');
 * ```
 */
export function getCorporativoConnection(
  environment: keyof ConnectionRegistry['sqlserver']['corporativo']
): ConnectionConfig {
  return AVAILABLE_CONNECTIONS.sqlserver.corporativo[environment].datacorp;
}

/**
 * Get a SQL Server connection by system, environment, and purpose
 *
 * @param {'pcfactory' | 'corporativo'} system - System type
 * @param {string} environment - Environment name
 * @param {string} [purpose] - Database purpose (required for pcfactory: 'sistema' or 'integracao')
 * @returns {ConnectionConfig | null} Connection configuration or null if not found
 *
 * @example
 * ```typescript
 * // PCFactory
 * const config = getSqlServerConnection('pcfactory', 'production', 'sistema');
 *
 * // Corporativo
 * const config = getSqlServerConnection('corporativo', 'development');
 * ```
 */
export function getSqlServerConnection(
  system: 'pcfactory' | 'corporativo',
  environment: string,
  purpose?: string
): ConnectionConfig | null {
  try {
    if (system === 'pcfactory') {
      if (!purpose || (purpose !== 'sistema' && purpose !== 'integracao')) {
        throw new Error("Purpose must be 'sistema' or 'integracao' for PCFactory connections");
      }
      return getPCFactoryConnection(
        environment as keyof ConnectionRegistry['sqlserver']['pcfactory'],
        purpose as 'sistema' | 'integracao'
      );
    } else if (system === 'corporativo') {
      return getCorporativoConnection(
        environment as keyof ConnectionRegistry['sqlserver']['corporativo']
      );
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// ENVIRONMENT-BASED DEFAULTS
// ============================================

/**
 * Get default Datasul environment from environment variables
 *
 * @returns {keyof ConnectionRegistry['datasul']} Default environment
 *
 * @description
 * Reads DATASUL_ENVIRONMENT from .env to determine which environment to use.
 * Defaults to 'production' if not set.
 *
 * @example .env configuration
 * ```bash
 * DATASUL_ENVIRONMENT=test
 * ```
 */
export function getDefaultDatasulEnvironment(): keyof ConnectionRegistry['datasul'] {
  const envVar = process.env.DATASUL_ENVIRONMENT?.toLowerCase();

  if (envVar === 'test') return 'test';
  if (envVar === 'homologation' || envVar === 'hml') return 'homologation';

  return 'production'; // Default
}

/**
 * Get default Informix environment from environment variables
 *
 * @returns {keyof ConnectionRegistry['informix']} Default environment
 *
 * @description
 * Reads INFORMIX_ENVIRONMENT from .env to determine which environment to use.
 * Defaults to 'production' if not set.
 *
 * @example .env configuration
 * ```bash
 * INFORMIX_ENVIRONMENT=development
 * ```
 */
export function getDefaultInformixEnvironment(): keyof ConnectionRegistry['informix'] {
  const envVar = process.env.INFORMIX_ENVIRONMENT?.toLowerCase();

  if (envVar === 'development' || envVar === 'dev') return 'development';
  if (envVar === 'atualização' || envVar === 'atu') return 'atualização';
  if (envVar === 'new') return 'new';

  return 'production'; // Default
}

/**
 * Get default Datasul connection for a specific purpose
 *
 * @param {keyof DatasulEnvironment} purpose - Database purpose
 * @returns {ConnectionConfig} Connection configuration
 *
 * @description
 * Uses getDefaultDatasulEnvironment() to determine which environment to use,
 * then returns the connection for the specified purpose.
 *
 * @example
 * ```typescript
 * // With DATASUL_ENVIRONMENT=test in .env
 * const emp = getDefaultDatasulConnection('emp');
 * console.log(emp.dsn);  // 'DtsTstEmp'
 *
 * // With DATASUL_ENVIRONMENT=production (or not set)
 * const mult = getDefaultDatasulConnection('mult');
 * console.log(mult.dsn);  // 'DtsPrdMult'
 * ```
 */
export function getDefaultDatasulConnection(purpose: keyof DatasulEnvironment): ConnectionConfig {
  const environment = getDefaultDatasulEnvironment();
  return getDatasulConnection(environment, purpose);
}

/**
 * Get default Informix connection
 *
 * @returns {ConnectionConfig} Connection configuration
 *
 * @description
 * Uses getDefaultInformixEnvironment() to determine which environment to use.
 *
 * @example
 * ```typescript
 * // With INFORMIX_ENVIRONMENT=development in .env
 * const logix = getDefaultInformixConnection();
 * console.log(logix.dsn);  // 'LgxDev'
 *
 * // With INFORMIX_ENVIRONMENT=production (or not set)
 * const logix = getDefaultInformixConnection();
 * console.log(logix.dsn);  // 'LgxPrd'
 * ```
 */
export function getDefaultInformixConnection(): ConnectionConfig {
  const environment = getDefaultInformixEnvironment();
  return getInformixConnection(environment);
}

/**
 * Get default PCFactory environment from environment variables
 *
 * @returns {keyof ConnectionRegistry['sqlserver']['pcfactory']} Default environment
 *
 * @description
 * Reads PCFACTORY_ENVIRONMENT from .env to determine which environment to use.
 * Defaults to 'production' if not set.
 *
 * @example .env configuration
 * ```bash
 * PCFACTORY_ENVIRONMENT=development
 * ```
 */
export function getDefaultPCFactoryEnvironment(): keyof ConnectionRegistry['sqlserver']['pcfactory'] {
  const envVar = process.env.PCFACTORY_ENVIRONMENT?.toLowerCase();

  if (envVar === 'development' || envVar === 'dev') return 'development';

  return 'production'; // Default
}

/**
 * Get default Corporativo environment from environment variables
 *
 * @returns {keyof ConnectionRegistry['sqlserver']['corporativo']} Default environment
 *
 * @description
 * Reads CORPORATIVO_ENVIRONMENT from .env to determine which environment to use.
 * Defaults to 'production' if not set.
 *
 * @example .env configuration
 * ```bash
 * CORPORATIVO_ENVIRONMENT=development
 * ```
 */
export function getDefaultCorporativoEnvironment(): keyof ConnectionRegistry['sqlserver']['corporativo'] {
  const envVar = process.env.CORPORATIVO_ENVIRONMENT?.toLowerCase();

  if (envVar === 'development' || envVar === 'dev') return 'development';

  return 'production'; // Default
}

/**
 * Get default PCFactory connection for a specific purpose
 *
 * @param {'sistema' | 'integracao'} purpose - Database purpose
 * @returns {ConnectionConfig} Connection configuration
 *
 * @description
 * Uses getDefaultPCFactoryEnvironment() to determine which environment to use,
 * then returns the connection for the specified purpose.
 *
 * @example
 * ```typescript
 * // With PCFACTORY_ENVIRONMENT=development in .env
 * const sistema = getDefaultPCFactoryConnection('sistema');
 * console.log(sistema.dsn);  // 'PCF4_DEV'
 *
 * // With PCFACTORY_ENVIRONMENT=production (or not set)
 * const integracao = getDefaultPCFactoryConnection('integracao');
 * console.log(integracao.dsn);  // 'PCF_Integ_PRD'
 * ```
 */
export function getDefaultPCFactoryConnection(purpose: 'sistema' | 'integracao'): ConnectionConfig {
  const environment = getDefaultPCFactoryEnvironment();
  return getPCFactoryConnection(environment, purpose);
}

/**
 * Get default Corporativo connection
 *
 * @returns {ConnectionConfig} Connection configuration
 *
 * @description
 * Uses getDefaultCorporativoEnvironment() to determine which environment to use.
 *
 * @example
 * ```typescript
 * // With CORPORATIVO_ENVIRONMENT=development in .env
 * const corp = getDefaultCorporativoConnection();
 * console.log(corp.dsn);  // 'DATACORP_DEV'
 *
 * // With CORPORATIVO_ENVIRONMENT=production (or not set)
 * const corp = getDefaultCorporativoConnection();
 * console.log(corp.dsn);  // 'DATACORP_PRD'
 * ```
 */
export function getDefaultCorporativoConnection(): ConnectionConfig {
  const environment = getDefaultCorporativoEnvironment();
  return getCorporativoConnection(environment);
}
