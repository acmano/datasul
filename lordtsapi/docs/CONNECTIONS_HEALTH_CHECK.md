# Database Connections Health Check

Comprehensive health check test suite for all 28 database connections in the LordtsAPI project.

## Overview

This test suite validates connectivity to all configured database connections across:

- **18 Datasul ODBC connections** (3 environments x 6 databases)
- **4 Informix ODBC connections** (4 environments)
- **6 SQL Server connections** (PCFactory + Corporativo, 2 environments each)

## Quick Start

### Test All Connections (28 total)

```bash
# Run all health checks
npm run test:connections

# Or via bash script
./scripts/test-connections.sh all
```

### Test Specific Systems

```bash
# Test only Datasul connections (18)
npm run test:connections:datasul
./scripts/test-connections.sh datasul

# Test only Informix connections (4)
npm run test:connections:informix
./scripts/test-connections.sh informix

# Test only SQL Server connections (6)
npm run test:connections:sqlserver
./scripts/test-connections.sh sqlserver
```

## Connection Inventory

### Datasul ODBC (18 connections)

#### Production Environment
- `DtsPrdEmp` - Empresa (189.126.146.38:40002)
- `DtsPrdMult` - Múltiplas Empresas (189.126.146.38:40004)
- `DtsPrdAdt` - Auditoria (189.126.146.38:40001)
- `DtsPrdEsp` - Especial (189.126.146.38:40003)
- `DtsPrdEms5` - EMS5 (189.126.146.38:40006)
- `DtsPrdFnd` - Foundation (189.126.146.38:40007)

#### Test Environment
- `DtsTstEmp` - Empresa (189.126.146.71:41002)
- `DtsTstMult` - Múltiplas Empresas (189.126.146.71:41004)
- `DtsTstAdt` - Auditoria (189.126.146.71:41001)
- `DtsTstEsp` - Especial (189.126.146.71:41003)
- `DtsTstEms5` - EMS5 (189.126.146.71:41006)
- `DtsTstFnd` - Foundation (189.126.146.71:41007)

#### Homologation Environment
- `DtsHmlEmp` - Empresa (189.126.146.135:42002)
- `DtsHmlMult` - Múltiplas Empresas (189.126.146.135:42004)
- `DtsHmlAdt` - Auditoria (189.126.146.135:42001)
- `DtsHmlEsp` - Especial (189.126.146.135:42003)
- `DtsHmlEms5` - EMS5 (189.126.146.135:42006)
- `DtsHmlFnd` - Foundation (189.126.146.135:42007)

### Informix ODBC (4 connections)

- `LgxPrd` - Production (10.105.0.39:5511)
- `LgxDev` - Development (10.1.0.84:3515)
- `LgxAtu` - Atualização (10.1.0.84:3516)
- `LgxNew` - New (10.1.0.84:3517)

### SQL Server (6 connections)

#### PCFactory
- `PCF4_PRD` - Production Sistema (T-SRVSQL2022-01\mes)
- `PCF_Integ_PRD` - Production Integração (T-SRVSQL2022-01\mes)
- `PCF4_DEV` - Development Sistema (T-SRVSQL2022-01\mes)
- `PCF_Integ_DEV` - Development Integração (T-SRVSQL2022-01\mes)

#### Corporativo Lorenzetti
- `DATACORP_PRD` - Production (T-SRVSQL2022-01\LOREN)
- `DATACORP_DEV` - Development (T-SRVSQLDEV2022-01\LOREN)

## Test Configuration

### Timeout
Each connection test has a **10-second timeout**. If a connection doesn't respond within this time, it's marked as failed.

### Retry
Each connection gets **1 retry** attempt (2 total attempts) with a 1-second delay between retries.

### Test Execution
Tests run **sequentially** (`--runInBand`) to avoid overwhelming the database servers and to provide clear progress feedback.

## Understanding the Report

After running the tests, you'll see a comprehensive report:

