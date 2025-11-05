-- ============================================================================
-- MIGRATION: 001_create_gpc_tables.sql
-- ============================================================================
-- PURPOSE:
--   Create complete GPC (Global Product Classification) database structure
--   for the LordtsAPI backend system. This migration establishes the
--   foundation for storing GPC hierarchies and mappings to GTIN, NCM, and CEST.
--
-- SYSTEM: LordtsAPI Backend
-- DATABASE: DATACORP (SQL Server)
-- AUTHOR: Claude Code
-- DATE: 2025-10-31
-- VERSION: 1.0.0
--
-- TABLES CREATED:
--   1. gpc_classification - GPC hierarchy (Segment > Family > Class > Brick)
--   2. gtin_gpc_mapping - GTIN (barcode) to GPC mappings
--   3. ncm_gpc_mapping - NCM (Brazilian tax classification) to GPC mappings
--   4. cest_gpc_mapping - CEST (Brazilian tax code) to GPC mappings
--
-- NOTES:
--   - All text fields use NVARCHAR for Unicode support (PT-BR and EN)
--   - Timestamps use DATETIME2 for precision and SQL Server compatibility
--   - Foreign keys ensure referential integrity
--   - Indexes optimize query performance on search fields
--   - This is a READ-HEAVY system (queries > inserts/updates)
--
-- EXECUTION:
--   Run this script on DATACORP database in either:
--   - Production: T-SRVSQL2022-01\LOREN (DATACORP)
--   - Development: T-SRVSQLDEV2022-01\LOREN (DATACORP)
--
-- ROLLBACK:
--   See 001_rollback_gpc_tables.sql
-- ============================================================================

USE DATACORP;
GO

-- ============================================================================
-- TABLE 1: gpc_classification
-- ============================================================================
-- DESCRIPTION:
--   Stores the complete GPC (Global Product Classification) hierarchy.
--   GPC is a global standard for product classification with 4 levels:
--   - Segment (2 digits): Top level category (e.g., "50" = Food/Beverage/Tobacco)
--   - Family (4 digits): Product group (e.g., "5010" = Dairy Products)
--   - Class (6 digits): Product type (e.g., "501010" = Cheese)
--   - Brick (8 digits): Specific product (e.g., "50101001" = Fresh Mozzarella)
--
-- PRIMARY KEY: brick_code (8 characters)
--
-- COLUMNS:
--   - brick_code: 8-digit GPC brick code (PRIMARY KEY)
--   - brick_name_pt: Brick name in Portuguese
--   - brick_name_en: Brick name in English
--   - class_code: 6-digit GPC class code
--   - class_name_pt: Class name in Portuguese
--   - class_name_en: Class name in English
--   - family_code: 4-digit GPC family code
--   - family_name_pt: Family name in Portuguese
--   - family_name_en: Family name in English
--   - segment_code: 2-digit GPC segment code
--   - segment_name_pt: Segment name in Portuguese
--   - segment_name_en: Segment name in English
--   - created_at: Record creation timestamp
--   - updated_at: Last update timestamp
--
-- EXAMPLE DATA:
--   brick_code: '50101001'
--   brick_name_pt: 'Mussarela Fresca'
--   brick_name_en: 'Fresh Mozzarella'
--   class_code: '501010'
--   class_name_pt: 'Queijo'
--   class_name_en: 'Cheese'
--   family_code: '5010'
--   family_name_pt: 'Laticínios'
--   family_name_en: 'Dairy Products'
--   segment_code: '50'
--   segment_name_pt: 'Alimentos/Bebidas/Tabaco'
--   segment_name_en: 'Food/Beverage/Tobacco'
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[gpc_classification]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[gpc_classification] (
        -- Brick Level (8 digits - most specific)
        [brick_code] VARCHAR(8) NOT NULL,
        [brick_name_pt] NVARCHAR(500) NOT NULL,
        [brick_name_en] NVARCHAR(500) NOT NULL,

        -- Class Level (6 digits)
        [class_code] VARCHAR(6) NOT NULL,
        [class_name_pt] NVARCHAR(500) NOT NULL,
        [class_name_en] NVARCHAR(500) NOT NULL,

        -- Family Level (4 digits)
        [family_code] VARCHAR(4) NOT NULL,
        [family_name_pt] NVARCHAR(500) NOT NULL,
        [family_name_en] NVARCHAR(500) NOT NULL,

        -- Segment Level (2 digits - top level)
        [segment_code] VARCHAR(2) NOT NULL,
        [segment_name_pt] NVARCHAR(500) NOT NULL,
        [segment_name_en] NVARCHAR(500) NOT NULL,

        -- Metadata
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),

        -- Primary Key
        CONSTRAINT [PK_gpc_classification] PRIMARY KEY CLUSTERED ([brick_code] ASC)
    );

    PRINT 'Table [gpc_classification] created successfully';
