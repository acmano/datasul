-- ============================================================================
-- ROLLBACK: 001_rollback_gpc_tables.sql
-- ============================================================================
-- PURPOSE:
--   Rollback migration 001_create_gpc_tables.sql by dropping all GPC tables.
--   This script safely removes all GPC-related database objects in the
--   correct order (respecting foreign key dependencies).
--
-- SYSTEM: LordtsAPI Backend
-- DATABASE: DATACORP (SQL Server)
-- AUTHOR: Claude Code
-- DATE: 2025-10-31
-- VERSION: 1.0.0
--
-- TABLES DROPPED (in order):
--   1. gtin_gpc_mapping (has FK to gpc_classification)
--   2. ncm_gpc_mapping (has FK to gpc_classification)
--   3. cest_gpc_mapping (has FK to gpc_classification)
--   4. gpc_classification (main table, no dependencies)
--
-- WARNING:
--   - This script permanently deletes all GPC data
--   - All GTIN, NCM, and CEST mappings will be lost
--   - This operation cannot be undone (no recovery except from backups)
--   - Run this ONLY if you need to completely remove GPC structure
--
-- EXECUTION:
--   Run this script on DATACORP database:
--   - Production: T-SRVSQL2022-01\LOREN (DATACORP)
--   - Development: T-SRVSQLDEV2022-01\LOREN (DATACORP)
--
-- FORWARD MIGRATION:
--   To recreate tables, run: 001_create_gpc_tables.sql
-- ============================================================================

USE DATACORP;
GO

PRINT '';
PRINT '============================================================================';
PRINT 'Starting rollback of migration 001_create_gpc_tables.sql';
PRINT '============================================================================';
PRINT 'WARNING: This will permanently delete all GPC data!';
PRINT '';
GO

-- ============================================================================
-- STEP 1: Drop mapping tables (with foreign keys)
-- ============================================================================
-- These tables have foreign keys to gpc_classification, so they must be
-- dropped first to avoid constraint violations.
-- ============================================================================

-- Drop gtin_gpc_mapping table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[gtin_gpc_mapping]') AND type in (N'U'))
BEGIN
    -- Drop indexes first (best practice, though DROP TABLE removes them)
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gtin_brick' AND object_id = OBJECT_ID('gtin_gpc_mapping'))
    BEGIN
        DROP INDEX [idx_gtin_brick] ON [dbo].[gtin_gpc_mapping];
        PRINT '  - Index [idx_gtin_brick] dropped';
    END

    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gtin_confidence' AND object_id = OBJECT_ID('gtin_gpc_mapping'))
    BEGIN
        DROP INDEX [idx_gtin_confidence] ON [dbo].[gtin_gpc_mapping];
        PRINT '  - Index [idx_gtin_confidence] dropped';
    END

    -- Drop the table (includes FK constraint)
    DROP TABLE [dbo].[gtin_gpc_mapping];
    PRINT '  - Table [gtin_gpc_mapping] dropped successfully';
END
ELSE
BEGIN
    PRINT '  - Table [gtin_gpc_mapping] does not exist, skipping';
END
GO

-- Drop ncm_gpc_mapping table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ncm_gpc_mapping]') AND type in (N'U'))
BEGIN
    -- Drop indexes first
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ncm_brick' AND object_id = OBJECT_ID('ncm_gpc_mapping'))
    BEGIN
        DROP INDEX [idx_ncm_brick] ON [dbo].[ncm_gpc_mapping];
        PRINT '  - Index [idx_ncm_brick] dropped';
    END

    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ncm_confidence' AND object_id = OBJECT_ID('ncm_gpc_mapping'))
    BEGIN
        DROP INDEX [idx_ncm_confidence] ON [dbo].[ncm_gpc_mapping];
        PRINT '  - Index [idx_ncm_confidence] dropped';
    END

    -- Drop the table (includes FK constraint)
    DROP TABLE [dbo].[ncm_gpc_mapping];
    PRINT '  - Table [ncm_gpc_mapping] dropped successfully';
END
ELSE
BEGIN
    PRINT '  - Table [ncm_gpc_mapping] does not exist, skipping';
END
GO

-- Drop cest_gpc_mapping table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cest_gpc_mapping]') AND type in (N'U'))
BEGIN
    -- Drop indexes first
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cest_brick' AND object_id = OBJECT_ID('cest_gpc_mapping'))
    BEGIN
        DROP INDEX [idx_cest_brick] ON [dbo].[cest_gpc_mapping];
        PRINT '  - Index [idx_cest_brick] dropped';
    END

    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cest_confidence' AND object_id = OBJECT_ID('cest_gpc_mapping'))
    BEGIN
        DROP INDEX [idx_cest_confidence] ON [dbo].[cest_gpc_mapping];
        PRINT '  - Index [idx_cest_confidence] dropped';
    END

    -- Drop the table (includes FK constraint)
    DROP TABLE [dbo].[cest_gpc_mapping];
    PRINT '  - Table [cest_gpc_mapping] dropped successfully';
END
ELSE
BEGIN
    PRINT '  - Table [cest_gpc_mapping] does not exist, skipping';
END
GO

-- ============================================================================
-- STEP 2: Drop main classification table
-- ============================================================================
-- Now that all foreign key dependencies are removed, we can safely drop
-- the main gpc_classification table.
-- ============================================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[gpc_classification]') AND type in (N'U'))
BEGIN
    -- Drop indexes first
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gpc_segment' AND object_id = OBJECT_ID('gpc_classification'))
    BEGIN
        DROP INDEX [idx_gpc_segment] ON [dbo].[gpc_classification];
        PRINT '  - Index [idx_gpc_segment] dropped';
    END

    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gpc_family' AND object_id = OBJECT_ID('gpc_classification'))
    BEGIN
        DROP INDEX [idx_gpc_family] ON [dbo].[gpc_classification];
        PRINT '  - Index [idx_gpc_family] dropped';
    END

    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gpc_class' AND object_id = OBJECT_ID('gpc_classification'))
    BEGIN
        DROP INDEX [idx_gpc_class] ON [dbo].[gpc_classification];
        PRINT '  - Index [idx_gpc_class] dropped';
    END

    -- Drop the main table
    DROP TABLE [dbo].[gpc_classification];
    PRINT '  - Table [gpc_classification] dropped successfully';
END
ELSE
BEGIN
    PRINT '  - Table [gpc_classification] does not exist, skipping';
END
GO

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'Rollback of migration 001_create_gpc_tables.sql completed successfully!';
PRINT '============================================================================';
PRINT 'Tables dropped:';
PRINT '  1. gtin_gpc_mapping';
PRINT '  2. ncm_gpc_mapping';
PRINT '  3. cest_gpc_mapping';
PRINT '  4. gpc_classification';
PRINT '';
PRINT 'All GPC data has been permanently deleted.';
PRINT '';
PRINT 'Verification:';
PRINT '  Run: SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE ''%gpc%''';
PRINT '  Expected result: 0 rows (all tables removed)';
PRINT '';
PRINT 'To recreate GPC structure:';
PRINT '  Run: 001_create_gpc_tables.sql';
PRINT '============================================================================';
GO