```
========================================
Database Connection Health Check Report
========================================

Total Connections: 28
Healthy: 26 (92.86%)
Unhealthy: 2 (7.14%)

By System:
  Datasul:    18/18 (100%)
  Informix:   3/4 (75%)
  SQL Server: 5/6 (83.33%)

Failed Connections:
  LgxDev - Logix Development Environment
    Error: Timeout after 10000ms
  PCF_Integ_DEV - PCFactory Development - Integração
    Error: Connection refused

Slowest Connections:
  1. DtsPrdEmp - 2843ms
  2. LgxPrd - 1923ms
  3. PCF4_PRD - 892ms

Average Response Time: 645ms
========================================
```

### Report Sections

1. **Overall Statistics**
   - Total connections tested
   - Healthy vs unhealthy count
   - Overall health percentage

2. **By System Breakdown**
   - Individual statistics for Datasul, Informix, and SQL Server

3. **Failed Connections**
   - List of connections that failed to connect
   - Error messages for troubleshooting

4. **Slowest Connections**
   - Top 5 slowest responding connections
   - Useful for identifying performance issues

5. **Average Response Time**
   - Mean response time across all healthy connections

## Troubleshooting

### Connection Timeouts

If a connection times out:
1. Check network connectivity to the server
2. Verify firewall rules allow access to the port
3. Confirm the database server is running
4. Check if ODBC driver is properly installed (for ODBC connections)

### Connection Refused

If a connection is refused:
1. Verify the hostname/IP address is correct
2. Check if the port number is correct
3. Confirm database credentials in `.env` file
4. Verify the database user has proper permissions

### ODBC-Specific Issues

For ODBC connections (Datasul, Informix):
1. Verify `/etc/odbc.ini` has the correct DSN configuration
2. Check ODBC driver paths are correct
3. Ensure ODBC driver is compatible with your OS
4. Test DSN with `isql` command-line tool:
   ```bash
   isql -v DtsPrdEmp username password
   ```

### SQL Server Issues

For SQL Server connections:
1. Check SQL Server instance is running
2. Verify TCP/IP is enabled on the SQL Server
3. Confirm SQL Server Browser service is running (for named instances)
4. Test connection with `sqlcmd`:
   ```bash
   sqlcmd -S T-SRVSQL2022-01\mes -U sql_ppi -P pcf
   ```

## Environment Variables

The tests respect environment configuration:

```bash
# .env
DATASUL_ENVIRONMENT=production  # or test, homologation
INFORMIX_ENVIRONMENT=production # or development, atualização, new
PCFACTORY_ENVIRONMENT=production # or development
CORPORATIVO_ENVIRONMENT=production # or development

DB_USER=your_username
DB_PASSWORD=your_password
```

## CI/CD Integration

You can integrate these tests into your CI/CD pipeline:

```yaml
# .gitlab-ci.yml or .github/workflows/test.yml
test:connections:
  stage: test
  script:
    - npm run test:connections
  only:
    - schedules  # Run on schedule (e.g., nightly)
  allow_failure: true  # Don't fail pipeline if connections are down
```

## Manual Testing

For manual verification of a specific connection:

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Initialize
await DatabaseManager.initialize();

// Test specific connection
const health = await DatabaseManager.healthCheckConnection('DtsPrdEmp');
console.log(health.connected ? 'OK' : 'FAILED');
console.log(`Response time: ${health.responseTime}ms`);
```

## Best Practices

1. **Run regularly**: Schedule health checks daily or weekly
2. **Monitor trends**: Track average response times over time
3. **Alert on failures**: Set up notifications for failed connections
4. **Document changes**: When connections fail, document the resolution
5. **Test after changes**: Always run after infrastructure changes

## Files

- **Test Suite**: `src/infrastructure/database/__tests__/connections.health.test.ts`
- **Bash Script**: `scripts/test-connections.sh`
- **Package Scripts**: `package.json` (test:connections*)
- **Configuration**: `src/config/connections.config.ts`

## Related Documentation

- [Multi-Connection Management](./CONNECTIONS_USAGE.md)
- [Database Configuration](./DATABASE.md)
- [Testing Guide](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Support

If you encounter persistent connection issues:
1. Check the main documentation: [CLAUDE.md](../CLAUDE.md)
2. Review connection configuration: [connections.config.ts](../src/config/connections.config.ts)
3. Check database logs on the server
4. Contact your database administrator
