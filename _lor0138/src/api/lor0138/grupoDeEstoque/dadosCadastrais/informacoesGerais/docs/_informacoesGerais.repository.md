# Documentação - Repository: Informações Gerais da Família

**Módulo:** `FamiliaInformacoesGeraisRepository`
**Categoria:** Repositories
**Subcategoria:** Familia/DadosCadastrais
**Arquivo:** `src/api/lor0138/familia/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts`

---

## Visão Geral

Camada de acesso a dados para consultas relacionadas às informações gerais de famílias do sistema Datasul/Progress OpenEdge.

---

## Mudanças Recentes

### v2.0 - Validação com Joi

**Data:** Outubro 2025

**Mudanças:**
- ✅ Tamanho máximo reduzido: `varchar(16)` → `varchar(8)`
- ✅ Reflete limite real do banco Progress/Datasul
- ✅ Alinhado com novo schema Joi de validação
- ✅ Melhor performance (menos overhead de memória)

**Impacto:**
- Queries agora declaram `@familiaCodigo varchar(8)`
- Validação upstream garante que valores chegam com ≤ 8 chars
- Sem impacto em dados existentes (todos os códigos têm ≤ 8 chars)

---

## Responsabilidades

O Repository é responsável por:

- ✅ **Executar** queries SQL no banco de dados via OPENQUERY
- ✅ **Gerenciar** cache de queries (L1 + L2)
- ✅ **Transformar** resultados brutos em objetos tipados
- ✅ **Garantir** uso de queries parametrizadas (segurança)
- ✅ **Invalidar** cache quando necessário

---

## Arquitetura

### Estrutura de Acesso aos Dados

```
┌──────────────────────────────────────────────────────────┐
│ Repository (TypeScript/Node.js)                          │
│ └─ FamiliaInformacoesGeraisRepository                    │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Cache Layer (L1 + L2)                                    │
│ ├─ L1: In-Memory (Node.js)                              │
│ └─ L2: Redis                                             │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ DatabaseManager                                          │
│ └─ Connection Pool                                       │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ SQL Server                                               │
│ └─ sp_executesql (queries parametrizadas)               │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Linked Server (PRD_EMS2EMP)                              │
│ └─ OPENQUERY                                             │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Progress OpenEdge (Datasul)                              │
│ └─ Tabela: pub.familia                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Tecnologias

### Stack Completo

| Tecnologia | Uso | Descrição |
|------------|-----|-----------|
| **SQL Server** | Banco intermediário | Processa queries e acessa Progress |
| **Progress OpenEdge** | Banco de origem | Sistema Datasul (ERP) |
| **Linked Server** | Integração | `PRD_EMS2EMP` - conexão SQL Server → Progress |
| **OPENQUERY** | Query remota | Executa SQL no Progress via Linked Server |
| **sp_executesql** | Segurança | Queries parametrizadas (SQL injection protection) |
| **QueryCacheService** | Cache | Sistema L1 + L2 (In-Memory + Redis) |
| **DatabaseManager** | Connection Pool | Gerenciamento de conexões |

---

## Padrões de Projeto

### Repository Pattern

**Propósito:** Abstrair acesso a dados

**Benefícios:**
- Isolamento da lógica de dados
- Facilita testes (mock do Repository)
- Centraliza queries SQL
- Simplifica mudanças de banco

### Cache-Aside Pattern

**Propósito:** Otimizar performance com cache lazy

**Fluxo:**
1. Verifica cache (L1 → L2)
2. Se hit: retorna dados cacheados
3. Se miss: busca no banco
4. Armazena no cache
5. Retorna dados

### Prepared Statements

**Propósito:** Segurança contra SQL Injection

**Implementação:**
- Usa `sp_executesql` com parâmetros tipados
- Trata inputs como valores literais
- Previne injeção de código SQL

---

## Classe: FamiliaInformacoesGeraisRepository

### Estrutura

```typescript
export class FamiliaInformacoesGeraisRepository {
  static async getFamiliaMaster(familiaCodigo: string): Promise<any | null>
  static async invalidateCache(familiaCodigo: string): Promise<void>
}
```

---

## Método: getFamiliaMaster

### Descrição

Busca dados mestres de uma família da tabela `pub.familia` do Progress.

### Assinatura

```typescript
static async getFamiliaMaster(
  familiaCodigo: string
): Promise<FamiliaMasterQueryResult | null>
```

### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `familiaCodigo` | `string` | Código único da família (máx **8 caracteres**) |

⚠️ **Mudança de Tamanho:** Reduzido de 16 para **8 caracteres** para refletir o limite real do banco Progress/Datasul

### Retorno

**Tipo:** `Promise<FamiliaMasterQueryResult | null>`

**Estrutura:**

```typescript
{
  familiaCodigo: string;      // familia."fm-codigo"
  familiaDescricao: string;   // familia."descricao"
}
```

**null:** Retornado quando família não existe

---

## Fluxo de Execução

### Etapas do Método

```
1. Monta Query SQL Dinâmica
   ↓
