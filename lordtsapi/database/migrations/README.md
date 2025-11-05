# Database Migrations

This directory contains SQL Server database migration scripts for the LordtsAPI backend system.

## Overview

Migrations are versioned SQL scripts that evolve the database schema over time. Each migration has:
- **Forward migration**: Creates/modifies database objects
- **Rollback script**: Safely reverts the changes

## Directory Structure

```
database/migrations/
├── README.md                          # This file
├── 001_create_gpc_tables.sql         # GPC structure creation
└── 001_rollback_gpc_tables.sql       # GPC structure rollback
```

## Naming Convention

Migrations follow the pattern: `{version}_{description}.sql`

- `{version}`: 3-digit sequential number (001, 002, 003...)
- `{description}`: Descriptive name in snake_case
- Rollback scripts: `{version}_rollback_{description}.sql`

**Examples:**
- `001_create_gpc_tables.sql` - Forward migration
- `001_rollback_gpc_tables.sql` - Rollback migration
- `002_add_gpc_attributes.sql` - Next migration

## Migration 001: GPC Tables

**Purpose:** Create complete GPC (Global Product Classification) database structure.

**Tables Created:**
1. `gpc_classification` - GPC hierarchy (Segment → Family → Class → Brick)
2. `gtin_gpc_mapping` - GTIN (barcode) to GPC mappings
3. `ncm_gpc_mapping` - NCM (Brazilian tax code) to GPC mappings
4. `cest_gpc_mapping` - CEST (Brazilian tax substitution) to GPC mappings

**Features:**
- Unicode support (NVARCHAR for PT-BR and EN)
- Hierarchical structure (4 levels)
- Foreign key constraints for referential integrity
- Optimized indexes for query performance
- Confidence levels for data quality tracking
- Audit timestamps (created_at, updated_at)

## Execution Methods

### Method 1: SQL Server Management Studio (SSMS)

**Recommended for:** Windows users, visual interface

1. Open SQL Server Management Studio
2. Connect to DATACORP server:
   - **Production:** `T-SRVSQL2022-01\LOREN`
   - **Development:** `T-SRVSQLDEV2022-01\LOREN`
3. Select DATACORP database
4. Open migration file: `File → Open → File...`
5. Review the script carefully
6. Execute: Press `F5` or click `Execute`
7. Verify output messages in Messages tab

### Method 2: Azure Data Studio

**Recommended for:** Cross-platform users, modern interface

1. Open Azure Data Studio
2. Connect to DATACORP server:
   - **Server:** `T-SRVSQL2022-01\LOREN` (prod) or `T-SRVSQLDEV2022-01\LOREN` (dev)
   - **Database:** DATACORP
   - **Authentication:** SQL Login
   - **User:** `dcloren`
   - **Password:** (see .env file)
3. Open migration file: `File → Open File...`
4. Review the script
5. Execute: Click `Run` or press `F5`
6. Check results in Messages panel

### Method 3: sqlcmd CLI

**Recommended for:** Automation, CI/CD pipelines, Linux users

**Production:**
```bash
sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" -i 001_create_gpc_tables.sql -o migration_output.log
```

**Development:**
```bash
sqlcmd -S "T-SRVSQLDEV2022-01\LOREN" -d DATACORP -U dcloren -P "#dclorendev#" -i 001_create_gpc_tables.sql -o migration_output.log
```

**Options:**
- `-S` : SQL Server instance
- `-d` : Database name
- `-U` : Username
- `-P` : Password (use quotes for special characters)
- `-i` : Input SQL file
- `-o` : Output log file (optional)
- `-E` : Use Windows Authentication (instead of -U/-P)

**View output:**
```bash
cat migration_output.log
```

### Method 4: Node.js (mssql package)

**Recommended for:** Integration with LordtsAPI, automated deployments

**Create migration runner:**

```javascript
// database/run-migration.js
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function runMigration(filename) {
  const config = {
    server: process.env.CORPORATIVO_ENVIRONMENT === 'production'
      ? 'T-SRVSQL2022-01\\LOREN'
      : 'T-SRVSQLDEV2022-01\\LOREN',
    database: 'DATACORP',
    user: 'dcloren',
    password: process.env.CORPORATIVO_ENVIRONMENT === 'production'
      ? '#dcloren#'
      : '#dclorendev#',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Connect to database
    console.log(`Connecting to ${config.server}...`);
    await sql.connect(config);
    console.log('Connected successfully');

    // Execute migration
    console.log(`Running migration: ${filename}...`);
    const result = await sql.query(migrationSQL);
    console.log('Migration completed successfully');
    console.log('Rows affected:', result.rowsAffected);

    // Close connection
    await sql.close();
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run with: node run-migration.js 001_create_gpc_tables.sql
const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node run-migration.js <migration_file.sql>');
  process.exit(1);
}

runMigration(filename);
```

