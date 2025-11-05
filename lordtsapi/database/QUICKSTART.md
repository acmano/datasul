# GPC Database Migration - Quick Start Guide

## TL;DR - Execute in 2 Minutes

### Development Environment

```bash
# Navigate to project
cd /home/mano/projetos/datasul/lordtsapi

# Execute migration via sqlcmd
sqlcmd -S "T-SRVSQLDEV2022-01\LOREN" -d DATACORP -U dcloren -P "#dclorendev#" \
  -i database/migrations/001_create_gpc_tables.sql \
  -o migration_output.log

# Check results
cat migration_output.log
```

### Production Environment (Use with caution!)

```bash
# Backup first!
sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" \
  -Q "BACKUP DATABASE DATACORP TO DISK = 'C:\Backups\DATACORP_before_gpc.bak'"

# Execute migration
sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" \
  -i database/migrations/001_create_gpc_tables.sql \
  -o migration_prod_output.log

# Verify
sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%gpc%'"
```

## Via Node.js (Recommended for Integration)

### Setup (One-time)

Create `database/run-migration.js`:

```javascript
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function runMigration(filename) {
  const isProd = process.env.CORPORATIVO_ENVIRONMENT === 'production';

  const config = {
    server: isProd ? 'T-SRVSQL2022-01\\LOREN' : 'T-SRVSQLDEV2022-01\\LOREN',
    database: 'DATACORP',
    user: 'dcloren',
    password: isProd ? '#dcloren#' : '#dclorendev#',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  try {
    console.log(`Connecting to ${config.server}...`);
    await sql.connect(config);

    const migrationPath = path.join(__dirname, 'migrations', filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${filename}...`);
    await sql.query(migrationSQL);
    console.log('✓ Migration completed successfully');

    await sql.close();
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
}

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node run-migration.js <migration_file.sql>');
  process.exit(1);
}

runMigration(filename);
```

### Execute

```bash
# Development
CORPORATIVO_ENVIRONMENT=development node database/run-migration.js 001_create_gpc_tables.sql

# Production
CORPORATIVO_ENVIRONMENT=production node database/run-migration.js 001_create_gpc_tables.sql
```

### Add to package.json

```json
{
  "scripts": {
    "migrate:gpc": "node database/run-migration.js 001_create_gpc_tables.sql",
    "migrate:gpc:rollback": "node database/run-migration.js 001_rollback_gpc_tables.sql"
  }
}
```

Then run:
```bash
npm run migrate:gpc
```

## Verify Installation

```sql
-- Check if all 4 tables exist
SELECT TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%gpc%'
ORDER BY TABLE_NAME;
-- Expected: 4 rows

-- Check indexes
SELECT
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) LIKE '%gpc%'
ORDER BY TableName, i.name;
-- Expected: 11 indexes

-- Check foreign keys
SELECT
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) LIKE '%gpc%';
-- Expected: 3 foreign keys
```

## Insert Sample Data

```sql
-- 1. Insert GPC classification (must be first)
INSERT INTO gpc_classification (
    brick_code, brick_name_pt, brick_name_en,
    class_code, class_name_pt, class_name_en,
    family_code, family_name_pt, family_name_en,
    segment_code, segment_name_pt, segment_name_en
) VALUES
    ('50101001', 'Mussarela Fresca', 'Fresh Mozzarella',
     '501010', 'Queijo', 'Cheese',
     '5010', 'Laticínios', 'Dairy Products',
     '50', 'Alimentos/Bebidas/Tabaco', 'Food/Beverage/Tobacco'),

    ('50131501', 'Margarina', 'Margarine',
     '501315', 'Óleos e Gorduras', 'Oils and Fats',
     '5013', 'Óleos/Gorduras Comestíveis', 'Edible Oils/Fats',
     '50', 'Alimentos/Bebidas/Tabaco', 'Food/Beverage/Tobacco');

-- 2. Insert GTIN mapping
INSERT INTO gtin_gpc_mapping (gtin, brick_code, confidence_level, source)
VALUES
    ('7896524201051', '50131501', 'verified', 'GS1_Brazil'),
    ('7891234567890', '50101001', 'manual', 'Manual_Import_2024');

-- 3. Insert NCM mapping
INSERT INTO ncm_gpc_mapping (ncm, brick_code, confidence_level, source)
VALUES
    ('04061010', '50101001', 'verified', 'Receita_Federal_2024'),
    ('15171000', '50131501', 'verified', 'Receita_Federal_2024');

-- 4. Insert CEST mapping
INSERT INTO cest_gpc_mapping (cest, brick_code, confidence_level, source)
VALUES
    ('1701100', '50131501', 'manual', 'Confaz_Conv_92_2015');

-- Verify inserted data
SELECT
    g.brick_code,
    g.brick_name_pt,
    gtm.gtin,
    ncm.ncm,
    c.cest
FROM gpc_classification g
LEFT JOIN gtin_gpc_mapping gtm ON g.brick_code = gtm.brick_code
LEFT JOIN ncm_gpc_mapping ncm ON g.brick_code = ncm.brick_code
LEFT JOIN cest_gpc_mapping c ON g.brick_code = c.brick_code;
```

## Rollback (If Needed)

```bash
# Development
sqlcmd -S "T-SRVSQLDEV2022-01\LOREN" -d DATACORP -U dcloren -P "#dclorendev#" \
  -i database/migrations/001_rollback_gpc_tables.sql

# Production (DANGER: Deletes all data!)
sqlcmd -S "T-SRVSQL2022-01\LOREN" -d DATACORP -U dcloren -P "#dcloren#" \
  -i database/migrations/001_rollback_gpc_tables.sql
```

## Next Steps

1. **Import GPC Data**: Load complete GPC hierarchy from GS1
2. **Import Mappings**: Bulk import GTIN, NCM, and CEST mappings
3. **Create API Endpoints**: Build REST API for GPC queries
4. **Add Indexes**: Add full-text search if needed
5. **Setup Sync**: Automate GPC updates from GS1

## Files Reference

```
lordtsapi/database/
├── QUICKSTART.md                   ← You are here
├── migrations/
│   ├── README.md                   ← Detailed documentation
│   ├── GPC_STRUCTURE.txt           ← Visual diagram
│   ├── 001_create_gpc_tables.sql   ← Forward migration
│   └── 001_rollback_gpc_tables.sql ← Rollback script
└── run-migration.js                ← Node.js runner (create this)
```

## Troubleshooting

**Error: Login failed for user 'dcloren'**
- Check password in quotes: `'#dcloren#'` or `"#dcloren#"`
- Verify user has access to DATACORP database

**Error: Table already exists**
- Migration has IF NOT EXISTS checks
- If needed, run rollback first then re-run migration

**Error: Cannot connect to server**
- Check server name: `T-SRVSQL2022-01\LOREN` (production)
- Verify network access to SQL Server
- Check if SQL Server service is running

**Error: Permission denied**
- User needs CREATE TABLE permissions on DATACORP
- Contact DBA to grant permissions

## Support

For detailed documentation, see: `database/migrations/README.md`

For visual structure, see: `database/migrations/GPC_STRUCTURE.txt`

---

**Total Migration Time:** ~2 minutes
**Tables Created:** 4
**Indexes Created:** 11
**Foreign Keys:** 3
**Ready for:** 50,000+ GPC classifications
