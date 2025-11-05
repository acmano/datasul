# GrupoDeEstoque Queries

Este diretório contém as queries SQL extraídas dos repositories para melhor manutenibilidade e documentação.

## 📁 Estrutura

```
queries/
├── README.md              # Este arquivo
├── index.ts               # Query loader com cache em memória
├── listar-todos.sql       # Query para listar todos os grupos de estoque
└── get-by-codigo.sql      # Query para buscar grupo de estoque por código
```

## 🎯 Por que Extrair Queries?

### Vantagens

✅ **Manutenibilidade**: Queries grandes ficam mais legíveis em arquivos `.sql` dedicados
✅ **Testabilidade**: Pode executar queries diretamente no SSMS para testes
✅ **Versionamento**: Git diff mostra mudanças de forma mais clara
✅ **Syntax Highlight**: Editores de código reconhecem `.sql` e aplicam highlight correto
✅ **Documentação**: Comentários ricos diretamente no SQL
✅ **Reutilização**: Queries podem ser compartilhadas entre repositories

### Desvantagens

❌ **Separação de contexto**: Precisa abrir múltiplos arquivos para entender o fluxo
❌ **Build step**: Arquivos `.sql` precisam ser copiados para `dist/` no build
❌ **Type-safety reduzida**: TypeScript não valida SQL em arquivos externos

## 📋 Queries Disponíveis

### 1. `listar-todos.sql`

**Descrição:** Busca todos os grupos de estoque cadastrados no sistema

**Parâmetros:** Nenhum

**Usado por:**
- `grupoDeEstoque/listar/repository.ts` :: `listarTodos()`

**Performance:**
- Lê toda a tabela PUB."grup-estoque"
- Usa OPENQUERY para Progress/OpenEdge
- Ordenado por código

**Cache:**
- TTL: Configurado no QueryCacheService
- Invalidação: Automática

---

### 2. `get-by-codigo.sql`

**Descrição:** Busca um grupo de estoque específico pelo código

**Parâmetros:**
- `@paramGrupoDeEstoqueCodigo` (varchar) - Código do grupo de estoque

**Usado por:**
- `grupoDeEstoque/dadosCadastrais/informacoesGerais/repository.ts` :: `getGrupoDeEstoqueMaster()`

**Performance:**
- WHERE executado no Progress/OpenEdge
- Retorna no máximo 1 registro

**Cache:**
- TTL: Configurado no QueryCacheService
- Invalidação: Por código específico

## 🚀 Como Usar

### No Repository

```typescript
import { GrupoDeEstoqueQueries } from '../queries';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';

export class GrupoDeEstoqueListarRepository {
  static async listarTodos(): Promise<GrupoDeEstoqueListItem[]> {
    // 1. Carrega query do arquivo (cached em memória)
    const query = GrupoDeEstoqueQueries.listarTodos();

    // 2. Define parâmetros (se houver)
    const params: QueryParameter[] = [];

    // 3. Executa query
    const result = await DatabaseManager.queryEmpWithParams(query, params);

    return result || [];
  }
}
```

### Com Parâmetros

```typescript
static async getGrupoDeEstoqueMaster(grupoDeEstoqueCodigo: string): Promise<GrupoDeEstoqueMasterQueryResult | null> {
  // 1. Carrega query
  const query = GrupoDeEstoqueQueries.getByCodigo();

  // 2. Define parâmetros
  const params: QueryParameter[] = [
    { name: 'paramGrupoDeEstoqueCodigo', type: 'varchar', value: grupoDeEstoqueCodigo }
  ];

  // 3. Executa
  const result = await DatabaseManager.queryEmpWithParams(query, params);

  return result && result.length > 0 ? result[0] : null;
}
```

## 🔍 Cache de Queries

O `QueryLoader` implementa um cache em memória para evitar leitura repetida de disco:

```typescript
// Primeira chamada: Lê do disco
const query1 = GrupoDeEstoqueQueries.listarTodos(); // I/O

// Chamadas subsequentes: Retorna do cache
const query2 = GrupoDeEstoqueQueries.listarTodos(); // Memória (rápido!)
```

## 📝 Convenções

### Nomenclatura de Arquivos

- **kebab-case**: `listar-todos.sql`, `get-by-codigo.sql`
- **Descritivo**: Nome deve indicar claramente o que a query faz
- **Extensão**: Sempre `.sql`

### Estrutura do Arquivo SQL

Cada query deve ter:

1. **Cabeçalho de documentação** (linhas 1-20+)
   - Descrição
   - Parâmetros
   - Utilizado por
   - Performance notes
   - Cache strategy
   - Última atualização

2. **Declaração de parâmetros** (se houver)
   ```sql
   DECLARE @parametro varchar(16) = @nomeParametro;
   ```

3. **Query principal**
   - Bem formatada e identada
   - Comentários inline quando necessário

## 🔧 Manutenção

### Adicionando Nova Query

1. Crie arquivo `.sql` na pasta `queries/`
2. Adicione documentação no cabeçalho
3. Registre no `index.ts`:
   ```typescript
   export const GrupoDeEstoqueQueries = {
     // ... queries existentes
     minhaNovaQuery: () => loadQuery('minha-nova-query.sql'),
   };
   ```
4. Atualize este README.md

### Modificando Query Existente

1. Edite o arquivo `.sql`
2. Atualize data de "Última atualização"
3. Se mudar parâmetros, atualize documentação
4. Reinicie servidor para recarregar cache

## ⚠️ Quando NÃO Extrair Queries

Não extraia queries que são:

- **Dinâmicas**: WHERE construído em runtime baseado em condições
- **Pequenas**: < 30 linhas (overhead não vale a pena)
- **Únicas**: Usadas em um único lugar e simples
- **Com lógica complexa**: Requerem construção programática

## 🧪 Testando Queries

Para testar uma query no SQL Server Management Studio:

1. Copie o conteúdo do arquivo `.sql`
2. Substitua variáveis de teste:
   ```sql
   -- Em vez de @paramGrupoDeEstoqueCodigo
   DECLARE @paramGrupoDeEstoqueCodigo varchar(16) = '001'; -- Valor de teste
   ```
3. Execute no SSMS
4. Verifique resultados

## 📚 Referências

- [CLAUDE.md](../../../CLAUDE.md) - Guia de desenvolvimento do projeto
- [DatabaseManager](../../infrastructure/database/DatabaseManager.ts) - Gerenciador de queries
- [QueryCacheService](../../shared/utils/cache/QueryCacheService.ts) - Cache de queries
- [REFACTORING_QUERIES_SUMMARY.md](../../../REFACTORING_QUERIES_SUMMARY.md) - Guia da refatoração