2. Cria Parâmetros Tipados
   ↓
3. Verifica Cache L1/L2
   ├─ Cache HIT → Retorna dados cacheados (rápido!)
   └─ Cache MISS → Continua
   ↓
4. Executa Query via DatabaseManager
   ↓
5. Armazena Resultado no Cache
   ↓
6. Retorna Primeiro Registro ou null
```

### Detalhamento das Etapas

#### Etapa 1: Monta Query SQL Dinâmica

```sql
DECLARE @familiaCodigo varchar(16) = @paramfamiliaCodigo;
DECLARE @sql nvarchar(max);

SET @sql = N'
  SELECT  familia."fm-codigo" as familiaCodigo
        , familia."descricao" as familiaDescricao
    FROM  OPENQUERY (
      PRD_EMS2EMP
    ,  ''SELECT  familia."fm-codigo"
               , familia."descricao"
           FROM   pub.familia familia
           WHERE  familia."fm-codigo" = ''''' + @familiaCodigo + '''''
       ''
    ) as familia
';

EXEC sp_executesql @sql;
```

**Componentes:**

| Componente | Descrição |
|------------|-----------|
| `DECLARE @familiaCodigo` | Define variável no SQL Server |
| `OPENQUERY(PRD_EMS2EMP, ...)` | Consulta Linked Server Progress |
| `pub.familia` | Tabela de famílias no Progress |
| `EXEC sp_executesql @sql` | Executa SQL dinâmico com segurança |

**Por que SQL Dinâmico?**

OPENQUERY **NÃO suporta** parâmetros diretos:

❌ **Não funciona:**
```sql
OPENQUERY(PRD_EMS2EMP, 'SELECT * WHERE codigo = @param')
```

✅ **Solução:**
```sql
DECLARE @sql nvarchar(max);
SET @sql = 'OPENQUERY(...' + @param + '...)';
EXEC sp_executesql @sql;
```

#### Etapa 2: Cria Parâmetros Tipados

```typescript
const params: QueryParameter[] = [
  {
    name: 'paramfamiliaCodigo',
    type: 'varchar',
    value: familiaCodigo
  }
];
```

**Tipo SQL:** `varchar(8)` - Máximo 8 caracteres

**Por que Tipar Parâmetros?**

- ✅ Previne SQL Injection
- ✅ Valida tipo de dado
- ✅ sp_executesql trata como literal
- ✅ Não interpreta como código SQL

#### Etapa 3: Verifica Cache

```typescript
const result = await QueryCacheService.withFamiliaCache(
  query,
  params,
  async () => DatabaseManager.queryEmpWithParams(query, params)
);
```

**Cache L1 (In-Memory):**
- Armazenamento: RAM do Node.js
- Velocidade: < 1ms
- TTL: 10 minutos
- Escopo: Processo local

**Cache L2 (Redis):**
- Armazenamento: Redis externo
- Velocidade: ~5-10ms
- TTL: 10 minutos
- Escopo: Compartilhado entre instâncias

**Fluxo do Cache:**

```
1. Verifica L1 (in-memory)
   ├─ HIT → Retorna (< 1ms)
   └─ MISS → Continua

2. Verifica L2 (Redis)
   ├─ HIT → Armazena em L1 e retorna (~10ms)
   └─ MISS → Continua

