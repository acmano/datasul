# Database Optimization Guide

## Índices Recomendados

```sql
-- Items
CREATE INDEX IX_Item_Codigo ON item("it-codigo") INCLUDE ("descricao", "unidade");
CREATE INDEX IX_Item_Familia ON item("cod-refer") INCLUDE ("it-codigo");
CREATE INDEX IX_Item_Ativo ON item("ativo-log") WHERE "ativo-log" = 1;

-- Famílias
CREATE INDEX IX_Familia_Codigo ON familia("cod-refer") INCLUDE ("descricao");
```

## Connection Pooling

```typescript
const pool = {
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## Query Patterns

### ✅ Boas Práticas
- SELECT específico (não *)
- Usar IN ao invés de múltiplos OR
- Limitar resultados (LIMIT/TOP)
- Usar EXISTS ao invés de IN para subqueries

### ❌ Anti-Patterns
- SELECT *
- LIKE '%prefix'
- NOT IN
- Funções em WHERE

## Monitoring

```bash
npm run analyze:queries  # Analisar queries
npm run db:slow-log      # Ver queries lentas
```
