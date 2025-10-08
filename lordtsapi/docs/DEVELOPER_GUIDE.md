# DEVELOPER_GUIDE.md - Manual de Desenvolvimento LOR0138

> **⚠️ DOCUMENTO CRÍTICO**
> Este documento define os padrões arquiteturais que **DEVEM** ser seguidos em todas as implementações futuras. Desvios destes padrões comprometerão a integridade do sistema.

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
2. [Estrutura de Pastas Obrigatória](#-estrutura-de-pastas-obrigatória)
3. [Checklist: Implementando Nova API](#-checklist-implementando-nova-api)
4. [Padrões de Código](#-padrões-de-código)
5. [Testes Obrigatórios](#-testes-obrigatórios)
6. [Documentação Obrigatória](#-documentação-obrigatória)
7. [Arquivos que SEMPRE Devem Ser Atualizados](#-arquivos-que-sempre-devem-ser-atualizados)
8. [Exemplos Práticos](#-exemplos-práticos)
9. [O Que NUNCA Fazer](#-o-que-nunca-fazer)
10. [Quality Gates](#-quality-gates)
11. [Troubleshooting](#-troubleshooting)

---

## 🏗 Visão Geral da Arquitetura

### Princípios Fundamentais

1. **Camadas Isoladas**: Controller → Service → Repository
2. **Validação em Camadas**: Validators → Request → Response
3. **Error Handling Centralizado**: CustomErrors + Error Middleware
4. **Logging Estruturado**: Winston com correlation ID
5. **Cache Inteligente**: L1 (Memory) + L2 (Redis)
6. **Testes em Pirâmide**: Unit > Integration > E2E
7. **Documentação Automática**: OpenAPI/Swagger

### Stack Tecnológica

```
TypeScript 5.9.3
Node.js 18+
Express 4.x
SQL Server (Datasul/Progress via Linked Server)
Redis (Cache L2)
Jest (Testes)
Winston (Logs)
Swagger/OpenAPI (Documentação)
```

### Fluxo de Requisição

```
HTTP Request
    ↓
1. Correlation ID Middleware (gera/valida UUID)
    ↓
2. Timeout Middleware (30s padrão, 5s health)
    ↓
3. API Key Auth (opcional/obrigatório)
    ↓
4. Rate Limiting (por usuário/tier)
    ↓
5. Cache Middleware (verifica L1→L2)
    ↓
6. Validator (valida params/query/body)
    ↓
7. Controller (orquestra)
    ↓
8. Service (lógica de negócio)
    ↓
9. Repository (acesso a dados)
    ↓
10. Response (JSON padronizado)
    ↓
11. Error Handler (se erro ocorrer)
    ↓
12. Logging (correlation ID + contexto)
```

---

## 📁 Estrutura de Pastas Obrigatória

### Template Completo para Nova API

Quando criar uma nova API, **SEMPRE** siga esta estrutura:

```
src/api/lor0138/{modulo}/{categoria}/{funcionalidade}/
├── controller/
│   └── {funcionalidade}.controller.ts       # ✅ OBRIGATÓRIO
├── service/
│   └── {funcionalidade}.service.ts          # ✅ OBRIGATÓRIO
├── repository/
│   └── {funcionalidade}.repository.ts       # ✅ OBRIGATÓRIO
├── validators/
│   ├── {param}.validator.ts                 # ✅ OBRIGATÓRIO
│   └── {query}.validator.ts                 # ⚠️  SE APLICÁVEL
├── types/
│   ├── {funcionalidade}.types.ts            # ✅ OBRIGATÓRIO
│   └── {funcionalidade}.dto.ts              # ⚠️  SE APLICÁVEL
├── routes/
│   └── {funcionalidade}.routes.ts           # ✅ OBRIGATÓRIO
├── mappers/
│   └── {funcionalidade}.mapper.ts           # ⚠️  SE APLICÁVEL
└── __tests__/                               # ✅ OBRIGATÓRIO
    ├── {funcionalidade}.controller.test.ts
    ├── {funcionalidade}.service.test.ts
    ├── {funcionalidade}.repository.test.ts
    └── {funcionalidade}.validator.test.ts
```

### Exemplo Real: Informações Gerais

```
src/api/lor0138/item/dadosCadastrais/informacoesGerais/
├── controller/
│   └── informacoesGerais.controller.ts
├── service/
│   └── informacoesGerais.service.ts
├── repository/
│   └── informacoesGerais.repository.ts
├── validators/
│   └── itemCodigoValidator.ts
├── types/
│   └── informacoesGerais.types.ts
├── routes/
│   └── informacoesGerais.routes.ts
└── __tests__/
    ├── informacoesGerais.controller.test.ts
    ├── informacoesGerais.service.test.ts
    ├── informacoesGerais.repository.test.ts
    └── itemCodigoValidator.test.ts
```

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Controller | `{nome}.controller.ts` | `informacoesGerais.controller.ts` |
| Service | `{nome}.service.ts` | `informacoesGerais.service.ts` |
| Repository | `{nome}.repository.ts` | `informacoesGerais.repository.ts` |
| Validator | `{parametro}Validator.ts` | `itemCodigoValidator.ts` |
| Types | `{nome}.types.ts` | `informacoesGerais.types.ts` |
| Routes | `{nome}.routes.ts` | `informacoesGerais.routes.ts` |
| Tests | `{nome}.test.ts` | `informacoesGerais.test.ts` |

---

## ✅ Checklist: Implementando Nova API

### Fase 1: Planejamento (Antes de Codificar)

- [ ] **Definir contrato da API**
  - [ ] Método HTTP (GET/POST/PUT/DELETE)
  - [ ] URL pattern (camelCase, não kebab-case)
  - [ ] Request params/query/body
  - [ ] Response format
  - [ ] Status codes possíveis

- [ ] **Mapear queries SQL**
  - [ ] Identificar tabelas do Datasul
  - [ ] Escrever queries de teste
  - [ ] Validar performance (<3s)
  - [ ] Verificar índices

- [ ] **Definir estratégia de cache**
  - [ ] TTL apropriado (5min padrão)
  - [ ] Cache key pattern
  - [ ] Invalidação strategy

### Fase 2: Implementação

#### Passo 1: Criar Estrutura de Pastas

```bash
# Exemplo para nova API de "Classificações"
mkdir -p src/api/lor0138/item/dadosCadastrais/classificacoes/{controller,service,repository,validators,types,routes,__tests__}
```

#### Passo 2: Criar Types

```bash
# src/api/lor0138/item/dadosCadastrais/classificacoes/types/classificacoes.types.ts
```

**Template obrigatório:**

```typescript
/**
 * @fileoverview Types para Classificações de Item
 *
 * Define todas as interfaces e tipos usados no módulo de classificações.
 *
 * @module ClassificacoesTypes
 * @category API
 */

/**
 * Dados de classificação de item
 */
export interface ClassificacaoItem {
  itemCodigo: string;
  tipo: string;
  codigo: string;
  descricao: string;
  // ... outros campos
}

/**
 * Request params para classificações
 */
export interface ClassificacoesParams {
  itemCodigo: string;
}

/**
 * Response da API de classificações
 */
export interface ClassificacoesResponse {
  success: boolean;
  data: ClassificacaoItem[];
  correlationId: string;
}
```

#### Passo 3: Criar Validator

```bash
# src/api/lor0138/item/dadosCadastrais/classificacoes/validators/itemCodigoValidator.ts
```

**Template obrigatório:**

```typescript
/**
 * @fileoverview Validador de Item Código para Classificações
 *
 * Valida o código do item antes de processar requisição.
 *
 * @module ItemCodigoValidator
 * @category Validators
 */

import { ValidationError } from '@shared/errors/CustomErrors';

/**
 * Valida código de item
 *
 * Regras:
 * - Não pode ser vazio
 * - Máximo 16 caracteres
 * - Sem caracteres especiais
 *
 * @param {string} itemCodigo - Código do item a validar
 * @throws {ValidationError} Se código inválido
 * @returns {void}
 */
export function validateItemCodigo(itemCodigo: string): void {
  if (!itemCodigo || itemCodigo.trim() === '') {
    throw new ValidationError('Código do item é obrigatório', {
      itemCodigo: 'Campo vazio ou ausente'
    });
  }

  if (itemCodigo.length > 16) {
    throw new ValidationError('Código do item inválido', {
      itemCodigo: 'Máximo de 16 caracteres'
    });
  }

  // Validar formato se necessário
  const regex = /^[A-Z0-9-]+$/i;
  if (!regex.test(itemCodigo)) {
    throw new ValidationError('Código do item contém caracteres inválidos', {
      itemCodigo: 'Apenas letras, números e hífen permitidos'
    });
  }
}
```

#### Passo 4: Criar Repository

```bash
# src/api/lor0138/item/dadosCadastrais/classificacoes/repository/classificacoes.repository.ts
```

**Template obrigatório:**

```typescript
/**
 * @fileoverview Repository de Classificações
 *
 * Responsável por acessar dados de classificações no banco Datasul.
 *
 * @module ClassificacoesRepository
 * @category Repository
 */

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { log } from '@shared/utils/logger';
import type { ClassificacaoItem } from '../types/classificacoes.types';

export class ClassificacoesRepository {

  /**
   * Busca classificações de um item
   *
   * @param {string} itemCodigo - Código do item
   * @returns {Promise<ClassificacaoItem[]>} Lista de classificações
   *
   * @throws {DatabaseError} Se erro ao consultar banco
   */
  static async buscarClassificacoes(itemCodigo: string): Promise<ClassificacaoItem[]> {
    const startTime = Date.now();

    try {
      const query = `
        SELECT
          item.it_codigo AS itemCodigo,
          classe.tipo_classi AS tipo,
          classe.cod_classi AS codigo,
          classe.des_classi AS descricao
        FROM item
        INNER JOIN item_classi ON item.it_codigo = item_classi.it_codigo
        INNER JOIN classi_item AS classe ON item_classi.cod_classi = classe.cod_classi
        WHERE item.it_codigo = @itemCodigo
        ORDER BY classe.tipo_classi, classe.cod_classi
      `;

      const params = [
        { name: 'itemCodigo', value: itemCodigo }
      ];

      const results = await DatabaseManager.queryEmpWithParams<ClassificacaoItem>(
        query,
        params
      );

      const duration = Date.now() - startTime;

      log.debug('Classificações buscadas', {
        itemCodigo,
        count: results.length,
        duration: `${duration}ms`
      });

      return results;

    } catch (error) {
      log.error('Erro ao buscar classificações', {
        itemCodigo,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
```

#### Passo 5: Criar Service

```bash
# src/api/lor0138/item/dadosCadastrais/classificacoes/service/classificacoes.service.ts
```

**Template obrigatório:**

```typescript
/**
 * @fileoverview Service de Classificações
 *
 * Contém a lógica de negócio para classificações de item.
 * Orquestra validações, cache e repository.
 *
 * @module ClassificacoesService
 * @category Service
 */

import { ClassificacoesRepository } from '../repository/classificacoes.repository';
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';
import type { ClassificacaoItem } from '../types/classificacoes.types';

export class ClassificacoesService {

  /**
   * TTL do cache: 10 minutos
   */
  private static readonly CACHE_TTL = 600;

  /**
   * Busca classificações de item com cache
   *
   * @param {string} itemCodigo - Código do item
   * @returns {Promise<ClassificacaoItem[]>} Lista de classificações
   */
  static async getClassificacoes(itemCodigo: string): Promise<ClassificacaoItem[]> {
    const cacheKey = generateCacheKey('item', itemCodigo, 'classificacoes');

    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        log.debug('Cache miss - buscando do banco', { itemCodigo });
        return await ClassificacoesRepository.buscarClassificacoes(itemCodigo);
      },
      this.CACHE_TTL
    );
  }
}
```

#### Passo 6: Criar Controller

```bash
# src/api/lor0138/item/dadosCadastrais/classificacoes/controller/classificacoes.controller.ts
```

**Template obrigatório:**

```typescript
/**
 * @fileoverview Controller de Classificações
 *
 * Gerencia requisições HTTP para classificações de item.
 *
 * @module ClassificacoesController
 * @category Controller
 */

import { Request, Response, NextFunction } from 'express';
import { ClassificacoesService } from '../service/classificacoes.service';
import { validateItemCodigo } from '../validators/itemCodigoValidator';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import type { ClassificacoesResponse } from '../types/classificacoes.types';

export class ClassificacoesController {

  /**
   * GET /api/lor0138/item/dadosCadastrais/classificacoes/:itemCodigo
   *
   * Retorna classificações de um item
   */
  static getClassificacoes = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { itemCodigo } = req.params;

      // Validação
      validateItemCodigo(itemCodigo);

      // Buscar dados
      const classificacoes = await ClassificacoesService.getClassificacoes(itemCodigo);

      // Response padronizado
      const response: ClassificacoesResponse = {
        success: true,
        data: classificacoes,
        correlationId: req.id
      };

      res.json(response);
    }
  );
}
```

#### Passo 7: Criar Routes

```bash
# src/api/lor0138/item/dadosCadastrais/classificacoes/routes/classificacoes.routes.ts
```

**Template obrigatório:**

```typescript
/**
 * @fileoverview Rotas de Classificações
 *
 * Define endpoints HTTP para classificações de item.
 *
 * @module ClassificacoesRoutes
 * @category Routes
 */

import { Router } from 'express';
import { ClassificacoesController } from '../controller/classificacoes.controller';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { defaultTimeout } from '@shared/middlewares/timeout.middleware';
import { itemCache } from '@shared/middlewares/cache.middleware';

const router = Router();

/**
 * @openapi
 * /api/lor0138/item/dadosCadastrais/classificacoes/{itemCodigo}:
 *   get:
 *     summary: Buscar Classificações de Item
 *     description: Retorna todas as classificações de um item
 *     tags:
 *       - Itens - Dados Cadastrais
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do item
 *         example: '7530110'
 *       - in: header
 *         name: X-Correlation-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de correlação (gerado automaticamente se não fornecido)
 *       - in: header
 *         name: X-API-Key
 *         schema:
 *           type: string
 *         description: API Key (opcional, para rate limiting diferenciado)
 *     responses:
 *       200:
 *         description: Classificações retornadas com sucesso
 *         headers:
 *           X-Correlation-ID:
 *             schema:
 *               type: string
 *               format: uuid
 *             description: ID de correlação da requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemCodigo:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       codigo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                 correlationId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:itemCodigo',
  optionalApiKeyAuth,  // API Key opcional
  userRateLimit,       // Rate limit por tier
  defaultTimeout,      // Timeout 30s
  itemCache,           // Cache HTTP
  ClassificacoesController.getClassificacoes
);

export default router;
```

#### Passo 8: Registrar Rota no app.ts

```typescript
// src/app.ts

// Importar rota
import classificacoesRoutes from '@api/lor0138/item/dadosCadastrais/classificacoes/routes/classificacoes.routes';

// No método setupRoutes(), adicionar:
this.app.use(
  '/api/lor0138/item/dadosCadastrais/classificacoes',
  classificacoesRoutes
);
```

### Fase 3: Testes

#### Passo 9: Criar Testes Unitários

Criar **TODOS** estes arquivos:

```bash
# Controller test
touch src/api/lor0138/item/dadosCadastrais/classificacoes/__tests__/classificacoes.controller.test.ts

# Service test
touch src/api/lor0138/item/dadosCadastrais/classificacoes/__tests__/classificacoes.service.test.ts

# Repository test
touch src/api/lor0138/item/dadosCadastrais/classificacoes/__tests__/classificacoes.repository.test.ts

# Validator test
touch src/api/lor0138/item/dadosCadastrais/classificacoes/__tests__/itemCodigoValidator.test.ts
```

**Template para Validator Test:**

```typescript
// classificacoes/__tests__/itemCodigoValidator.test.ts

import { validateItemCodigo } from '../validators/itemCodigoValidator';
import { ValidationError } from '@shared/errors/CustomErrors';

describe('ItemCodigoValidator', () => {
  describe('validateItemCodigo', () => {
    it('deve validar código válido', () => {
      expect(() => validateItemCodigo('7530110')).not.toThrow();
    });

    it('deve rejeitar código vazio', () => {
      expect(() => validateItemCodigo('')).toThrow(ValidationError);
    });

    it('deve rejeitar código muito longo', () => {
      const codigoLongo = 'A'.repeat(17);
      expect(() => validateItemCodigo(codigoLongo)).toThrow(ValidationError);
    });

    it('deve rejeitar código com caracteres especiais', () => {
      expect(() => validateItemCodigo('ABC@123')).toThrow(ValidationError);
    });
  });
});
```

#### Passo 10: Criar Teste de Integração

```bash
# Integration test
mkdir -p tests/integration/api/lor0138/item/classificacoes
touch tests/integration/api/lor0138/item/classificacoes/classificacoes.integration.test.ts
```

**Template:**

```typescript
// tests/integration/api/lor0138/item/classificacoes/classificacoes.integration.test.ts

import request from 'supertest';
import app from '../../../../../src/app';

describe('Integration - Classificações API', () => {

  it('deve retornar 200 para item válido', async () => {
    const response = await request(app)
      .get('/api/lor0138/item/dadosCadastrais/classificacoes/7530110')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.correlationId).toBeDefined();
  });

  it('deve retornar 400 para item inválido', async () => {
    const response = await request(app)
      .get('/api/lor0138/item/dadosCadastrais/classificacoes/')
      .expect(404);
  });
});
```

#### Passo 11: Rodar Testes

```bash
# Unitários
npm run test:unit -- classificacoes

# Integração
npm run test:integration -- classificacoes

# Coverage
npm run test:coverage
```

### Fase 4: Documentação

#### Passo 12: Atualizar README.md

Adicionar a nova API na lista de endpoints disponíveis.

#### Passo 13: Verificar Swagger

```bash
# Iniciar servidor
npm run dev

# Acessar Swagger
http://lor0138.lorenzetti.ibe:3000/api-docs

# Verificar se nova rota aparece
```

### Fase 5: Quality Gates

#### Passo 14: Verificar Quality Gates

```bash
# Linter
npm run lint

# TypeScript
npx tsc --noEmit

# Testes
npm run test:all

# Coverage > 70%
npm run test:coverage
```

#### Passo 15: Commit

```bash
git add .
git commit -m "feat: implementar API de classificações de item

- Controller, Service, Repository, Validator
- Testes unitários e integração
- Documentação Swagger
- Coverage: 85%
"
```

---

## 🎨 Padrões de Código

### 1. Nomenclatura

#### Classes

```typescript
// ✅ CORRETO: PascalCase
export class InformacoesGeraisController { }
export class ClassificacoesService { }

// ❌ ERRADO
export class informacoesGeraisController { }
export class classificacoes_service { }
```

#### Funções e Métodos

```typescript
// ✅ CORRETO: camelCase
static async getInformacoesGerais() { }
function validateItemCodigo() { }

// ❌ ERRADO
static async GetInformacoesGerais() { }
function ValidateItemCodigo() { }
```

#### Constantes

```typescript
// ✅ CORRETO: UPPER_SNAKE_CASE ou camelCase para privadas
const CACHE_TTL = 600;
private static readonly defaultTimeout = 30000;

// ❌ ERRADO
const cache_ttl = 600;
const CacheTtl = 600;
```

#### Arquivos

```typescript
// ✅ CORRETO: camelCase.tipo.ts
informacoesGerais.controller.ts
itemCodigoValidator.ts

// ❌ ERRADO
InformacoesGerais.controller.ts
item-codigo-validator.ts
item_codigo_validator.ts
```

### 2. Imports

#### Ordem dos Imports

```typescript
// 1. Node.js built-ins
import { readFile } from 'fs/promises';

// 2. External packages
import { Router } from 'express';
import axios from 'axios';

// 3. Internal - com path aliases
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { log } from '@shared/utils/logger';
import { ValidationError } from '@shared/errors/CustomErrors';

// 4. Relative imports (mesmo módulo)
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import type { InformacoesGerais } from '../types/informacoesGerais.types';
```

#### Path Aliases (SEMPRE usar)

```typescript
// ✅ CORRETO: Path aliases
import { log } from '@shared/utils/logger';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { appConfig } from '@config/app.config';

// ❌ ERRADO: Relative paths longos
import { log } from '../../../shared/utils/logger';
import { DatabaseManager } from '../../../../infrastructure/database/DatabaseManager';
```

### 3. Error Handling

#### SEMPRE usar asyncHandler

```typescript
// ✅ CORRETO: Com asyncHandler
export class MyController {
  static getItem = asyncHandler(
    async (req: Request, res: Response) => {
      // Erros são capturados automaticamente
      const data = await service.getData();
      res.json({ success: true, data });
    }
  );
}

// ❌ ERRADO: Try-catch manual
export class MyController {
  static async getItem(req: Request, res: Response) {
    try {
      const data = await service.getData();
      res.json({ success: true, data });
    } catch (error) {
      // Duplicação de código
      res.status(500).json({ error: 'Erro' });
    }
  }
}
```

#### SEMPRE usar CustomErrors

```typescript
// ✅ CORRETO: Custom errors
import { ValidationError, ItemNotFoundError } from '@shared/errors/CustomErrors';

if (!itemCodigo) {
  throw new ValidationError('Código obrigatório', {
    itemCodigo: 'Campo vazio'
  });
}

if (!item) {
  throw new ItemNotFoundError(itemCodigo);
}

// ❌ ERRADO: Errors genéricos
if (!itemCodigo) {
  throw new Error('Código obrigatório');
}

if (!item) {
  throw new Error('Item não encontrado');
}
```

### 4. Logging

#### SEMPRE usar correlation ID

```typescript
// ✅ CORRETO: Com correlation ID
log.info('Processando requisição', {
  correlationId: req.id,
  itemCodigo,
  userId: req.user?.id
});

log.error('Erro ao processar', {
  correlationId: req.id,
  error: error.message
});

// ❌ ERRADO: Sem correlation ID
log.info('Processando requisição', { itemCodigo });
log.error('Erro ao processar', { error });
```

#### Níveis de Log Apropriados

```typescript
// DEBUG: Detalhes de desenvolvimento
log.debug('Cache miss', { key });

// INFO: Eventos normais
log.info('Requisição processada', { correlationId, duration });

// WARN: Situações anormais mas recuperáveis
log.warn('Cache offline, usando fallback', { strategy });

// ERROR: Erros que precisam atenção
log.error('Falha ao conectar banco', { error, attempt });
```

### 5. Tipos TypeScript

#### SEMPRE tipar explicitamente

```typescript
// ✅ CORRETO: Tipos explícitos
function getItem(itemCodigo: string): Promise<Item | null> {
  // ...
}

const items: Item[] = [];
const count: number = 10;

// ❌ ERRADO: any ou sem tipo
function getItem(itemCodigo: any) {
  // ...
}

const items = [];
const count = 10;
```

#### Preferir Interfaces a Types (para objetos)

```typescript
// ✅ CORRETO: Interface para objetos
export interface InformacoesGerais {
  itemCodigo: string;
  descricao: string;
}

// ✅ CORRETO: Type para unions e primitivos
export type Status = 'ativo' | 'inativo';
export type ItemCodigo = string;

// ❌ ERRADO: Type para objetos complexos
export type InformacoesGerais = {
  itemCodigo: string;
  descricao: string;
};
```

### 6. Async/Await

#### SEMPRE prefira async/await a promises

```typescript
// ✅ CORRETO: async/await
async function getData() {
  const result = await database.query();
  const processed = await processData(result);
  return processed;
}

// ❌ ERRADO: Promise chains
function getData() {
  return database.query()
    .then(result => processData(result))
    .then(processed => processed);
}
```

---

## 🧪 Testes Obrigatórios

### Coverage Mínimo

| Tipo | Coverage | Obrigatório |
|------|----------|-------------|
| Validators | 90%+ | ✅ |
| Services | 80%+ | ✅ |
| Repositories | 70%+ | ✅ |
| Controllers | 70%+ | ✅ |
| **TOTAL** | **75%+** | ✅ |

### Estrutura de Teste

```typescript
describe('ModuleName', () => {
  describe('methodName', () => {
    // Setup
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Happy path
    it('deve fazer X quando Y', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBeDefined();
    });

    // Error cases
    it('deve lançar erro quando Z', async () => {
      await expect(
        service.method(invalid)
      ).rejects.toThrow(ValidationError);
    });

    // Edge cases
    it('deve lidar com caso vazio', async () => {
      const result = await service.method('');
      expect(result).toEqual([]);
    });
  });
});
```

### Testes Obrigatórios por Camada

#### Validator

```typescript
describe('Validator', () => {
  it('✅ deve aceitar entrada válida');
  it('❌ deve rejeitar entrada vazia');
  it('❌ deve rejeitar entrada muito longa');
  it('❌ deve rejeitar formato inválido');
  it('🔄 deve trimmar whitespace');
});
```

#### Service

```typescript
describe('Service', () => {
  it('✅ deve retornar dados com cache hit');
  it('✅ deve buscar do banco com cache miss');
  it('❌ deve lançar erro se repositório falhar');
  it('⚡ deve completar em < 1s');
});
```

#### Repository

```typescript
describe('Repository', () => {
  it('✅ deve retornar dados do banco');
  it('✅ deve retornar array vazio se não encontrar');
  it('❌ deve propagar erro do banco');
  it('📊 deve logar métricas');
});
```

#### Controller

```typescript
describe('Controller', () => {
  it('✅ 200 - deve retornar sucesso com dados');
  it('❌ 400 - deve retornar erro de validação');
  it('❌ 404 - deve retornar não encontrado');
  it('📝 deve incluir correlationId');
});
```

### Rodar Testes

```bash
# Todos os testes unitários
npm run test:unit

# Teste específico
npm run test:unit -- classificacoes

# Com coverage
npm run test:coverage

# Integration
npm run test:integration

# Tudo
npm run test:all
```

---

## 📚 Documentação Obrigatória

### JSDoc em TODOS os Métodos Públicos

```typescript
/**
 * Busca informações gerais de item
 *
 * Retorna dados cadastrais completos incluindo:
 * - Dados gerais (código, descrição, unidade)
 * - Unidades de medida
 * - Estabelecimentos
 *
 * @param {string} itemCodigo - Código do item (máx 16 caracteres)
 * @returns {Promise<InformacoesGerais | null>} Dados ou null se não encontrado
 *
 * @throws {ValidationError} Se código inválido
 * @throws {DatabaseError} Se erro ao consultar banco
 *
 * @example
 * ```typescript
 * const info = await service.getInformacoesGerais('7530110');
 * console.log(info.dadosGerais.descricao);
 * ```
 */
static async getInformacoesGerais(itemCodigo: string): Promise<InformacoesGerais | null> {
  // ...
}
```

### OpenAPI/Swagger em TODAS as Rotas

```typescript
/**
 * @openapi
 * /api/lor0138/item/{itemCodigo}:
 *   get:
 *     summary: Buscar Item
 *     description: Retorna informações completas do item
 *     tags:
 *       - Itens
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         example: '7530110'
 *     responses:
 *       200:
 *         description: Sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/:itemCodigo', controller);
```

### README.md Atualizado

Sempre adicionar nova API no README:

```markdown
### Endpoints Disponíveis

- `GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo`
- `GET /api/lor0138/item/dadosCadastrais/classificacoes/:itemCodigo` ← NOVO
```

---

## 📝 Arquivos que SEMPRE Devem Ser Atualizados

### Ao Adicionar Nova API

| Arquivo | O Que Atualizar | Obrigatório |
|---------|-----------------|-------------|
| `app.ts` | Adicionar rota no `setupRoutes()` | ✅ |
| `README.md` | Listar novo endpoint | ✅ |
| `ARCHITECTURE.md` | Atualizar estrutura se aplicável | ⚠️ |
| `package.json` | Versão (seguir semver) | ✅ |
| `CHANGELOG.md` | Documentar mudança | ✅ |

### Ao Adicionar Dependência

| Arquivo | O Que Fazer | Obrigatório |
|---------|-------------|-------------|
| `package.json` | `npm install` | ✅ |
| `ARCHITECTURE.md` | Documentar stack | ⚠️ |
| `README.md` | Atualizar "Tecnologias" | ⚠️ |

### Ao Mudar Configuração

| Arquivo | O Que Fazer | Obrigatório |
|---------|-------------|-------------|
| `.env.example` | Adicionar variável com exemplo | ✅ |
| `DEPLOYMENT.md` | Documentar configuração | ✅ |
| `env.config.ts` | Adicionar validação | ✅ |
| `ARCHITECTURE.md` | Atualizar seção de config | ⚠️ |

---

## 💡 Exemplos Práticos

### Exemplo Completo: API de Estoque

Veja o exemplo completo em: `docs/examples/ESTOQUE_API_EXAMPLE.md`

**Estrutura:**

```
src/api/lor0138/item/estoque/
├── controller/
│   └── estoque.controller.ts
├── service/
│   └── estoque.service.ts
├── repository/
│   └── estoque.repository.ts
├── validators/
│   └── estabelecimentoValidator.ts
├── types/
│   └── estoque.types.ts
├── routes/
│   └── estoque.routes.ts
└── __tests__/
    ├── estoque.controller.test.ts
    ├── estoque.service.test.ts
    └── estoque.repository.test.ts
```

**Endpoint:** `GET /api/lor0138/item/estoque/:itemCodigo`

---

## ⛔ O Que NUNCA Fazer

### 1. ❌ NUNCA Quebrar Padrão de Camadas

```typescript
// ❌ ERRADO: Controller acessando banco diretamente
export class MyController {
  static async get(req: Request, res: Response) {
    const result = await DatabaseManager.query('SELECT...');
    res.json(result);
  }
}

// ✅ CORRETO: Controller → Service → Repository
export class MyController {
  static get = asyncHandler(async (req: Request, res: Response) => {
    const result = await MyService.getData();
    res.json({ success: true, data: result });
  });
}
```

### 2. ❌ NUNCA Usar Paths Relativos Longos

```typescript
// ❌ ERRADO
import { log } from '../../../shared/utils/logger';
import { DatabaseManager } from '../../../../infrastructure/database/DatabaseManager';

// ✅ CORRETO
import { log } from '@shared/utils/logger';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
```

### 3. ❌ NUNCA Ignorar Errors

```typescript
// ❌ ERRADO: Engolir erro
try {
  await service.getData();
} catch (error) {
  // Silêncio...
}

// ❌ ERRADO: Log sem propagar
try {
  await service.getData();
} catch (error) {
  console.log(error);
  return null;
}

// ✅ CORRETO: Propagar erro
async function getData() {
  const result = await service.getData();
  // Erros propagam automaticamente
  return result;
}
```

### 4. ❌ NUNCA Usar console.log

```typescript
// ❌ ERRADO
console.log('Debug info', data);
console.error('Error happened', error);

// ✅ CORRETO
log.debug('Debug info', { data, correlationId });
log.error('Error happened', { error, correlationId });
```

### 5. ❌ NUNCA Hardcoded Values

```typescript
// ❌ ERRADO
const timeout = 30000;
const cacheTime = 600;
const dbServer = '10.105.0.4\\LOREN';

// ✅ CORRETO
const timeout = appConfig.http.timeout;
const cacheTime = parseInt(process.env.CACHE_TTL || '600', 10);
const dbServer = appConfig.database.server;
```

### 6. ❌ NUNCA Modificar Dados de Produção

```typescript
// ❌ NUNCA FAZER ISTO
await DatabaseManager.queryEmpWithParams(`
  UPDATE item SET descricao = @desc WHERE it_codigo = @cod
`, params);

// ✅ Sistema é READ-ONLY
// Apenas SELECT é permitido
await DatabaseManager.queryEmpWithParams(`
  SELECT * FROM item WHERE it_codigo = @cod
`, params);
```

### 7. ❌ NUNCA Commitar sem Testes

```bash
# ❌ ERRADO
git add .
git commit -m "nova feature"

# ✅ CORRETO
npm run test:all
npm run lint
npx tsc --noEmit
git add .
git commit -m "feat: nova feature com testes"
```

### 8. ❌ NUNCA Usar kebab-case em URLs

```typescript
// ❌ ERRADO
this.app.use('/api/lor0138/item/dados-cadastrais/informacoes-gerais', routes);

// ✅ CORRETO
this.app.use('/api/lor0138/item/dadosCadastrais/informacoesGerais', routes);
```

---

## 🚦 Quality Gates

### Pre-Commit (Local)

```bash
# 1. Linter
npm run lint

# 2. TypeScript
npx tsc --noEmit

# 3. Testes unitários
npm run test:unit

# 4. Coverage mínimo
npm run test:coverage
# Verificar: > 75%
```

### Pre-Push (CI/CD)

```bash
# 1. Todos os testes
npm run test:all

# 2. Build
npm run build

# 3. Mutation testing (se PR importante)
npm run test:mutation
```

### Critérios de Aprovação

| Critério | Mínimo | Status |
|----------|--------|--------|
| Tests passing | 100% | ✅ Obrigatório |
| Coverage | 75% | ✅ Obrigatório |
| Mutation score | 80% | ⚠️  Recomendado |
| Linter | 0 errors | ✅ Obrigatório |
| TypeScript | 0 errors | ✅ Obrigatório |
| Build | Success | ✅ Obrigatório |

### Checklist de PR

```markdown
## Checklist

- [ ] Código segue padrões do DEVELOPER_GUIDE.md
- [ ] Estrutura de pastas correta
- [ ] Todos os testes passando
- [ ] Coverage > 75%
- [ ] Documentação JSDoc completa
- [ ] Swagger atualizado
- [ ] README.md atualizado
- [ ] CHANGELOG.md atualizado
- [ ] Sem console.log
- [ ] Sem TODO não resolvido
- [ ] Testado localmente
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module '@shared/...'"

**Causa:** Path aliases não configurados

**Solução:**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@shared/*": ["shared/*"],
      "@api/*": ["api/*"],
      "@config/*": ["config/*"],
      "@infrastructure/*": ["infrastructure/*"]
    }
  }
}
```

### Erro: "Property 'id' does not exist on type 'Request'"

**Causa:** Types do Express não estendidos

**Solução:**

Verificar se existe `src/shared/types/express.d.ts` com:

```typescript
declare global {
  namespace Express {
    interface Request {
      id: string; // Correlation ID
      user?: {
        id: string;
        tier: string;
      };
    }
  }
}
```

### Erro: Testes falhando com "Login failed"

**Causa:** `.env.test` mal configurado

**Solução:**

```env
# Senha DEVE ter aspas simples
DB_PASSWORD='#senha#'

# Database vazio
DB_DATABASE_EMP=
```

### Erro: Cache não funciona

**Causa:** Redis não inicializado ou strategy errada

**Solução:**

```env
# Verificar strategy
CACHE_STRATEGY=layered  # ou memory ou redis

# Verificar URL (se layered/redis)
CACHE_REDIS_URL=redis://lor0138.lorenzetti.ibe:6379
```

---

## 📚 Documentos Relacionados

| Documento | Quando Consultar |
|-----------|------------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Entender arquitetura geral |
| [TESTING.md](./TESTING.md) | Criar testes |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy em produção |
| [API.md](./API.md) | Documentação de endpoints |
| [MUTATION_TESTING.md](./MUTATION_TESTING.md) | Melhorar qualidade de testes |

---

## 🎯 Resumo Executivo

### Para Implementar Nova API, Você DEVE:

1. ✅ Seguir estrutura de pastas obrigatória
2. ✅ Criar TODOS os arquivos (controller/service/repository/validator/types/routes)
3. ✅ Escrever testes para TODAS as camadas
4. ✅ Documentar com JSDoc e OpenAPI
5. ✅ Registrar rota no app.ts
6. ✅ Atualizar README.md
7. ✅ Passar em TODOS os quality gates
8. ✅ Coverage > 75%

### Você NUNCA Deve:

1. ❌ Quebrar padrão de camadas
2. ❌ Usar paths relativos longos
3. ❌ Ignorar erros
4. ❌ Usar console.log
5. ❌ Hardcoded values
6. ❌ Modificar dados de produção
7. ❌ Commitar sem testes
8. ❌ Usar kebab-case em URLs

---

**Última atualização:** 2025-10-06
**Versão:** 1.0.0
**Mantenedor:** Projeto LOR0138

---

## ⚠️ LEMBRETE FINAL

**Este documento é a LEI do projeto.**

Qualquer código que não siga estes padrões será **REJEITADO** em code review.

A consistência arquitetural é mais importante que a velocidade de desenvolvimento.

**Quando em dúvida, consulte este documento. Sempre.**