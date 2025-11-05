# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LordtsAPI Backend is a Node.js + TypeScript REST API for querying Datasul (LOR0138) ERP data, PCFactory MES, and Corporativo databases. The system provides read-only access to multiple database systems through a modern REST API with caching, metrics, and comprehensive error handling.

**Technology Stack:**
- Node.js 18+ with TypeScript
- Express.js for HTTP server
- SQL Server (native mssql) for PCFactory and Corporativo
- ODBC for Datasul database access (Progress OpenEdge via Linked Server)
- ODBC for Informix/Logix database access
- Redis for distributed caching
- Jest for testing
- Prometheus metrics for observability
- Winston for structured logging

## Development Workflow & Execution Strategy

### CRITICAL: Parallel Agent Execution

**PRIMARY DIRECTIVE:** When working on complex tasks, you MUST scale multiple agents and sub-agents to work in parallel for maximum efficiency.

**Mandatory Rules:**

1. **Parallel Execution:** Always invoke multiple agents simultaneously in a single message by using multiple Task tool calls. Never execute agents sequentially when they can run in parallel.

```typescript
// ✅ CORRECT - Parallel execution
<function_calls>
  <invoke name="Task">...</invoke>  // Agent 1
  <invoke name="Task">...</invoke>  // Agent 2 (runs in parallel)
  <invoke name="Task">...</invoke>  // Agent 3 (runs in parallel)

### Essential Commands

```bash
# Development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production server
npm start

# Linting
npm run lint          # Check for issues
npm run lint:fix      # Fix auto-fixable issues
npm run format        # Format with Prettier

# Testing
npm run test                    # Unit tests only
npm run test:unit               # Unit tests
npm run test:integration        # Integration tests
npm run test:e2e                # End-to-end tests
npm run test:coverage           # With coverage report
npm run test:mutation           # Mutation testing (Stryker)

# Run specific tests
npm run test:unit -- classificacoes        # Run tests matching pattern
npm run test:unit:watch                    # Watch mode
```

### Database Connection

The system supports two connection types (configured via `DB_CONNECTION_TYPE`):
- **sqlserver**: Direct SQL Server connection (mssql package)
- **odbc**: ODBC connection to Progress OpenEdge via Linked Server (RECOMMENDED)

**Important:** All database operations are READ-ONLY. Never write UPDATE/DELETE/INSERT queries.

**NEW in v2.0:** Multi-connection management system supporting **28 database connections** across multiple systems and environments:
- **22 ODBC connections** (18 Datasul + 4 Informix)
- **6 SQL Server connections** (4 PCFactory + 2 Corporativo)

See [Multi-Connection Management](#multi-connection-management) section below.

## Architecture

### Layered Architecture Pattern

**CRITICAL:** The codebase follows a strict 3-layer architecture. All new APIs MUST follow this pattern:

```
Controller → Service → Repository
```

- **Controller**: HTTP request handling, input validation, response formatting
- **Service**: Business logic, caching orchestration
- **Repository**: Database queries only

**Never skip layers.** Controllers should never access repositories directly.

### Module Structure

Each API endpoint follows this mandatory structure:

```
src/{entity}/{category}/{feature}/
├── controller.ts              # HTTP layer
├── service.ts                 # Business logic
├── repository.ts              # Data access
├── types.ts                   # TypeScript interfaces
├── validators.ts              # Input validation
├── routes.ts                  # Route definitions
└── __tests__/                 # Co-located tests
    ├── controller.test.ts
    ├── service.test.ts
    ├── repository.test.ts
    └── validators.test.ts
```

**Example:** `src/item/dadosCadastrais/informacoesGerais/`

### Path Aliases

Always use path aliases (never relative imports):

```typescript
// ✅ Correct
import { log } from '@shared/utils/logger';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { ValidationError } from '@shared/errors/errors';

// ❌ Wrong
import { log } from '../../../shared/utils/logger';
```

Available aliases (see `tsconfig.json`):
- `@/` → `src/`
- `@config/` → `src/config/`
- `@infrastructure/` → `src/infrastructure/`
- `@shared/` → `src/shared/`
- `@item/` → `src/item/`
- `@familia/` → `src/familia/`
- `@grupoDeEstoque/` → `src/grupoDeEstoque/`
- `@familiaComercial/` → `src/familiaComercial/`
- `@estabelecimento/` → `src/estabelecimento/`
- `@engenharia/` → `src/engenharia/`

### Database Access

**ALWAYS use parameterized queries** to prevent SQL injection:

```typescript
// ✅ Correct - Parameterized query
const result = await DatabaseManager.queryEmpWithParams(
  'SELECT * FROM item WHERE "it-codigo" = @codigo',
  [{ name: 'codigo', type: 'varchar', value: itemCodigo }]
);