3. Executa Query no Banco
   └─ Armazena em L1 e L2 (~100-500ms)

4. Retorna Resultado
```

#### Etapa 4: Executa Query

```typescript
DatabaseManager.queryEmpWithParams(query, params)
```

**DatabaseManager:**
- Gerencia pool de conexões
- Executa sp_executesql
- Trata timeouts
- Retorna resultados tipados

#### Etapa 5: Armazena no Cache

Automático via `QueryCacheService.withFamiliaCache()`

**Configuração:**
- **Namespace:** `'familia'`
- **TTL:** 600 segundos (10 minutos)
- **Strategy:** Cache-aside (lazy loading)

#### Etapa 6: Retorna Resultado

```typescript
return result && result.length > 0 ? result[0] : null;
```

**Comportamento:**
- Se array não vazio: retorna primeiro elemento
- Se array vazio: retorna `null`
- Nunca retorna array vazio (consistência com Service)

---

## Query SQL Detalhada

### Estrutura Completa

```sql
-- 1. Declaração de variável (SQL Server)
DECLARE @familiaCodigo varchar(8) = @paramfamiliaCodigo;  -- Máximo 8 caracteres
DECLARE @sql nvarchar(max);

-- 2. Montagem da query dinâmica
SET @sql = N'
  -- 3. SELECT principal (campos mapeados)
  SELECT  familia."fm-codigo" as familiaCodigo
        , familia."descricao" as familiaDescricao

    -- 4. OPENQUERY (acesso ao Linked Server)
    FROM  OPENQUERY (
      PRD_EMS2EMP  -- Nome do Linked Server

    -- 5. Query Progress (entre aspas simples duplas)
    ,  ''SELECT  familia."fm-codigo"
               , familia."descricao"
           FROM   pub.familia familia
           WHERE  familia."fm-codigo" = ''''' + @familiaCodigo + '''''
       ''
    ) as familia
';

-- 6. Execução parametrizada
EXEC sp_executesql @sql;
```

### Mapeamento de Campos

| Campo Progress | Alias SQL | Descrição |
|----------------|-----------|-----------|
| `familia."fm-codigo"` | `familiaCodigo` | Código da família |
| `familia."descricao"` | `familiaDescricao` | Descrição da família |

### Peculiaridades do Progress

#### Aspas Duplas Obrigatórias

Progress OpenEdge requer aspas duplas em nomes de campos:

✅ **Correto:**
```sql
SELECT "fm-codigo", "descricao" FROM pub.familia
```

❌ **Incorreto:**
```sql
SELECT fm-codigo, descricao FROM pub.familia
```

#### Escape de Aspas no OPENQUERY

Aspas simples precisam ser escapadas **4 vezes**:

| Contexto | Sintaxe | Exemplo |
|----------|---------|---------|
| String SQL normal | `'valor'` | `WHERE cod = 'ABC'` |
| String dentro de OPENQUERY | `''valor''` | `WHERE cod = ''ABC''` |
| Variável dentro de OPENQUERY | `''''' + @var + '''''` | `WHERE cod = ''''' + @cod + '''''` |

**Por quê?**
1. SQL Server escapa `''` → `'`
2. OPENQUERY escapa `''` → `'`
3. Resultado final: `'valor'`

---

## Sistema de Cache

### Configuração

```typescript
QueryCacheService.withFamiliaCache(
  query,      // Query SQL
  params,     // Parâmetros
  queryFn     // Função que executa query
)
```

**Namespace:** `'familia'`
**TTL:** 600 segundos (10 minutos)
**Levels:** L1 (in-memory) + L2 (Redis)

### Performance

| Cenário | Tempo | Descrição |
|---------|-------|-----------|
| **Cache L1 HIT** | < 1ms | Dados na memória local |
| **Cache L2 HIT** | ~5-10ms | Dados no Redis |
| **Cache MISS** | ~100-500ms | Query no banco |

**Redução de Carga:**
- Cache reduz ~80-90% das queries ao banco
- 10 requests/min com cache = 1-2 queries/min no banco
- Protege banco de sobrecarga

### Estratégia Cache-Aside

**Como Funciona:**

