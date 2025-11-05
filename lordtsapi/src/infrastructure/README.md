# Infrastructure - Detalhes Técnicos e Implementações

## 📋 Responsabilidade

A camada **Infrastructure** contém todos os **detalhes técnicos** e **implementações** de tecnologias específicas: banco de dados, cache, logging, métricas, etc. Implementa as interfaces definidas em outras camadas.

**Princípio chave:** Isolar detalhes técnicos do resto da aplicação.

## ✅ O que esta camada PODE fazer

- ✅ Implementar **repositórios** (acesso a banco de dados)
- ✅ Configurar **conexões** de banco (SQL Server, ODBC)
- ✅ Implementar **cache** (Redis, Memory)
- ✅ Configurar **logging** (Winston)
- ✅ Configurar **métricas** (Prometheus)
- ✅ Implementar **adapters** para serviços externos
- ✅ Usar bibliotecas externas (mssql, ioredis, winston)
- ✅ Acessar variáveis de ambiente
- ✅ Gerenciar processo (graceful shutdown)

## ❌ O que esta camada NÃO PODE fazer

- ❌ Conter lógica de negócio (vai em @domain)
- ❌ Definir use cases (vai em @application)
- ❌ Conter routes/controllers (vai em @presentation)
- ❌ Implementar regras de domínio

## 📁 Estrutura

```
src/infrastructure/
├── database/
│   ├── DatabaseManager.ts       # Gerenciador de conexões
│   ├── config/
│   │   ├── odbcConfig.ts        # Config ODBC
│   │   └── serverConfig.ts      # Config SQL Server
│   ├── connections/
│   │   ├── OdbcConnection.ts
│   │   ├── SqlServerConnection.ts
│   │   └── MockConnection.ts
│   └── types/
│       └── index.ts
├── cache/
│   ├── CacheManager.ts          # Gerenciador de cache
│   ├── adapters/
│   │   ├── CacheAdapter.ts      # Interface adapter
│   │   ├── MemoryCacheAdapter.ts
│   │   ├── RedisCacheAdapter.ts
│   │   └── LayeredCacheAdapter.ts
│   └── QueryCacheService.ts
├── logging/
│   └── logger.ts                # Winston logger
├── metrics/
│   └── MetricsManager.ts        # Prometheus metrics
├── process/
│   └── gracefulShutdown.ts      # Process management
└── README.md
```

## 💡 Exemplos

### ✅ BOM - DatabaseManager

```typescript
// src/infrastructure/database/DatabaseManager.ts

import sql from 'mssql';
import { OdbcConnection } from './connections/OdbcConnection';
import { SqlServerConnection } from './connections/SqlServerConnection';

/**
 * Database Manager - Gerencia conexões
 *
 * Responsabilidade:
 * - Criar e gerenciar pools de conexão
 * - Executar queries
 * - Parametrizar queries (segurança)
 * - Retry lógico
 */
export class DatabaseManager {
  private static empPool: sql.ConnectionPool | null = null;
  private static erpPool: sql.ConnectionPool | null = null;

  /**
   * Executa query no banco EMP
   * @param query - SQL query
   * @returns Resultado da query
   */
  static async queryEmp<T = any>(query: string): Promise<T[]> {
    const pool = await this.getEmpPool();
    const result = await pool.request().query(query);
    return result.recordset;
  }

  /**
   * Executa query parametrizada (SQL injection safe)
   * @param query - SQL query com placeholders (@param)
   * @param params - Parâmetros da query
   */
  static async queryEmpWithParams<T = any>(
    query: string,
    params: Array<{ name: string; type: string; value: any }>
  ): Promise<T[]> {
    const pool = await this.getEmpPool();
    const request = pool.request();

    // Adicionar parâmetros
    for (const param of params) {
      request.input(param.name, this.getSqlType(param.type), param.value);
    }

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Obtém pool de conexão EMP (lazy loading)
   */
  private static async getEmpPool(): Promise<sql.ConnectionPool> {
    if (!this.empPool) {
      this.empPool = await SqlServerConnection.connect('emp');
    }
    return this.empPool;
  }

  /**
   * Fecha todas as conexões
   */
  static async closeAll(): Promise<void> {
    if (this.empPool) {
      await this.empPool.close();
      this.empPool = null;
    }
    if (this.erpPool) {
      await this.erpPool.close();
      this.erpPool = null;
    }
  }

  private static getSqlType(type: string): any {
    const types: Record<string, any> = {
      varchar: sql.VarChar,
      int: sql.Int,
      decimal: sql.Decimal,
      datetime: sql.DateTime,
    };
    return types[type.toLowerCase()] || sql.VarChar;
  }
}
```