// ❌ Wrong - String concatenation (SQL injection risk)
const result = await DatabaseManager.queryEmp(
  `SELECT * FROM item WHERE "it-codigo" = '${itemCodigo}'`
);
```

**Database Manager Methods:**
- `queryEmpWithParams(sql, params)` - Query EMP database (recommended)
- `queryMultWithParams(sql, params)` - Query MULT database (recommended)
- `queryEmp(sql)` - Legacy, deprecated
- `queryMult(sql)` - Legacy, deprecated

**Important:** Datasul field names use kebab-case with quotes: `"it-codigo"`, `"cod-estabel"`, `"grupo-estoq"`

## Multi-Connection Management

### Overview

The system now supports **28 database connections** organized by system type and environment, providing comprehensive access to all Datasul, Informix, PCFactory, and Corporativo databases. This multi-connection architecture enables:

- Environment-based configuration (production, test, homologation, development)
- On-demand connection creation (lazy initialization)
- Connection pooling and lifecycle management
- Health checking per connection
- Flexible deployment across environments
- Context-based queries with syntax sugar helpers

**Architecture:**
- **18 Datasul ODBC connections**: 3 environments × 6 databases each
  - Production: DtsPrdEmp, DtsPrdMult, DtsPrdAdt, DtsPrdEsp, DtsPrdEms5, DtsPrdFnd
  - Test: DtsTstEmp, DtsTstMult, DtsTstAdt, DtsTstEsp, DtsTstEms5, DtsTstFnd
  - Homologation: DtsHmlEmp, DtsHmlMult, DtsHmlAdt, DtsHmlEsp, DtsHmlEms5, DtsHmlFnd
- **4 Informix ODBC connections**: LgxDev, LgxAtu, LgxNew, LgxPrd
- **4 PCFactory SQL Server connections**: PCF4_PRD, PCF_Integ_PRD, PCF4_DEV, PCF_Integ_DEV
- **2 Corporativo SQL Server connections**: DATACORP_PRD, DATACORP_DEV

### Available Connections

#### Datasul Connections (18 total)

**Production Environment** (Host: 189.126.146.38)
- `DtsPrdEmp` - Empresa (Port: 40002, DB: ems2emp)
- `DtsPrdMult` - Múltiplas Empresas (Port: 40004, DB: ems2mult)
- `DtsPrdAdt` - Auditoria (Port: 40001, DB: ems2adt)
- `DtsPrdEsp` - Especial (Port: 40003, DB: ems2esp)
- `DtsPrdEms5` - EMS5 (Port: 40006, DB: ems5)
- `DtsPrdFnd` - Foundation (Port: 40007, DB: emsfnd)

**Test Environment** (Host: 189.126.146.71)
- `DtsTstEmp` - Empresa (Port: 41002, DB: ems2emp)
- `DtsTstMult` - Múltiplas Empresas (Port: 41004, DB: ems2mult)
- `DtsTstAdt` - Auditoria (Port: 41001, DB: ems2adt)
- `DtsTstEsp` - Especial (Port: 41003, DB: ems2esp)
- `DtsTstEms5` - EMS5 (Port: 41006, DB: ems5)
- `DtsTstFnd` - Foundation (Port: 41007, DB: emsfnd)

**Homologation Environment** (Host: 189.126.146.135)
- `DtsHmlEmp` - Empresa (Port: 42002, DB: ems2emp)
- `DtsHmlMult` - Múltiplas Empresas (Port: 42004, DB: ems2mult)
- `DtsHmlAdt` - Auditoria (Port: 42001, DB: ems2adt)
- `DtsHmlEsp` - Especial (Port: 42003, DB: ems2esp)
- `DtsHmlEms5` - EMS5 (Port: 42006, DB: ems5)
- `DtsHmlFnd` - Foundation (Port: 42007, DB: emsfnd)

#### Informix Connections (4 total)

- `LgxDev` - Development (Host: 10.1.0.84, Port: 3515)
- `LgxAtu` - Atualização (Host: 10.1.0.84, Port: 3516)
- `LgxNew` - New (Host: 10.1.0.84, Port: 3517)
- `LgxPrd` - Production (Host: 10.105.0.39, Port: 5511)

#### SQL Server Connections (6 total)

**PCFactory MES** (Host: T-SRVSQL2022-01\mes)
- `PCF4_PRD` - Production Sistema (DB: PCF4_PRD)
- `PCF_Integ_PRD` - Production Integração (DB: PCF_Integ_PRD)
- `PCF4_DEV` - Development Sistema (DB: PCF4_DEV)
- `PCF_Integ_DEV` - Development Integração (DB: PCF_Integ_DEV)

**Corporativo Lorenzetti**
- `DATACORP_PRD` - Production (Host: T-SRVSQL2022-01\LOREN, DB: DATACORP)
- `DATACORP_DEV` - Development (Host: T-SRVSQLDEV2022-01\LOREN, DB: DATACORP)

### connections.config.ts Module

The `src/config/connections.config.ts` module provides type-safe configuration for all connections.

**Key Interfaces:**

```typescript
// Connection configuration (ODBC)
interface ConnectionConfig {
  dsn: string;                    // Data Source Name
  description: string;            // Human-readable description
  systemType: SystemType;         // 'informix' | 'datasul' | 'pcfactory' | 'corporativo'
  environment: EnvironmentType;   // 'production' | 'test' | 'homologation' | 'development'
  hostname: string;               // Server hostname/IP
  port: number;                   // Server port
  database: string;               // Database name
  purpose?: DatasulDatabaseType;  // 'emp' | 'mult' | 'adt' | 'esp' | 'ems5' | 'fnd'
  metadata: ConnectionMetadata;   // Driver, schema, etc.
}

