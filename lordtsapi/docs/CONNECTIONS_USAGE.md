# Connection Configuration System - Usage Guide

## Overview

The `connections.config.ts` module provides a comprehensive, type-safe configuration system for all ODBC connections defined in `/etc/odbc.ini`. This system supports:

- **Informix (Logix)**: 4 environments (Dev, Atu, New, Prd)
- **Datasul (Progress OpenEdge)**: 18 databases across 3 environments
  - Production: 6 databases
  - Test: 6 databases
  - Homologation: 6 databases

## Table of Contents

1. [Quick Start](#quick-start)
2. [Available Connections](#available-connections)
3. [Usage Examples](#usage-examples)
4. [API Reference](#api-reference)
5. [Environment Variables](#environment-variables)
6. [Best Practices](#best-practices)

## Quick Start

```typescript
import {
  AVAILABLE_CONNECTIONS,
  getDatasulConnection,
  getDefaultDatasulConnection
} from '@config/connections.config';

// Get a specific Datasul production database
const prodEmp = getDatasulConnection('production', 'emp');
console.log(prodEmp.dsn);        // 'DtsPrdEmp'
console.log(prodEmp.hostname);   // '189.126.146.38'
console.log(prodEmp.port);       // 40002

// Use environment-based defaults
const emp = getDefaultDatasulConnection('emp');
// Returns production by default, or respects DATASUL_ENVIRONMENT in .env
```

## Available Connections

### Datasul Connections

All Datasul environments have 6 databases:

| Purpose | Description           | Database Name |
|---------|----------------------|---------------|
| **ADT** | Auditoria (Audit)    | ems2adt       |
| **EMP** | Empresa (Company)    | ems2emp       |
| **ESP** | Especial (Special)   | ems2esp       |
| **MULT**| Múltiplas Empresas   | ems2mult      |
| **EMS5**| EMS5                 | ems5          |
| **FND** | Foundation           | emsfnd        |

#### Production (189.126.146.38)

| DSN         | Database | Port  |
|-------------|----------|-------|
| DtsPrdAdt   | ems2adt  | 40001 |
| DtsPrdEmp   | ems2emp  | 40002 |
| DtsPrdEsp   | ems2esp  | 40003 |
| DtsPrdMult  | ems2mult | 40004 |
| DtsPrdEms5  | ems5     | 40006 |
| DtsPrdFnd   | emsfnd   | 40007 |

#### Test (189.126.146.71)

| DSN         | Database | Port  |
|-------------|----------|-------|
| DtsTstAdt   | ems2adt  | 41001 |
| DtsTstEmp   | ems2emp  | 41002 |
| DtsTstEsp   | ems2esp  | 41003 |
| DtsTstMult  | ems2mult | 41004 |
| DtsTstEms5  | ems5     | 41006 |
| DtsTstFnd   | emsfnd   | 41007 |

#### Homologation (189.126.146.135)

| DSN         | Database | Port  |
|-------------|----------|-------|
| DtsHmlAdt   | ems2adt  | 42001 |
| DtsHmlEmp   | ems2emp  | 42002 |
| DtsHmlEsp   | ems2esp  | 42003 |
| DtsHmlMult  | ems2mult | 42004 |
| DtsHmlEms5  | ems5     | 42006 |
| DtsHmlFnd   | emsfnd   | 42007 |

### Informix Connections

| DSN     | Description | Hostname      | Port | Server         |
|---------|-------------|---------------|------|----------------|
| LgxDev  | Development | 10.1.0.84     | 3515 | lgxdev_tcp     |
| LgxAtu  | Atualização | 10.1.0.84     | 3516 | lgxatu_tcp     |
| LgxNew  | New         | 10.1.0.84     | 3517 | lgxnew_tcp     |
| LgxPrd  | Production  | 10.105.0.39   | 5511 | t_ifxprd_tcp   |

## Usage Examples

### 1. Accessing Specific Connections

```typescript
import { AVAILABLE_CONNECTIONS } from '@config/connections.config';

// Direct access to Datasul production EMP
const prodEmp = AVAILABLE_CONNECTIONS.datasul.production.emp;
console.log(`Connecting to: ${prodEmp.hostname}:${prodEmp.port}`);

// Access Informix development
const devLogix = AVAILABLE_CONNECTIONS.informix.development.logix;
console.log(`DSN: ${devLogix.dsn}`);
```

### 2. Using Helper Functions

```typescript
import {
  getDatasulConnection,
  getInformixConnection,
  getConnection
} from '@config/connections.config';

// Get Datasul connection
const testMult = getDatasulConnection('test', 'mult');
console.log(testMult.dsn); // 'DtsTstMult'

// Get Informix connection
const prdLogix = getInformixConnection('production');
console.log(prdLogix.dsn); // 'LgxPrd'

// Generic getter (works for both systems)
const config = getConnection('datasul', 'homologation', 'fnd');
console.log(config?.dsn); // 'DtsHmlFnd'
```

### 3. Finding Connections by DSN

```typescript
import { findConnectionByDSN, validateDSN } from '@config/connections.config';

// Find a connection by its DSN name
const connection = findConnectionByDSN('DtsPrdEmp');
if (connection) {
  console.log(`Found: ${connection.description}`);
  console.log(`Host: ${connection.hostname}:${connection.port}`);
}

// Validate DSN exists
if (validateDSN('DtsPrdEmp')) {
  console.log('DSN is valid');
}
```

### 4. Listing All Connections

```typescript
import { getAllDSNs, getConnectionsByEnvironment } from '@config/connections.config';

// Get all Datasul DSNs
const datasulDSNs = getAllDSNs('datasul');
console.log(`Total Datasul connections: ${datasulDSNs.length}`); // 18

// Get all Informix DSNs
const informixDSNs = getAllDSNs('informix');
console.log(`Total Informix connections: ${informixDSNs.length}`); // 4

// Get all production environment connections
import { EnvironmentType } from '@config/connections.config';
const prodConnections = getConnectionsByEnvironment(EnvironmentType.PRODUCTION);
prodConnections.forEach(conn => {
  console.log(`${conn.dsn}: ${conn.description}`);
});
```

### 5. Environment-Based Configuration

```typescript
import {
  getDefaultDatasulConnection,
  getDefaultInformixConnection,
  getDefaultDatasulEnvironment
} from '@config/connections.config';

// Get default environment (respects .env DATASUL_ENVIRONMENT)
const currentEnv = getDefaultDatasulEnvironment();
console.log(`Using environment: ${currentEnv}`);

// Get connection using default environment
const emp = getDefaultDatasulConnection('emp');
// If DATASUL_ENVIRONMENT=test, returns DtsTstEmp
// If DATASUL_ENVIRONMENT=production (default), returns DtsPrdEmp

const logix = getDefaultInformixConnection();
// Returns LgxPrd by default, or respects INFORMIX_ENVIRONMENT
```

### 6. Using Connection Metadata

```typescript
import { getDatasulConnection } from '@config/connections.config';

const config = getDatasulConnection('production', 'emp');

// Access metadata
console.log(`Driver: ${config.metadata.driver}`);
console.log(`Read-only: ${config.metadata.readOnly}`);
console.log(`Default Schema: ${config.metadata.defaultSchema}`);
console.log(`Wide Chars: ${config.metadata.useWideCharacterTypes}`);

// Custom metadata (Informix)
import { getInformixConnection } from '@config/connections.config';
const lgx = getInformixConnection('development');
console.log(`Server: ${lgx.metadata.custom?.server}`);
console.log(`Protocol: ${lgx.metadata.custom?.protocol}`);
```

### 7. TypeScript Type Safety

```typescript
import {
  ConnectionConfig,
  DatasulEnvironment,
  SystemType,
  EnvironmentType,
  DatasulDatabaseType
} from '@config/connections.config';

// Type-safe function parameter
function connectToDatabase(config: ConnectionConfig): void {
  console.log(`Connecting to ${config.dsn}...`);

  // TypeScript knows all properties
  if (config.systemType === SystemType.DATASUL) {
    console.log(`Datasul database: ${config.purpose}`);
  }
}

// Type-safe environment selection
function getDatasulEnv(env: keyof ConnectionRegistry['datasul']): DatasulEnvironment {
  return AVAILABLE_CONNECTIONS.datasul[env];
  // TypeScript enforces: 'production' | 'test' | 'homologation'
}
```

### 8. Practical Integration Example

```typescript
import { getDefaultDatasulConnection } from '@config/connections.config';
import odbc from 'odbc';

async function queryItemData(itemCode: string) {
  // Get connection based on environment
  const config = getDefaultDatasulConnection('emp');

  console.log(`Connecting to ${config.description} (${config.dsn})...`);

  // Use ODBC connection
  const connection = await odbc.connect({
    connectionString: `DSN=${config.dsn}`,
    connectionTimeout: 10,
    loginTimeout: 10,
  });

  try {
    const result = await connection.query(
      `SELECT * FROM pub.item WHERE "it-codigo" = ?`,
      [itemCode]
    );

    return result;
  } finally {
    await connection.close();
  }
}

// Usage
const data = await queryItemData('ITEM001');
console.log(data);
```

## API Reference

### Enums

#### SystemType
```typescript
enum SystemType {
  INFORMIX = 'informix',
  DATASUL = 'datasul',
}
```

#### EnvironmentType
```typescript
enum EnvironmentType {
  DEVELOPMENT = 'development',
  TEST = 'test',
  HOMOLOGATION = 'homologation',
  PRODUCTION = 'production',
  ATUALIZAÇÃO = 'atualização',
  NEW = 'new',
}
```

#### DatasulDatabaseType
```typescript
enum DatasulDatabaseType {
  ADT = 'adt',
  EMP = 'emp',
  ESP = 'esp',
  MULT = 'mult',
  EMS5 = 'ems5',
  FND = 'fnd',
}
```

### Interfaces

#### ConnectionConfig
```typescript
interface ConnectionConfig {
  dsn: string;
  description: string;
  systemType: SystemType;
  environment: EnvironmentType;
  hostname: string;
  port: number;
  database: string;
  purpose?: DatasulDatabaseType;
  metadata: ConnectionMetadata;
}
```

#### ConnectionMetadata
```typescript
interface ConnectionMetadata {
  readOnly: boolean;
  driver: string;
  defaultSchema?: string;
  useWideCharacterTypes?: boolean;
  custom?: Record<string, unknown>;
}
```

### Functions

#### getDatasulConnection
```typescript
function getDatasulConnection(
  environment: 'production' | 'test' | 'homologation',
  purpose: 'adt' | 'emp' | 'esp' | 'mult' | 'ems5' | 'fnd'
): ConnectionConfig
```

#### getInformixConnection
```typescript
function getInformixConnection(
  environment: 'development' | 'atualização' | 'new' | 'production'
): ConnectionConfig
```

#### getConnection
```typescript
function getConnection(
  systemType: 'datasul' | 'informix',
  environment: string,
  purpose?: string
): ConnectionConfig | null
```

#### findConnectionByDSN
```typescript
function findConnectionByDSN(dsn: string): ConnectionConfig | null
```

#### getAllDSNs
```typescript
function getAllDSNs(systemType: 'datasul' | 'informix'): string[]
```

#### validateDSN
```typescript
function validateDSN(dsn: string): boolean
```

#### getConnectionsByEnvironment
```typescript
function getConnectionsByEnvironment(
  environment: EnvironmentType
): ConnectionConfig[]
```

#### getDefaultDatasulConnection
```typescript
function getDefaultDatasulConnection(
  purpose: 'adt' | 'emp' | 'esp' | 'mult' | 'ems5' | 'fnd'
): ConnectionConfig
```

#### getDefaultInformixConnection
```typescript
function getDefaultInformixConnection(): ConnectionConfig
```

## Environment Variables

Add to your `.env` file:

```bash
# ==================== ENVIRONMENT SELECTION ====================

# Datasul Environment Selection
# Values: production, test, homologation
# Default: production
DATASUL_ENVIRONMENT=production

# Informix Environment Selection
# Values: production, development, atualização, new
# Default: production
INFORMIX_ENVIRONMENT=production
```

### Usage

```bash
# Use test environment for Datasul
DATASUL_ENVIRONMENT=test npm start

# Use development environment for Informix
INFORMIX_ENVIRONMENT=development npm start

# Use homologation for Datasul
DATASUL_ENVIRONMENT=homologation npm start
```

## Best Practices

### 1. Always Use Helper Functions

```typescript
// ✅ GOOD - Type-safe, validated
const config = getDatasulConnection('production', 'emp');

// ❌ BAD - Direct access, error-prone
const config = AVAILABLE_CONNECTIONS.datasul.production.emp;
```

### 2. Validate DSNs Before Use

```typescript
// ✅ GOOD - Validate before connecting
const dsn = 'DtsPrdEmp';
if (validateDSN(dsn)) {
  const config = findConnectionByDSN(dsn);
  // Connect safely
}

// ❌ BAD - No validation
const config = findConnectionByDSN(dsn);
// config might be null!
```

### 3. Use Environment Variables for Flexibility

```typescript
// ✅ GOOD - Respects environment configuration
const config = getDefaultDatasulConnection('emp');
// Automatically uses DATASUL_ENVIRONMENT from .env

// ❌ BAD - Hardcoded environment
const config = getDatasulConnection('production', 'emp');
// Always uses production, ignores .env
```

### 4. Handle Null Returns

```typescript
// ✅ GOOD - Null-safe
const config = findConnectionByDSN('MaybeDSN');
if (config) {
  console.log(config.hostname);
}

// ❌ BAD - Can crash
const config = findConnectionByDSN('MaybeDSN');
console.log(config.hostname); // TypeError if null
```

### 5. Use TypeScript Types

```typescript
// ✅ GOOD - Type-safe
import { ConnectionConfig } from '@config/connections.config';

function connect(config: ConnectionConfig): Promise<void> {
  // TypeScript validates config structure
}

// ❌ BAD - No type safety
function connect(config: any): Promise<void> {
  // No validation
}
```

### 6. Leverage Metadata

```typescript
// ✅ GOOD - Use metadata for connection decisions
const config = getDatasulConnection('production', 'emp');

if (config.metadata.readOnly) {
  // Only run SELECT queries
}

if (config.metadata.defaultSchema) {
  // Use default schema in queries
  const query = `SELECT * FROM ${config.metadata.defaultSchema}.item`;
}
```

### 7. Centralize Connection Logic

```typescript
// ✅ GOOD - Central connection manager
class DatabaseManager {
  private static getConfig() {
    return getDefaultDatasulConnection('emp');
  }

  static async query(sql: string) {
    const config = this.getConfig();
    // Use config for connection
  }
}

// ❌ BAD - Scattered connection logic
// Multiple places deciding which DSN to use
```

## Testing

The configuration includes comprehensive tests. Run them with:

```bash
npm run test:unit -- connections.config.test
```

All 33 tests validate:
- All connection configurations
- Helper functions
- DSN validation
- Environment-based defaults
- TypeScript type safety
- Naming conventions

## Troubleshooting

### DSN Not Found

```typescript
const config = findConnectionByDSN('InvalidDSN');
// Returns: null

// Solution: Check available DSNs
const allDSNs = getAllDSNs('datasul');
console.log(allDSNs); // See all valid DSN names
```

### Wrong Environment Used

```bash
# Check current environment settings
echo $DATASUL_ENVIRONMENT

# Verify .env file
cat .env | grep DATASUL_ENVIRONMENT

# Override temporarily
DATASUL_ENVIRONMENT=test npm start
```

### Connection Metadata Missing

```typescript
const config = getInformixConnection('development');

// Informix doesn't have defaultSchema
console.log(config.metadata.defaultSchema); // undefined

// Use optional chaining
console.log(config.metadata.defaultSchema ?? 'no schema');
```

## Migration Guide

If you're migrating from hardcoded DSN names:

### Before
```typescript
const dsn = 'DtsPrdEmp'; // Hardcoded
```

### After
```typescript
import { getDefaultDatasulConnection } from '@config/connections.config';

const config = getDefaultDatasulConnection('emp');
const dsn = config.dsn; // Environment-aware
```

## Contributing

When adding new connections to `/etc/odbc.ini`:

1. Update `connections.config.ts` with new connection
2. Follow existing naming conventions
3. Add tests in `connections.config.test.ts`
4. Update this documentation
5. Run tests: `npm run test:unit -- connections.config.test`

## License

Internal use only - Lorenzetti LOR0138 Project