### ✅ BOM - Repository Implementation

```typescript
// src/infrastructure/repositories/ItemRepository.ts

import { IItemRepository } from '@application/interfaces/IItemRepository';
import { Item } from '@domain/entities/Item';
import { DatabaseManager } from '../database/DatabaseManager';

/**
 * Item Repository - Implementa acesso a dados
 *
 * Implementa interface definida em @application
 * Usa DatabaseManager para acessar banco
 */
export class ItemRepository implements IItemRepository {
  async findByCode(codigo: string): Promise<Item | null> {
    // Query parametrizada (SQL injection safe)
    const query = `
      SELECT
        "it-codigo" as codigo,
        "desc-item" as descricao,
        "unidade" as unidade,
        "ativo" as ativo
      FROM item
      WHERE "it-codigo" = @codigo
    `;

    const result = await DatabaseManager.queryEmpWithParams<{
      codigo: string;
      descricao: string;
      unidade: string;
      ativo: boolean;
    }>(query, [
      { name: 'codigo', type: 'varchar', value: codigo }
    ]);

    if (result.length === 0) {
      return null;
    }

    // Mapear resultado para entidade domain
    const data = result[0];
    return Item.create({
      codigo: data.codigo,
      descricao: data.descricao,
      unidade: data.unidade,
      ativo: data.ativo,
    });
  }

  async search(filters: {
    query?: string;
    ativo?: boolean;
    familia?: string;
    limit: number;
    offset: number;
  }): Promise<Item[]> {
    let query = `
      SELECT
        "it-codigo" as codigo,
        "desc-item" as descricao,
        "unidade" as unidade,
        "ativo" as ativo
      FROM item
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.query) {
      query += ` AND ("it-codigo" LIKE @query OR "desc-item" LIKE @query)`;
      params.push({
        name: 'query',
        type: 'varchar',
        value: `%${filters.query}%`
      });
    }

    if (filters.ativo !== undefined) {
      query += ` AND "ativo" = @ativo`;
      params.push({
        name: 'ativo',
        type: 'int',
        value: filters.ativo ? 1 : 0
      });
    }

    query += ` ORDER BY "it-codigo" OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.push(
      { name: 'offset', type: 'int', value: filters.offset },
      { name: 'limit', type: 'int', value: filters.limit }
    );

    const results = await DatabaseManager.queryEmpWithParams(query, params);

    return results.map(data =>
      Item.create({
        codigo: data.codigo,
        descricao: data.descricao,
        unidade: data.unidade,
        ativo: data.ativo,
      })
    );
  }

  async count(filters: {
    query?: string;
    ativo?: boolean;
    familia?: string;
  }): Promise<number> {
    let query = `SELECT COUNT(*) as total FROM item WHERE 1=1`;
    const params: any[] = [];

    if (filters.query) {
      query += ` AND ("it-codigo" LIKE @query OR "desc-item" LIKE @query)`;
      params.push({
        name: 'query',
        type: 'varchar',
        value: `%${filters.query}%`
      });
    }

    if (filters.ativo !== undefined) {
      query += ` AND "ativo" = @ativo`;
      params.push({
        name: 'ativo',
        type: 'int',
        value: filters.ativo ? 1 : 0
      });
    }

    const result = await DatabaseManager.queryEmpWithParams<{ total: number }>(
      query,
      params
    );

    return result[0]?.total || 0;
  }

  async save(item: Item): Promise<void> {
    const query = `
      UPDATE item
      SET "desc-item" = @descricao,
          "unidade" = @unidade,
          "ativo" = @ativo
      WHERE "it-codigo" = @codigo
    `;

    await DatabaseManager.queryEmpWithParams(query, [
      { name: 'codigo', type: 'varchar', value: item.codigoValue },
      { name: 'descricao', type: 'varchar', value: item.descricaoValue },
      { name: 'unidade', type: 'varchar', value: item.unidadeValue },
      { name: 'ativo', type: 'int', value: item.ativo ? 1 : 0 },
    ]);
  }

  async delete(codigo: string): Promise<void> {
    const query = `DELETE FROM item WHERE "it-codigo" = @codigo`;

    await DatabaseManager.queryEmpWithParams(query, [
      { name: 'codigo', type: 'varchar', value: codigo }
    ]);
  }
}
```