// SQL Server connection configuration
interface SqlServerConnectionConfig {
  name: string;                   // Connection name (e.g., 'PCF4_PRD')
  description: string;            // Human-readable description
  systemType: 'pcfactory' | 'corporativo';
  environment: 'production' | 'development';
  purpose?: 'sistema' | 'integracao';  // PCFactory only
  server: string;                 // SQL Server instance
  database: string;               // Database name
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    enableArithAbort: boolean;
  };
}

// Connection registry (central repository)
const AVAILABLE_CONNECTIONS: ConnectionRegistry = {
  datasul: {
    production: { emp, mult, adt, esp, ems5, fnd },
    test: { emp, mult, adt, esp, ems5, fnd },
    homologation: { emp, mult, adt, esp, ems5, fnd }
  },
  informix: {
    development: { logix },
    atualização: { logix },
    new: { logix },
    production: { logix }
  },
  pcfactory: {
    production: { sistema, integracao },
    development: { sistema, integracao }
  },
  corporativo: {
    production: { datacorp },
    development: { datacorp }
  }
};
```

**Helper Functions:**

```typescript
// ODBC Connections
findConnectionByDSN(dsn: string): ConnectionConfig | null
getDatasulConnection(environment: string, purpose: string): ConnectionConfig
getInformixConnection(environment: string): ConnectionConfig
getConnection(systemType: string, environment: string, purpose?: string): ConnectionConfig | null
validateDSN(dsn: string): boolean
getAllDSNs(systemType: 'datasul' | 'informix'): string[]
getConnectionsByEnvironment(environment: EnvironmentType): ConnectionConfig[]

// SQL Server Connections
getPCFactoryConnection(environment: 'production' | 'development', purpose: 'sistema' | 'integracao'): SqlServerConnectionConfig
getCorporativoConnection(environment: 'production' | 'development'): SqlServerConnectionConfig
getSqlServerConnection(system: 'pcfactory' | 'corporativo', environment: string, purpose?: string): SqlServerConnectionConfig | null

// Environment Defaults
getDefaultDatasulEnvironment(): 'production' | 'test' | 'homologation'
getDefaultInformixEnvironment(): 'production' | 'development' | 'atualização' | 'new'
getDefaultPCFactoryEnvironment(): 'production' | 'development'
getDefaultCorporativoEnvironment(): 'production' | 'development'
```

### DatabaseManager New APIs

The `DatabaseManager` class now provides comprehensive multi-connection support:

**Connection Retrieval:**

```typescript
// Get ODBC connection by DSN name
static async getConnectionByDSN(dsn: string): Promise<IConnection>

// Get ODBC connection by environment
static async getConnectionByEnvironment(
  system: 'datasul' | 'informix',
  environment: string,
  dbType?: string  // Required for Datasul: 'emp', 'mult', etc.
): Promise<IConnection>
```

**Query Execution (3 Methods):**

```typescript
// Method 1: Direct DSN (ODBC only)
static async queryWithConnection<T>(
  dsn: string,
  sql: string,
  params?: QueryParameter[]
): Promise<T[]>

// Method 2: Context-based (All systems - RECOMMENDED)
static async queryByContext<T>(
  context: {
    system: 'datasul' | 'informix' | 'pcfactory' | 'corporativo';
    purpose?: string;  // 'emp', 'mult', 'sistema', 'integracao', etc.
    environment?: string;  // Optional, uses default from .env
  },
  sql: string,
  params?: QueryParameter[]
): Promise<T[]>