**Execute:**
```bash
# Production
CORPORATIVO_ENVIRONMENT=production node database/run-migration.js 001_create_gpc_tables.sql

# Development
CORPORATIVO_ENVIRONMENT=development node database/run-migration.js 001_create_gpc_tables.sql
```

**Add to package.json:**
```json
{
  "scripts": {
    "migrate:gpc": "node database/run-migration.js 001_create_gpc_tables.sql",
    "migrate:gpc:rollback": "node database/run-migration.js 001_rollback_gpc_tables.sql"
  }
}
```

**Run via npm:**
```bash
npm run migrate:gpc
npm run migrate:gpc:rollback
```

## Migration Workflow

### Forward Migration (Create Tables)

1. **Backup database** (production only):
   ```sql
   BACKUP DATABASE DATACORP TO DISK = 'C:\Backups\DATACORP_before_migration_001.bak';
   ```

2. **Review migration script:**
   - Read `001_create_gpc_tables.sql` carefully
   - Understand what tables/indexes will be created
   - Check for conflicts with existing objects

3. **Test in development first:**
   ```bash
   # Development environment
   sqlcmd -S "T-SRVSQLDEV2022-01\LOREN" -d DATACORP -U dcloren -P "#dclorendev#" -i 001_create_gpc_tables.sql
   ```

4. **Verify in development:**
   ```sql
   -- Check tables
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%gpc%';

   -- Check indexes
   EXEC sp_helpindex 'gpc_classification';
   EXEC sp_helpindex 'gtin_gpc_mapping';

   -- Check foreign keys
   EXEC sp_fkeys @pktable_name = 'gpc_classification';
   ```

5. **Run in production** (if dev tests passed):
   ```bash
   # Production environment
   sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" -i 001_create_gpc_tables.sql
   ```

6. **Verify in production:**
   - Run the same verification queries as step 4
   - Check for errors in output log
   - Test basic queries on new tables

### Rollback Migration (Drop Tables)

**WARNING:** Rollback permanently deletes all data in GPC tables!

1. **Backup first** (if you want to preserve data):
   ```sql
   -- Export GPC data before rollback
   SELECT * INTO gpc_classification_backup FROM gpc_classification;
   SELECT * INTO gtin_gpc_mapping_backup FROM gtin_gpc_mapping;
   SELECT * INTO ncm_gpc_mapping_backup FROM ncm_gpc_mapping;
   SELECT * INTO cest_gpc_mapping_backup FROM cest_gpc_mapping;
   ```

2. **Run rollback script:**
   ```bash
   # Development
   sqlcmd -S "T-SRVSQLDEV2022-01\LOREN" -d DATACORP -U dcloren -P "#dclorendev#" -i 001_rollback_gpc_tables.sql

   # Production (use with extreme caution!)
   sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" -i 001_rollback_gpc_tables.sql
   ```

3. **Verify rollback:**
   ```sql
   -- Should return 0 rows
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%gpc%';
   ```

## Verification Queries

### Check if migration was applied

```sql
-- List all GPC tables
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%gpc%'
ORDER BY TABLE_NAME;

-- Expected: 4 tables (gpc_classification, gtin_gpc_mapping, ncm_gpc_mapping, cest_gpc_mapping)
```

### Check indexes

```sql
-- List all indexes on GPC tables
SELECT
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE OBJECT_NAME(i.object_id) LIKE '%gpc%'
ORDER BY TableName, i.index_id, ic.key_ordinal;

-- Expected: 11 indexes total
```

### Check foreign keys

```sql
-- List all foreign key relationships
SELECT
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) LIKE '%gpc%'
ORDER BY TableName;

-- Expected: 3 foreign keys
--   gtin_gpc_mapping.brick_code → gpc_classification.brick_code
--   ncm_gpc_mapping.brick_code → gpc_classification.brick_code
--   cest_gpc_mapping.brick_code → gpc_classification.brick_code
```

### Check table structure