### ✅ BOM - Cache Adapter

```typescript
// src/infrastructure/cache/adapters/RedisCacheAdapter.ts

import Redis from 'ioredis';
import { CacheAdapter } from './CacheAdapter';

/**
 * Redis Cache Adapter
 *
 * Implementa CacheAdapter usando Redis
 */
export class RedisCacheAdapter implements CacheAdapter {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
```

### ✅ BOM - Logger Configuration

```typescript
// src/infrastructure/logging/logger.ts

import winston from 'winston';

/**
 * Winston Logger Configuration
 *
 * Configuração centralizada de logging
 */
export const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'lordtsapi',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Arquivo para produção
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Não logar em testes
if (process.env.NODE_ENV === 'test') {
  log.transports.forEach(transport => {
    transport.silent = true;
  });
}
```

### ❌ RUIM - Lógica de Negócio em Repository

```typescript
// ❌ NÃO FAÇA ISSO EM INFRASTRUCTURE

export class ItemRepository {
  async save(item: Item): Promise<void> {
    // ❌ Validação de negócio no repository
    if (item.codigoValue.length > 16) {
      throw new Error('Código muito longo');
    }

    // ❌ Regra de negócio (deveria estar em @domain)
    const ativo = item.descricaoValue.includes('ATIVO');

    await DatabaseManager.queryEmp(`
      INSERT INTO item VALUES ('${item.codigoValue}', '${item.descricaoValue}', ${ativo})
    `);
  }
}
```

## 🔗 Dependências

### Dependências Permitidas

- ✅ **@domain** - Para mapear dados → entidades
- ✅ **@application** - Implementar interfaces
- ✅ **@core** - Usar validações
- ✅ **Bibliotecas externas** - mssql, ioredis, winston, etc
- ✅ **Variáveis de ambiente** - process.env

### Camadas que podem importar Infrastructure

- ✅ **presentation** - Pode usar diretamente (ex: logger)
- ✅ **application** - Via dependency injection
- ⚠️ **domain** - EVITAR (usar inversão de dependência)

### Camadas que Infrastructure PODE importar

- ✅ infrastructure → application (interfaces)
- ✅ infrastructure → domain (entidades para mapear)
- ✅ infrastructure → core (validações)

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────┐
│         presentation                │
│    (pode usar logger)               │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│         application                 │
│    (define IItemRepository)         │
└────────────┬────────────────────────┘
             │
             │ implementa
             │ interfaces
             ▼
┌─────────────────────────────────────┐
│        infrastructure               │
│  (ItemRepository implementa         │
│   IItemRepository)                  │
└────────────┬────────────────────────┘
             │
             │ usa entidades
             │ para mapear
             ▼