// Method 3: Syntax Sugar Helpers (CLEANEST!)
static datasul = {
  emp: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> },
  mult: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> },
  adt: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> },
  esp: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> },
  ems5: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> },
  fnd: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> }
};

static informix = {
  query<T>(sql: string, params?: QueryParameter[]): Promise<T[]>
};

static pcfactory = {
  sistema: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> },
  integracao: { query<T>(sql: string, params?: QueryParameter[]): Promise<T[]> }
};

static corporativo = {
  query<T>(sql: string, params?: QueryParameter[]): Promise<T[]>
};
```

**Connection Management:**

```typescript
// Get active connections in pool
static getActiveConnections(): Array<{
  dsn: string;
  description: string;
  lastUsed: Date;
  activeQueries: number;
}>

// Close specific connection
static async closeConnection(dsn: string): Promise<void>

// Close all connections in pool
static async closeAllConnections(): Promise<void>

// Health check for specific connection
static async healthCheckConnection(dsn: string): Promise<{
  connected: boolean;
  responseTime: number;
}>
```

**Legacy Methods (maintained for compatibility):**

```typescript
// DEPRECATED - Use queryWithConnection() for new code
static async queryEmpWithParams(sql: string, params: QueryParameter[]): Promise<T[]>
static async queryMultWithParams(sql: string, params: QueryParameter[]): Promise<T[]>
static async queryEmp(sql: string): Promise<T[]>
static async queryMult(sql: string): Promise<T[]>
```

### Environment-Based Configuration

Control which environment connections use via environment variables:

**.env Configuration:**

```bash
# Datasul environment selection
DATASUL_ENVIRONMENT=production  # Options: production, test, homologation
# Default: production

# Informix environment selection
INFORMIX_ENVIRONMENT=production  # Options: development, atualização, new, production
# Default: production

# PCFactory environment selection
PCFACTORY_ENVIRONMENT=production  # Options: production, development
# Default: production

# Corporativo environment selection
CORPORATIVO_ENVIRONMENT=production  # Options: production, development
# Default: production
```

**Runtime Environment Selection:**

```typescript
import {
  getDefaultDatasulEnvironment,
  getDefaultInformixEnvironment,
  getDefaultDatasulConnection,
  getDefaultInformixConnection
} from '@config/connections.config';

// Get default environment (reads from .env)
const datasulEnv = getDefaultDatasulEnvironment();  // Returns 'production' | 'test' | 'homologation'
const informixEnv = getDefaultInformixEnvironment(); // Returns 'development' | 'atualização' | 'new' | 'production'

// Get default connection for a purpose
const empConn = getDefaultDatasulConnection('emp');  // Uses DATASUL_ENVIRONMENT
const logixConn = getDefaultInformixConnection();    // Uses INFORMIX_ENVIRONMENT
```

### Usage Examples

#### Example 1: Query Specific Connection by DSN

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Direct DSN access
const result = await DatabaseManager.queryWithConnection(
  'DtsPrdEmp',
  'SELECT * FROM item WHERE "it-codigo" = ?',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);
```

#### Example 2: Environment-Based Connection

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Get connection by environment (useful for testing)
const connection = await DatabaseManager.getConnectionByEnvironment(
  'datasul',
  'test',      // Use test environment
  'emp'        // EMP database
);

const result = await connection.queryWithParams(
  'SELECT * FROM item WHERE "it-codigo" = ?',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);
```

#### Example 3: Multi-Environment Repository

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { getDefaultDatasulEnvironment } from '@config/connections.config';

export class ItemRepository {
  static async getItem(itemCodigo: string) {
    // Automatically use environment from .env
    const env = getDefaultDatasulEnvironment();

    const connection = await DatabaseManager.getConnectionByEnvironment(
      'datasul',
      env,
      'emp'
    );

    return connection.queryWithParams(
      'SELECT * FROM item WHERE "it-codigo" = ?',
      [{ name: 'codigo', type: 'varchar', value: itemCodigo }]
    );
  }
}
```

#### Example 4: Connection Pool Management

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// List active connections
const active = DatabaseManager.getActiveConnections();
console.log(`Active connections: ${active.length}`);
active.forEach(conn => {
  console.log(`${conn.dsn}: ${conn.description} (${conn.activeQueries} queries)`);
});

// Close specific connection
await DatabaseManager.closeConnection('DtsTstEmp');