END
ELSE
BEGIN
    PRINT 'Table [gpc_classification] already exists, skipping creation';
END
GO

-- ============================================================================
-- INDEXES: gpc_classification
-- ============================================================================
-- These indexes optimize common query patterns:
--   - Search by segment (top-down hierarchy navigation)
--   - Search by family (category browsing)
--   - Search by class (product type filtering)
--   - Text search on names (Portuguese and English)
-- ============================================================================

-- Index for segment-level queries (top of hierarchy)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gpc_segment' AND object_id = OBJECT_ID('gpc_classification'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_gpc_segment]
    ON [dbo].[gpc_classification]([segment_code] ASC)
    INCLUDE ([segment_name_pt], [segment_name_en]);

    PRINT 'Index [idx_gpc_segment] created successfully';
END
GO

-- Index for family-level queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gpc_family' AND object_id = OBJECT_ID('gpc_classification'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_gpc_family]
    ON [dbo].[gpc_classification]([family_code] ASC)
    INCLUDE ([family_name_pt], [family_name_en]);

    PRINT 'Index [idx_gpc_family] created successfully';
END
GO

-- Index for class-level queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gpc_class' AND object_id = OBJECT_ID('gpc_classification'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_gpc_class]
    ON [dbo].[gpc_classification]([class_code] ASC)
    INCLUDE ([class_name_pt], [class_name_en]);

    PRINT 'Index [idx_gpc_class] created successfully';
END
GO

-- ============================================================================
-- TABLE 2: gtin_gpc_mapping
-- ============================================================================
-- DESCRIPTION:
--   Maps GTIN (Global Trade Item Number) codes to GPC brick codes.
--   GTIN is the global barcode standard (includes EAN-13, UPC-A, etc.).
--
--   This table enables product classification lookup via barcode scanning.
--   Essential for retail, inventory, and e-commerce systems.
--
-- PRIMARY KEY: gtin (VARCHAR(14))
-- FOREIGN KEY: brick_code -> gpc_classification(brick_code)
--
-- COLUMNS:
--   - gtin: Global Trade Item Number (13 or 14 digits)
--   - brick_code: GPC brick code reference (8 digits)
--   - confidence_level: Mapping confidence ('manual', 'auto', 'verified')
--   - source: Origin of the mapping (e.g., 'GS1', 'manual_import', 'ml_model')
--   - created_at: Record creation timestamp
--   - updated_at: Last update timestamp
--
-- CONFIDENCE LEVELS:
--   - 'manual': Manually mapped by data operator
--   - 'auto': Automatically mapped by ML model or rules engine
--   - 'verified': Auto-mapped and verified by human operator
--
-- EXAMPLE DATA:
--   gtin: '7896524201051'  (Qualy Margarina 500g)
--   brick_code: '50131501'  (Margarine/Spreads)
--   confidence_level: 'verified'
--   source: 'GS1_Brazil'
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[gtin_gpc_mapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[gtin_gpc_mapping] (
        [gtin] VARCHAR(14) NOT NULL,  -- Supports both GTIN-13 and GTIN-14
        [brick_code] VARCHAR(8) NOT NULL,
        [confidence_level] VARCHAR(20) NOT NULL DEFAULT 'manual',
        [source] VARCHAR(100) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),

        -- Primary Key
        CONSTRAINT [PK_gtin_gpc_mapping] PRIMARY KEY CLUSTERED ([gtin] ASC),

        -- Foreign Key to gpc_classification
        CONSTRAINT [FK_gtin_brick] FOREIGN KEY ([brick_code])
            REFERENCES [dbo].[gpc_classification]([brick_code])
            ON DELETE CASCADE
            ON UPDATE CASCADE,

        -- Constraint: confidence_level must be valid
        CONSTRAINT [CK_gtin_confidence] CHECK ([confidence_level] IN ('manual', 'auto', 'verified'))
    );

    PRINT 'Table [gtin_gpc_mapping] created successfully';
END
ELSE
BEGIN
    PRINT 'Table [gtin_gpc_mapping] already exists, skipping creation';
END
GO

-- ============================================================================
-- INDEXES: gtin_gpc_mapping
-- ============================================================================
-- These indexes optimize:
--   - Reverse lookup (find all GTINs for a brick code)
--   - Filtering by confidence level (data quality queries)
--   - Source tracking (audit queries)
-- ============================================================================