```sql
-- Detailed column information for all GPC tables
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE '%gpc%'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

## Sample Data Queries

### Insert sample GPC classification

```sql
INSERT INTO gpc_classification (
    brick_code, brick_name_pt, brick_name_en,
    class_code, class_name_pt, class_name_en,
    family_code, family_name_pt, family_name_en,
    segment_code, segment_name_pt, segment_name_en
) VALUES (
    '50101001', 'Mussarela Fresca', 'Fresh Mozzarella',
    '501010', 'Queijo', 'Cheese',
    '5010', 'Laticínios', 'Dairy Products',
    '50', 'Alimentos/Bebidas/Tabaco', 'Food/Beverage/Tobacco'
);
```

### Insert sample GTIN mapping

```sql
INSERT INTO gtin_gpc_mapping (gtin, brick_code, confidence_level, source)
VALUES ('7896524201051', '50101001', 'verified', 'GS1_Brazil');
```

### Insert sample NCM mapping

```sql
INSERT INTO ncm_gpc_mapping (ncm, brick_code, confidence_level, source)
VALUES ('04061010', '50101001', 'verified', 'Receita_Federal_2024');
```

### Insert sample CEST mapping

```sql
INSERT INTO cest_gpc_mapping (cest, brick_code, confidence_level, source)
VALUES ('1701100', '50131501', 'manual', 'Confaz_Conv_92_2015');
```

### Query GPC hierarchy

```sql
-- Get complete hierarchy for a product
SELECT
    g.segment_code,
    g.segment_name_pt AS segment_name,
    g.family_code,
    g.family_name_pt AS family_name,
    g.class_code,
    g.class_name_pt AS class_name,
    g.brick_code,
    g.brick_name_pt AS brick_name
FROM gpc_classification g
WHERE g.brick_code = '50101001';
```

### Query GTIN to GPC mapping

```sql
-- Find GPC classification for a barcode
SELECT
    gtm.gtin,
    gtm.confidence_level,
    gtm.source,
    g.brick_name_pt,
    g.class_name_pt,
    g.family_name_pt,
    g.segment_name_pt
FROM gtin_gpc_mapping gtm
JOIN gpc_classification g ON gtm.brick_code = g.brick_code
WHERE gtm.gtin = '7896524201051';
```

## Troubleshooting

### Error: Object already exists

```
Msg 2714: There is already an object named 'gpc_classification' in the database.
```

**Solution:** The migration includes `IF NOT EXISTS` checks, but if you see this error:
1. Check if tables were partially created
2. Run rollback script first: `001_rollback_gpc_tables.sql`
3. Re-run forward migration: `001_create_gpc_tables.sql`

### Error: Foreign key constraint violation

```
Msg 547: The INSERT statement conflicted with the FOREIGN KEY constraint...
```

**Solution:** Ensure you insert data in correct order:
1. First: `gpc_classification` (parent table)
2. Then: `gtin_gpc_mapping`, `ncm_gpc_mapping`, `cest_gpc_mapping` (child tables)

### Error: Cannot drop table (referenced by foreign key)

```
Msg 3726: Could not drop object 'gpc_classification' because it is referenced by a FOREIGN KEY constraint.
```

**Solution:** Use the rollback script which drops tables in correct order:
1. First: Child tables (gtin_gpc_mapping, ncm_gpc_mapping, cest_gpc_mapping)
2. Then: Parent table (gpc_classification)

### Error: Connection timeout

```
Msg 1204: SQL Server cannot acquire a lock on the resource...
```

**Solution:**
1. Check if other sessions are using the tables
2. Check active connections: `EXEC sp_who2`
3. Wait for long-running queries to complete
4. Increase timeout: `SET LOCK_TIMEOUT 60000;` (60 seconds)

## Best Practices

1. **Always test in development first** - Never run migrations directly in production without testing
2. **Backup before migrating** - Create database backup before running migrations in production
3. **Review before executing** - Read the entire migration script before running it
4. **Use transactions** - Wrap migrations in BEGIN TRANSACTION/ROLLBACK/COMMIT for safety
5. **Document changes** - Update this README when adding new migrations
6. **Version control** - Commit migration files to git before executing
7. **Monitor performance** - Check query performance after creating indexes
8. **Verify results** - Run verification queries after each migration

## Environment Variables

Configure database connection via `.env`:

```bash
# Corporativo environment selection
CORPORATIVO_ENVIRONMENT=production  # or 'development'

# Corporativo credentials
# Production: T-SRVSQL2022-01\LOREN / dcloren / #dcloren#
# Development: T-SRVSQLDEV2022-01\LOREN / dcloren / #dclorendev#
```

## References

- **GPC Standard**: [GS1 GPC Browser](https://www.gs1.org/standards/gpc)
- **NCM Tables**: [Receita Federal - NCM](http://www.receita.fazenda.gov.br/)
- **CEST Tables**: [Confaz - CEST](https://www.confaz.fazenda.gov.br/)
- **SQL Server Docs**: [Microsoft SQL Server Documentation](https://docs.microsoft.com/sql/)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review migration script comments
3. Check database logs: `EXEC xp_readerrorlog`
4. Contact database administrator

## Migration History

| Version | Date       | Description              | Status   |
|---------|------------|--------------------------|----------|
| 001     | 2025-10-31 | Create GPC tables        | Pending  |

**Update status after execution:**
- Pending → Applied (prod: YYYY-MM-DD, dev: YYYY-MM-DD)
