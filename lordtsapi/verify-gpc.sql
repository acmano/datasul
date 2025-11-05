-- Verificar dados importados no DATACORP
USE DATACORP;
GO

-- 1. Total de registros
SELECT COUNT(*) as total_records FROM gpc_classification;

-- 2. Registros por segmento
SELECT 
    segment_code,
    segment_name_en,
    COUNT(*) as total_bricks
FROM gpc_classification
GROUP BY segment_code, segment_name_en
ORDER BY segment_code;

-- 3. Exemplo de dados
SELECT TOP 10 
    brick_code,
    brick_name_en,
    class_name_en,
    family_name_en,
    segment_name_en
FROM gpc_classification
ORDER BY brick_code;