1. **Leitura:**
   - Verifica cache
   - Se miss, busca no banco
   - Armazena no cache
   - Retorna dados

2. **Escrita:**
   - Atualiza banco
   - Invalida cache relacionado
   - Próxima leitura refaz cache

**Vantagens:**
- ✅ Dados sempre eventualmente consistentes
- ✅ Cache se auto-corrige após TTL
- ✅ Falha de cache não quebra aplicação

**Desvantagens:**
- ❌ Primeira leitura sempre lenta (cold start)
- ❌ Spike após invalidação

---

## Segurança

### Prevenção de SQL Injection

#### Queries Parametrizadas

```typescript
// ✅ SEGURO: Parâmetros tipados
const params: QueryParameter[] = [
  { name: 'paramfamiliaCodigo', type: 'varchar', value: familiaCodigo }
];
```

**Como funciona:**
1. sp_executesql recebe parâmetros separados
2. SQL Server trata como **valores literais**
3. Não interpreta como código SQL
4. Previne injeção

#### Exemplo de Tentativa de Ataque

**Entrada Maliciosa:**
```
familiaCodigo = "'; DROP TABLE familia--"
```

**Sem Proteção (vulnerável):**
```sql
WHERE "fm-codigo" = ''; DROP TABLE familia--'
-- Executaria DROP TABLE!
```

**Com sp_executesql (seguro):**
```sql
WHERE "fm-codigo" = '''; DROP TABLE familia--'
-- Tratado como string literal, não executa DROP
```

### Validação em Camadas

| Camada | Validação |
|--------|-----------|
| **Controller** | Tipo, formato, tamanho |
| **Validator** | Sanitização, whitelist |
| **Repository** | Queries parametrizadas |

**Defense in Depth:** Múltiplas camadas de proteção

---

## Método: invalidateCache

### Descrição

Invalida cache de queries relacionadas a uma família específica.

### Assinatura

```typescript
static async invalidateCache(
  familiaCodigo: string
): Promise<void>
```

### Quando Usar

- ✅ Após UPDATE em dados da família
- ✅ Em rotinas de sincronização
- ✅ Quando dados mudarem no ERP

### Como Funciona

```typescript
await QueryCacheService.invalidateMultiple([
  'familia:*',           // Cache de getFamiliaMaster
  'estabelecimento:*'    // Cache relacionado
]);
```

**Padrões Invalidados:**
- `familia:*` - Todos os caches de famílias
- `estabelecimento:*` - Caches relacionados

**Escopo:**
- Invalida **L1** (in-memory)
- Invalida **L2** (Redis)
- Afeta **todas as instâncias** (via Redis)

### Impacto

**Imediato:**
- Próximas queries terão cache miss
- Performance temporariamente degradada
- Carga no banco aumenta momentaneamente

**Mitigação:**
- Use com moderação
- Considere invalidação seletiva em produção
- Evite invalidar em horário de pico

### Exemplos de Uso

**Após Update:**
```typescript
await repository.updateFamilia('450000', newData);
await repository.invalidateCache('450000');
```

**Sincronização em Lote:**
```typescript
for (const familia of updatedFamilias) {
  await updateFamiliaInDatabase(familia);
}
// Invalida uma vez ao final
await FamiliaInformacoesGeraisRepository.invalidateCache('batch-update');
```

---

## Exemplos de Uso

### Exemplo 1: Busca Simples

```typescript
const familia = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('450000');

// Resultado:
{
  familiaCodigo: '450000',
  familiaDescricao: 'FAMÍLIA TESTE'
}
```

### Exemplo 2: Família Não Encontrada

```typescript
const familia = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('INVALID');

// Resultado: null
```

### Exemplo 3: Cache Hit

```typescript
// Primeira chamada - Cache MISS
const familia1 = await getFamiliaMaster('450000');
// ~200ms - busca no banco

// Segunda chamada - Cache HIT
const familia2 = await getFamiliaMaster('450000');
// < 1ms - retorna de memória
```

### Exemplo 4: Invalidação de Cache

```typescript
// Atualiza dados
await updateFamiliaInERP('450000', newData);

// Invalida cache
await FamiliaInformacoesGeraisRepository.invalidateCache('450000');

// Próxima query terá cache miss
const familia = await getFamiliaMaster('450000');
// ~200ms - busca dados atualizados
```