┌─────────────────────────────────────┐
│           domain                    │
│    (Item, Familia, etc)             │
└─────────────────────────────────────┘
```

## 🎯 Boas Práticas

### ✅ DO - Database

1. **Queries parametrizadas** - SEMPRE usar parameters para evitar SQL injection
2. **Connection pooling** - Reutilizar conexões
3. **Retry logic** - Tentar novamente em caso de erro transiente
4. **Timeouts** - Configurar timeouts apropriados
5. **Logging** - Logar queries lentas
6. **Mapeamento** - Converter dados DB → entidades domain

### ✅ DO - Cache

1. **TTL apropriado** - Definir tempo de vida do cache
2. **Invalidation** - Invalidar cache quando dados mudam
3. **Layered cache** - Memory → Redis → Database
4. **Key naming** - Naming consistente de chaves (`item:${codigo}`)
5. **Serialization** - JSON.stringify para objetos

### ✅ DO - Logging

1. **Structured logging** - JSON format
2. **Log levels** - debug, info, warn, error
3. **Context** - Incluir correlationId, userId
4. **Rotation** - Rotacionar logs em produção
5. **Não logar** - Senhas, tokens, PII

### ❌ DON'T

1. ❌ Implementar regras de negócio em repositories
2. ❌ SQL injection vulnerável (sempre parametrizar)
3. ❌ Logar senhas ou dados sensíveis
4. ❌ Manter conexões abertas indefinidamente
5. ❌ Ignorar erros de infraestrutura
6. ❌ Hardcoded credentials (usar env vars)

## 🧪 Testabilidade

Infrastructure usa mocks ou test doubles:

```typescript
// __tests__/ItemRepository.test.ts

import { ItemRepository } from '../ItemRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { Item } from '@domain/entities/Item';

// Mock do DatabaseManager
jest.mock('../database/DatabaseManager');

describe('ItemRepository', () => {
  let repository: ItemRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ItemRepository();
  });

  describe('findByCode', () => {
    it('retorna item quando encontrado', async () => {
      // Arrange
      const mockData = {
        codigo: 'ITEM-001',
        descricao: 'Teste',
        unidade: 'UN',
        ativo: true,
      };

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        mockData,
      ]);

      // Act
      const item = await repository.findByCode('ITEM-001');

      // Assert
      expect(item).not.toBeNull();
      expect(item?.codigoValue).toBe('ITEM-001');
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [{ name: 'codigo', type: 'varchar', value: 'ITEM-001' }]
      );
    });

    it('retorna null quando não encontrado', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const item = await repository.findByCode('INEXISTENTE');

      expect(item).toBeNull();
    });
  });
});

// ✅ Mock de DatabaseManager
// ✅ Testa mapeamento de dados
// ✅ Sem acesso a banco real
```

## 🔒 Segurança

### Queries Parametrizadas

```typescript
// ✅ SEGURO - Parametrizado
const query = `SELECT * FROM item WHERE "it-codigo" = @codigo`;
await DatabaseManager.queryEmpWithParams(query, [
  { name: 'codigo', type: 'varchar', value: userInput }
]);

// ❌ VULNERÁVEL - SQL Injection
const query = `SELECT * FROM item WHERE "it-codigo" = '${userInput}'`;
await DatabaseManager.queryEmp(query);
```

### Environment Variables

```typescript
// ✅ Usar variáveis de ambiente
const dbHost = process.env.DB_HOST || 'localhost';
const dbPassword = process.env.DB_PASSWORD; // Nunca hardcode

// ❌ Hardcoded credentials
const dbPassword = 'senha123'; // Nunca faça isso!
```

## 📚 Referências

### Conceitos

- **Repository Pattern** - Abstração de acesso a dados
- **Adapter Pattern** - Adaptar interfaces externas
- **Connection Pooling** - Reutilizar conexões de banco
- **Dependency Inversion** - Depender de abstrações, não implementações

### Leitura Recomendada

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

### Arquivos Relacionados

- `src/application/` - Define interfaces que infrastructure implementa
- `src/domain/` - Entidades usadas para mapear dados
- `.env` - Variáveis de ambiente
- `tsconfig.json` - Path alias @infrastructure/*

---

**Última atualização:** 2025-10-20
**Camada:** Infrastructure (Technical Details)
**Princípio:** Isolar detalhes técnicos do resto da aplicação