-- Index for reverse lookup (brick_code -> GTINs)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gtin_brick' AND object_id = OBJECT_ID('gtin_gpc_mapping'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_gtin_brick]
    ON [dbo].[gtin_gpc_mapping]([brick_code] ASC)
    INCLUDE ([confidence_level], [source]);

    PRINT 'Index [idx_gtin_brick] created successfully';
END
GO

-- Index for confidence level filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gtin_confidence' AND object_id = OBJECT_ID('gtin_gpc_mapping'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_gtin_confidence]
    ON [dbo].[gtin_gpc_mapping]([confidence_level] ASC)
    INCLUDE ([gtin], [brick_code]);

    PRINT 'Index [idx_gtin_confidence] created successfully';
END
GO

-- ============================================================================
-- TABLE 3: ncm_gpc_mapping
-- ============================================================================
-- DESCRIPTION:
--   Maps NCM (Nomenclatura Comum do Mercosul) codes to GPC brick codes.
--   NCM is the Brazilian/Mercosul tax classification system (8 digits).
--
--   This table enables:
--   - Tax calculation based on product classification
--   - Customs/import documentation
--   - Fiscal reporting compliance
--   - Cross-reference between Brazilian and global standards
--
-- PRIMARY KEY: ncm (VARCHAR(8))
-- FOREIGN KEY: brick_code -> gpc_classification(brick_code)
--
-- COLUMNS:
--   - ncm: NCM code (8 digits, e.g., '04061010' for Fresh Mozzarella)
--   - brick_code: GPC brick code reference (8 digits)
--   - confidence_level: Mapping confidence ('manual', 'auto', 'verified')
--   - source: Origin of the mapping (e.g., 'Receita_Federal', 'manual_mapping')
--   - created_at: Record creation timestamp
--   - updated_at: Last update timestamp
--
-- EXAMPLE DATA:
--   ncm: '04061010'  (Queijo mussarela fresco)
--   brick_code: '50101001'  (Fresh Mozzarella)
--   confidence_level: 'verified'
--   source: 'Receita_Federal_2024'
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ncm_gpc_mapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ncm_gpc_mapping] (
        [ncm] VARCHAR(8) NOT NULL,  -- NCM has 8 digits
        [brick_code] VARCHAR(8) NOT NULL,
        [confidence_level] VARCHAR(20) NOT NULL DEFAULT 'manual',
        [source] VARCHAR(100) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),

        -- Primary Key
        CONSTRAINT [PK_ncm_gpc_mapping] PRIMARY KEY CLUSTERED ([ncm] ASC),

        -- Foreign Key to gpc_classification
        CONSTRAINT [FK_ncm_brick] FOREIGN KEY ([brick_code])
            REFERENCES [dbo].[gpc_classification]([brick_code])
            ON DELETE CASCADE
            ON UPDATE CASCADE,

        -- Constraint: confidence_level must be valid
        CONSTRAINT [CK_ncm_confidence] CHECK ([confidence_level] IN ('manual', 'auto', 'verified'))
    );

    PRINT 'Table [ncm_gpc_mapping] created successfully';
END
ELSE
BEGIN
    PRINT 'Table [ncm_gpc_mapping] already exists, skipping creation';
END
GO

-- ============================================================================
-- INDEXES: ncm_gpc_mapping
-- ============================================================================
-- These indexes optimize:
--   - Reverse lookup (find all NCMs for a brick code)
--   - Filtering by confidence level
--   - Source tracking for audit
-- ============================================================================

-- Index for reverse lookup (brick_code -> NCMs)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ncm_brick' AND object_id = OBJECT_ID('ncm_gpc_mapping'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_ncm_brick]
    ON [dbo].[ncm_gpc_mapping]([brick_code] ASC)
    INCLUDE ([confidence_level], [source]);

    PRINT 'Index [idx_ncm_brick] created successfully';
END
GO

-- Index for confidence level filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ncm_confidence' AND object_id = OBJECT_ID('ncm_gpc_mapping'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_ncm_confidence]
    ON [dbo].[ncm_gpc_mapping]([confidence_level] ASC)
    INCLUDE ([ncm], [brick_code]);

    PRINT 'Index [idx_ncm_confidence] created successfully';
END
GO