// Close all connections (cleanup on shutdown)
await DatabaseManager.closeAllConnections();
```

#### Example 5: Health Check

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Check specific connection
const health = await DatabaseManager.healthCheckConnection('DtsPrdEmp');
if (health.connected) {
  console.log(`OK - Response time: ${health.responseTime}ms`);
} else {
  console.error('Connection failed');
}
```

#### Example 6: Using Connection Config Directly

```typescript
import {
  AVAILABLE_CONNECTIONS,
  getDatasulConnection,
  getInformixConnection,
  findConnectionByDSN
} from '@config/connections.config';

// Access configuration directly
const prodEmp = AVAILABLE_CONNECTIONS.datasul.production.emp;
console.log(`DSN: ${prodEmp.dsn}`);
console.log(`Host: ${prodEmp.hostname}:${prodEmp.port}`);
console.log(`Database: ${prodEmp.database}`);

// Get by environment/purpose
const testMult = getDatasulConnection('test', 'mult');
console.log(testMult.description);

// Find by DSN
const config = findConnectionByDSN('LgxDev');
if (config) {
  console.log(`Found: ${config.description}`);
}
```

#### Example 7: SQL Server - PCFactory Queries (3 Methods)

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Method 1: Direct connection name (not recommended - no type safety)
const result1 = await DatabaseManager.queryWithConnection(
  'PCF4_PRD',
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// Method 2: Context-based (recommended - type safe)
const result2 = await DatabaseManager.queryByContext(
  {
    system: 'pcfactory',
    purpose: 'sistema'  // or 'integracao'
    // environment: 'production' is default from .env
  },
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// Method 3: Syntax sugar helper (cleanest!)
const result3 = await DatabaseManager.pcfactory.sistema.query(
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// PCFactory Integração database
const integracaoData = await DatabaseManager.pcfactory.integracao.query(
  'SELECT * FROM IntegrationLog WHERE Status = @status',
  [{ name: 'status', type: 'varchar', value: 'Pending' }]
);
```

#### Example 8: SQL Server - Corporativo Queries (3 Methods)

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Method 1: Direct connection name
const result1 = await DatabaseManager.queryWithConnection(
  'DATACORP_PRD',
  'SELECT * FROM Employees WHERE EmployeeID = @id',
  [{ name: 'id', type: 'int', value: 100 }]
);

// Method 2: Context-based (recommended)
const result2 = await DatabaseManager.queryByContext(
  {
    system: 'corporativo'
    // environment: 'production' is default
  },
  'SELECT * FROM Employees WHERE EmployeeID = @id',
  [{ name: 'id', type: 'int', value: 100 }]
);

// Method 3: Syntax sugar helper (cleanest!)
const result3 = await DatabaseManager.corporativo.query(
  'SELECT * FROM Employees WHERE EmployeeID = @id',
  [{ name: 'id', type: 'int', value: 100 }]
);
```

#### Example 9: Mixed System Queries

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Query from multiple systems in one repository
export class MultiSystemRepository {
  static async getItemData(itemCode: string) {
    // Get from Datasul (ODBC)
    const datasulItem = await DatabaseManager.datasul.emp.query(
      'SELECT * FROM item WHERE "it-codigo" = ?',
      [{ name: 'codigo', type: 'varchar', value: itemCode }]
    );

    // Get from PCFactory (SQL Server)
    const pcfOrders = await DatabaseManager.pcfactory.sistema.query(
      'SELECT * FROM Orders WHERE ItemCode = @code',
      [{ name: 'code', type: 'varchar', value: itemCode }]
    );

    // Get from Corporativo (SQL Server)
    const corpData = await DatabaseManager.corporativo.query(
      'SELECT * FROM Products WHERE Code = @code',
      [{ name: 'code', type: 'varchar', value: itemCode }]
    );

    return {
      datasul: datasulItem[0],
      pcfactory: pcfOrders,
      corporativo: corpData[0]
    };
  }
}
```

### Migration Guide: Legacy to New Approach

**Old Way (Legacy - Still Supported):**

```typescript
// LEGACY - Uses DB_DATABASE_EMP from .env
const result = await DatabaseManager.queryEmpWithParams(
  'SELECT * FROM item WHERE "it-codigo" = @codigo',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);
```

**New Way (Recommended):**

```typescript
// MODERN - Explicit environment selection
const result = await DatabaseManager.queryWithConnection(
  'DtsPrdEmp',  // Explicit DSN
  'SELECT * FROM item WHERE "it-codigo" = ?',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);

// OR with environment-based selection
const connection = await DatabaseManager.getConnectionByEnvironment(
  'datasul',
  process.env.DATASUL_ENVIRONMENT || 'production',
  'emp'
);
const result = await connection.queryWithParams(sql, params);
```

**New Way (SQL Server - 3 Options):**

```typescript
// Option 1: Direct connection name
const result = await DatabaseManager.queryWithConnection(
  'PCF4_PRD',
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// Option 2: Context-based (recommended)
const result = await DatabaseManager.queryByContext(
  { system: 'pcfactory', purpose: 'sistema' },
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// Option 3: Syntax sugar helper (CLEANEST!)
const result = await DatabaseManager.pcfactory.sistema.query(
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);
```

**Benefits of New Approach:**
- Explicit environment selection (production vs test vs homologation)
- Type safety with TypeScript
- Access to all 28 connections (22 ODBC + 6 SQL Server)
- Better testability (easy to switch environments)
- Connection pooling and lifecycle management
- Health checking per connection
- Unified API for ODBC and SQL Server
- Clean syntax sugar helpers for common queries

**Migration Checklist:**

1. ✅ Update repositories to use `queryWithConnection()` or `getConnectionByEnvironment()`
2. ✅ Replace hardcoded DSNs with environment-based selection
3. ✅ Add `DATASUL_ENVIRONMENT` to `.env` for environment switching
4. ✅ Use `getDefaultDatasulConnection()` for automatic environment selection
5. ✅ Test with different environments (test, homologation)
6. ✅ Update tests to use test environment connections
7. ✅ Monitor connection pool with `getActiveConnections()`

**Backward Compatibility:**

All legacy methods are maintained and fully functional:
- `queryEmpWithParams()` - Still works, uses legacy connection
- `queryMultWithParams()` - Still works, uses legacy connection
- `queryEmp()` - Still works (deprecated, avoid in new code)
- `queryMult()` - Still works (deprecated, avoid in new code)

No breaking changes - existing code continues to work!

### Health Check Endpoints

New HTTP endpoints for monitoring connection health:

```bash
# List all connections with health status (28 connections total)
GET /health/connections

# Check specific connection (ODBC or SQL Server)
GET /health/connections/:dsn
# Examples:
#   GET /health/connections/DtsPrdEmp  (Datasul ODBC)
#   GET /health/connections/PCF4_PRD   (PCFactory SQL Server)
#   GET /health/connections/DATACORP_PRD (Corporativo SQL Server)

# Check all connections for an environment
GET /health/connections/environment/:env
# Example: GET /health/connections/environment/production

# Check all connections for a system
GET /health/connections/system/:system
# Examples:
#   GET /health/connections/system/datasul
#   GET /health/connections/system/informix
#   GET /health/connections/system/pcfactory
#   GET /health/connections/system/corporativo

# Get active connections in pool (no health check)
GET /health/connections/active

# Clear health check cache
POST /health/connections/cache/clear

# Get cache statistics
GET /health/connections/cache/stats
```

**Response Example:**

```json
{
  "success": true,
  "timestamp": "2025-10-25T10:30:00.000Z",
  "connections": [
    {
      "dsn": "DtsPrdEmp",
      "description": "Datasul Production - Empresa",
      "systemType": "datasul",
      "environment": "production",
      "purpose": "emp",
      "connected": true,
      "responseTime": 45,
      "hostname": "189.126.146.38",
      "port": 40002
    },
    {
      "name": "PCF4_PRD",
      "description": "PCFactory Production - Sistema",
      "systemType": "pcfactory",
      "environment": "production",
      "purpose": "sistema",
      "connected": true,
      "responseTime": 32,
      "server": "T-SRVSQL2022-01\\mes",
      "database": "PCF4_PRD"
    },
    {
      "name": "DATACORP_PRD",
      "description": "Corporativo Lorenzetti - Production",
      "systemType": "corporativo",
      "environment": "production",
      "connected": true,
      "responseTime": 28,
      "server": "T-SRVSQL2022-01\\LOREN",
      "database": "DATACORP"
    }
  ],
  "summary": {
    "total": 28,
    "odbc": 22,
    "sqlserver": 6,
    "healthy": 27,
    "unhealthy": 1,
    "healthPercentage": 96.43
  }
}
```

### Best Practices

**DO:**
- ✅ Use **syntax sugar helpers** for cleanest code (`DatabaseManager.pcfactory.sistema.query()`)
- ✅ Use `queryByContext()` for type-safe, environment-aware queries
- ✅ Use environment variables to control which environment to access
- ✅ Use `getDefaultDatasulConnection()` for automatic environment selection
- ✅ Close connections when done with `closeConnection()` or `closeAllConnections()`
- ✅ Monitor connection pool with `getActiveConnections()`
- ✅ Use health check endpoints for monitoring all 28 connections
- ✅ Always use parameterized queries to prevent SQL injection
- ✅ Prefer syntax sugar helpers over direct DSN/connection names

**DON'T:**
- ❌ Don't hardcode DSN/connection names in repositories (use environment-based selection)
- ❌ Don't use legacy `queryEmp()`/`queryMult()` for new code
- ❌ Don't create connections manually (use DatabaseManager)
- ❌ Don't forget to set environment variables in `.env` (DATASUL_ENVIRONMENT, PCFACTORY_ENVIRONMENT, etc.)
- ❌ Don't mix legacy and new approaches in the same repository
- ❌ Don't bypass the unified DatabaseManager API

### Middleware Stack (ORDERED)

The middleware order in `app.ts` is critical:

1. **Correlation ID** - Request tracking (req.id)
2. **Metrics** - Prometheus instrumentation
3. **Logging** - Request/response logging
4. **Helmet** - Security headers
5. **CORS** - Cross-origin resource sharing
6. **Body Parsing** - JSON/URL-encoded
7. **Compression** - gzip compression
8. **Timeout** - Request timeout (30s default)
9. **Rate Limiting** - Per-IP rate limiting

### Error Handling

Use custom error classes for consistent error responses:

```typescript
import { ValidationError, ItemNotFoundError, DatabaseError } from '@shared/errors/errors';

// Validation error
if (!itemCodigo) {
  throw new ValidationError('Código obrigatório', { field: 'itemCodigo' });
}

// Not found error
if (!item) {
  throw new ItemNotFoundError(itemCodigo);
}

// Controllers must use asyncHandler
export class MyController {
  static getItem = asyncHandler(async (req: Request, res: Response) => {
    // Errors are automatically caught and handled
    const data = await MyService.getData(req.params.id);
    res.json({ success: true, data, correlationId: req.id });
  });
}
```

**Never:**
- Use `try-catch` in controllers (asyncHandler handles it)
- Swallow errors silently
- Use `console.log` (use `log.debug/info/warn/error` instead)

### Caching Strategy

The system implements a layered cache (L1 + L2):

- **L1 Cache**: In-memory (node-cache) - Fast but per-instance
- **L2 Cache**: Redis - Shared across instances
- **Strategy**: `layered` (recommended), `memory`, or `redis`

```typescript
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';

// Use cache in services
const cacheKey = generateCacheKey('item', itemCodigo, 'info');

const result = await CacheManager.getOrSet(
  cacheKey,
  async () => {
    return await Repository.fetchData(itemCodigo);
  },
  300 // TTL in seconds
);
```

### Logging

Use structured logging with correlation IDs:

```typescript
import { log } from '@shared/utils/logger';

// Always include correlationId from request
log.info('Processing request', {
  correlationId: req.id,
  itemCodigo,
  userId: req.user?.id
});

log.error('Database error', {
  correlationId: req.id,
  error: error.message,
  stack: error.stack
});
```

**Log Levels:**
- `debug` - Development details
- `info` - Normal operations
- `warn` - Recoverable issues
- `error` - Errors requiring attention

### Testing Requirements

**Minimum Coverage:** 75% overall
- Validators: 90%+
- Services: 80%+
- Repositories: 70%+
- Controllers: 70%+

**Test Structure:**

```typescript
describe('ModuleName', () => {
  describe('methodName', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should do X when Y', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBeDefined();
    });

    it('should throw error when invalid', async () => {
      await expect(
        service.method(invalid)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

## Adding New API Endpoints

### Step-by-Step Process

1. **Create module structure** following the pattern above
2. **Define types** in `types.ts`
3. **Create validators** with proper error messages
4. **Implement repository** with parameterized queries
5. **Implement service** with cache integration
6. **Implement controller** using asyncHandler
7. **Define routes** with OpenAPI/Swagger docs
8. **Register route** in `app.ts` setupRoutes()
9. **Write tests** for all layers (unit + integration)
10. **Verify coverage** meets thresholds

### Route Registration

Add new routes in `src/app.ts` in the `setupRoutes()` method:

```typescript
import newFeatureRoutes from '@/item/newFeature/routes';

private setupRoutes(): void {
  // ... existing routes
  this.app.use('/api/item/newFeature', newFeatureRoutes);
}
```

### OpenAPI Documentation

All routes must include OpenAPI/Swagger documentation:

```typescript
/**
 * @openapi
 * /api/item/{itemCodigo}:
 *   get:
 *     summary: Get item details
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/:itemCodigo', controller);
```

Docs available at: `http://localhost:3000/api-docs`

## Important Conventions

### Naming Conventions

- **Files**: camelCase.type.ts (`informacoesGerais.controller.ts`)
- **Classes**: PascalCase (`InformacoesGeraisController`)
- **Functions/Methods**: camelCase (`getInformacoesGerais`)
- **Constants**: UPPER_SNAKE_CASE or camelCase for private
- **Interfaces**: PascalCase (`InformacoesGerais`)
- **URLs**: camelCase (`/api/item/dadosCadastrais/informacoesGerais`)

### Never Do This

1. **Never** bypass the layered architecture (Controller → Service → Repository)
2. **Never** use relative imports for shared modules (use path aliases)
3. **Never** concatenate user input in SQL queries (use parameters)
4. **Never** use `console.log` (use `log.*` instead)
5. **Never** write UPDATE/INSERT/DELETE queries (read-only system)
6. **Never** ignore errors or swallow exceptions
7. **Never** use kebab-case in URLs (use camelCase)
8. **Never** commit without running tests and linting

## Environment Configuration

Copy `.env.example` to `.env` and configure:

**Critical settings:**
- `DB_CONNECTION_TYPE` - 'sqlserver' or 'odbc' (RECOMMENDED: 'odbc')
- `DB_PASSWORD` - Use single quotes if password contains `#`
- `DB_DATABASE_EMP` - Leave empty to use user's default database (LEGACY)
- `DATASUL_ENVIRONMENT` - 'production' (default), 'test', or 'homologation' (NEW)
- `INFORMIX_ENVIRONMENT` - 'production' (default), 'development', 'atualização', or 'new' (NEW)
- `CACHE_STRATEGY` - 'layered' (recommended), 'memory', or 'redis'
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins

**Multi-Connection Environment Variables (NEW):**

```bash
# .env

# Datasul environment selection (ODBC)
DATASUL_ENVIRONMENT=production  # Options: production, test, homologation
# Controls which Datasul environment to use across all connections
# Default: production

# Informix environment selection (ODBC)
INFORMIX_ENVIRONMENT=production  # Options: development, atualização, new, production
# Controls which Informix environment to use
# Default: production

# PCFactory environment selection (SQL Server)
PCFACTORY_ENVIRONMENT=production  # Options: production, development
# Controls which PCFactory MES environment to use
# Default: production

# Corporativo environment selection (SQL Server)
CORPORATIVO_ENVIRONMENT=production  # Options: production, development
# Controls which Corporativo environment to use
# Default: production

# Connection type (RECOMMENDED: odbc for Datasul/Informix)
DB_CONNECTION_TYPE=odbc  # Options: odbc, sqlserver
```

These environment variables enable easy switching between environments without code changes. Perfect for development, testing, and staging deployments across all 28 database connections.

## Health & Monitoring

### General Health Endpoints
- **Health Check**: `GET /health` - Database and cache status
- **Metrics**: `GET /metrics` - Prometheus metrics
- **Cache Stats**: `GET /cache/stats` - Cache hit rates
- **API Docs**: `GET /api-docs` - Swagger UI

### Connection Health Endpoints (NEW)
- **All Connections**: `GET /health/connections` - Status of all 28 connections (22 ODBC + 6 SQL Server)
- **Specific Connection**: `GET /health/connections/:dsn` - Check single connection
  - Examples: DtsPrdEmp (ODBC), PCF4_PRD (SQL Server), DATACORP_PRD (SQL Server)
- **By Environment**: `GET /health/connections/environment/:env` - All connections for environment
  - Supports: production, test, homologation, development
- **By System**: `GET /health/connections/system/:system` - All connections for system
  - Supports: datasul, informix, pcfactory, corporativo
- **Active Connections**: `GET /health/connections/active` - Current pool status
- **Cache Control**: `POST /health/connections/cache/clear` - Clear health check cache
- **Cache Stats**: `GET /health/connections/cache/stats` - Health check cache statistics

See [Multi-Connection Management](#multi-connection-management) for detailed documentation.

## Key Files to Update

When adding new features:

1. `src/app.ts` - Register new routes
2. `README.md` - Document new endpoints
3. `CHANGELOG.md` - Track changes
4. `.env.example` - Add new environment variables (if any)

## Reference Documentation

For detailed implementation guidelines, see:
- `docs/DEVELOPER_GUIDE.md` - Comprehensive development standards (CRITICAL)
- `docs/API.md` - API documentation
- `docs/DEPLOYMENT.md` - Deployment procedures
- `package.json` - All available scripts

## Contact & Support

- **Repository**: https://github.com/acmano/lordtsapiBackend.git
- **Issues**: Report bugs via GitHub issues