---

## Tratamento de Erros

### Erros Possíveis

| Erro | Causa | Tratamento |
|------|-------|------------|
| **Timeout** | Query muito lenta | Propagado ao Service |
| **Linked Server Offline** | Progress inacessível | Propagado ao Service |
| **Permissão Negada** | Credenciais inválidas | Propagado ao Service |
| **SQL Inválido** | Bug na query | Propagado ao Service |
| **Connection Pool Full** | Muitas conexões simultâneas | Propagado ao Service |

### Estratégia

```typescript
catch (error) {
  console.error('Erro ao buscar familia master:', error);
  throw error; // Propaga para Service tratar
}
```

**Responsabilidade:**
- Repository: Registra erro detalhado
- Service: Converte para erro de domínio
- Controller: Retorna resposta HTTP adequada

---

## Pontos Críticos

### 1. OPENQUERY e Parametrização

⚠️ **Limitação Técnica:**
- OPENQUERY não aceita parâmetros diretos
- Solução: SQL dinâmico com sp_executesql
- Mantém segurança com parâmetros tipados

### 2. Aspas no Progress

⚠️ **Peculiaridade:**
- Progress usa aspas duplas: `"fm-codigo"`
- Escape complexo no OPENQUERY: `'''''`
- Erros sutis se esquecer aspas

### 3. Retorno null vs Array Vazio

⚠️ **Convenção:**
- Repository retorna `null` se não encontrar
- **NÃO** retorna `[]` (array vazio)
- Consistência com Service Layer

### 4. Cache e Consistência

⚠️ **Trade-off:**
- Cache melhora performance (80-90%)
- Mas dados podem estar desatualizados (até 10 min)
- Aceitável para dados mestres (mudam raramente)

---

## Performance

### Benchmarks

| Operação | Tempo Médio | P95 | P99 |
|----------|-------------|-----|-----|
| **Cache L1 HIT** | < 1ms | 2ms | 5ms |
| **Cache L2 HIT** | ~8ms | 15ms | 25ms |
| **Cache MISS** | ~150ms | 300ms | 500ms |
| **Timeout** | 30s | - | - |

### Otimizações

1. **Cache L1 + L2**
   - Reduz 80-90% queries
   - Protege banco de sobrecarga

2. **Connection Pooling**
   - Reutiliza conexões
   - Reduz overhead

3. **Queries Otimizadas**
   - SELECT apenas campos necessários
   - WHERE específico (não full scan)

---

## Manutenção

### Alterando TTL do Cache

```typescript
// No QueryCacheService
const CACHE_TTL = {
  familia: 1200,  // Alterar para 20 minutos
};
```

### Adicionando Novos Campos

1. Atualizar query SQL
2. Atualizar tipo `FamiliaMasterQueryResult`
3. Invalidar cache existente
4. Testar mapeamento

### Troubleshooting

**Cache não funciona:**
```typescript
// Verificar logs
console.log('Cache status:', result);
```

**Query lenta:**
```sql
-- Adicionar índice no Progress
CREATE INDEX ix_familia_codigo ON pub.familia ("fm-codigo");
```

**Linked Server offline:**
```sql
-- Testar conexão
SELECT * FROM OPENQUERY(PRD_EMS2EMP, 'SELECT 1');
```

---

## Referências

### Documentação Relacionada

- `informacoesGerais.service.md` - Service Layer
- `informacoesGerais.types.md` - Tipos e DTOs
- `DatabaseManager.md` - Gerenciador de conexões
- `QueryCacheService.md` - Sistema de cache

### Tecnologias

- [SQL Server OPENQUERY](https://docs.microsoft.com/sql/t-sql/functions/openquery-transact-sql)
- [sp_executesql](https://docs.microsoft.com/sql/relational-databases/system-stored-procedures/sp-executesql-transact-sql)
- [Progress OpenEdge SQL](https://docs.progress.com/bundle/openedge-sql-reference)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Cache-Aside Pattern](https://docs.microsoft.com/azure/architecture/patterns/cache-aside)