-- ============================================================================
-- TABLE 4: cest_gpc_mapping
-- ============================================================================
-- DESCRIPTION:
--   Maps CEST (Código Especificador da Substituição Tributária) codes to GPC.
--   CEST is a Brazilian tax code for items subject to tax substitution (7 digits).
--
--   This table enables:
--   - ICMS-ST (tax substitution) calculation
--   - Fiscal compliance for interstate commerce
--   - Tax reporting for specific product categories
--   - Integration with Brazilian ERP/fiscal systems
--
-- PRIMARY KEY: cest (VARCHAR(7))
-- FOREIGN KEY: brick_code -> gpc_classification(brick_code)
--
-- COLUMNS:
--   - cest: CEST code (7 digits, e.g., '1701100' for Margarine)
--   - brick_code: GPC brick code reference (8 digits)
--   - confidence_level: Mapping confidence ('manual', 'auto', 'verified')
--   - source: Origin of the mapping (e.g., 'Confaz_2024', 'manual_mapping')
--   - created_at: Record creation timestamp
--   - updated_at: Last update timestamp
--
-- EXAMPLE DATA:
--   cest: '1701100'  (Margarinas e cremes vegetais)
--   brick_code: '50131501'  (Margarine/Spreads)
--   confidence_level: 'verified'
--   source: 'Confaz_Conv_92_2015'
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cest_gpc_mapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[cest_gpc_mapping] (
        [cest] VARCHAR(7) NOT NULL,  -- CEST has 7 digits
        [brick_code] VARCHAR(8) NOT NULL,
        [confidence_level] VARCHAR(20) NOT NULL DEFAULT 'manual',
        [source] VARCHAR(100) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),

        -- Primary Key
        CONSTRAINT [PK_cest_gpc_mapping] PRIMARY KEY CLUSTERED ([cest] ASC),

        -- Foreign Key to gpc_classification
        CONSTRAINT [FK_cest_brick] FOREIGN KEY ([brick_code])
            REFERENCES [dbo].[gpc_classification]([brick_code])
            ON DELETE CASCADE
            ON UPDATE CASCADE,

        -- Constraint: confidence_level must be valid
        CONSTRAINT [CK_cest_confidence] CHECK ([confidence_level] IN ('manual', 'auto', 'verified'))
    );

    PRINT 'Table [cest_gpc_mapping] created successfully';
END
ELSE
BEGIN
    PRINT 'Table [cest_gpc_mapping] already exists, skipping creation';
END
GO

-- ============================================================================
-- INDEXES: cest_gpc_mapping
-- ============================================================================
-- These indexes optimize:
--   - Reverse lookup (find all CESTs for a brick code)
--   - Filtering by confidence level
--   - Source tracking for compliance audit
-- ============================================================================

-- Index for reverse lookup (brick_code -> CESTs)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cest_brick' AND object_id = OBJECT_ID('cest_gpc_mapping'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_cest_brick]
    ON [dbo].[cest_gpc_mapping]([brick_code] ASC)
    INCLUDE ([confidence_level], [source]);

    PRINT 'Index [idx_cest_brick] created successfully';
END
GO

-- Index for confidence level filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cest_confidence' AND object_id = OBJECT_ID('cest_gpc_mapping'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_cest_confidence]
    ON [dbo].[cest_gpc_mapping]([confidence_level] ASC)
    INCLUDE ([cest], [brick_code]);

    PRINT 'Index [idx_cest_confidence] created successfully';
END
GO

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'Migration 001_create_gpc_tables.sql completed successfully!';
PRINT '============================================================================';
PRINT 'Tables created:';
PRINT '  1. gpc_classification - GPC hierarchy (4 levels)';
PRINT '  2. gtin_gpc_mapping - GTIN to GPC mappings';
PRINT '  3. ncm_gpc_mapping - NCM to GPC mappings';
PRINT '  4. cest_gpc_mapping - CEST to GPC mappings';
PRINT '';
PRINT 'Indexes created: 11 total';
PRINT '  - gpc_classification: 3 indexes (segment, family, class)';
PRINT '  - gtin_gpc_mapping: 2 indexes (brick, confidence)';
PRINT '  - ncm_gpc_mapping: 2 indexes (brick, confidence)';
PRINT '  - cest_gpc_mapping: 2 indexes (brick, confidence)';
PRINT '';
PRINT 'Foreign keys: 3 total';
PRINT '  - gtin_gpc_mapping.brick_code -> gpc_classification.brick_code';
PRINT '  - ncm_gpc_mapping.brick_code -> gpc_classification.brick_code';
PRINT '  - cest_gpc_mapping.brick_code -> gpc_classification.brick_code';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Verify table structure: SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE ''%gpc%''';
PRINT '  2. Check indexes: EXEC sp_helpindex ''gpc_classification''';
PRINT '  3. Import GPC data into gpc_classification table';
PRINT '  4. Import mapping data into gtin/ncm/cest tables';
PRINT '============================================================================';
GO
