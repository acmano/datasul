# Shared Utils

Utilitários compartilhados entre módulos do lordtsapi.

## Service Helpers

```typescript
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';

// Exemplo de uso
static async getInformacoesGerais(itemCodigo: string) {
  return withErrorHandling(
    async () => {
      const dados = await Repository.getItemMaster(itemCodigo);
      
      validateEntityExists(
        dados,
        ItemNotFoundError,
        itemCodigo,
        'Item'
      );
      
      return mapToResponse(dados);
    },
    {
      entityName: 'Item',
      entityCode: itemCodigo,
      operationName: 'buscar informações gerais'
    },
    ItemNotFoundError
  );
}
```

## Repository Helpers

```typescript
import { 
  executeAndGetFirst,
  invalidateCachePatterns,
  buildOpenQuerySelect,
  createCodigoParam,
  isValidCode
} from '@shared/utils/repository';

// Query helper
const query = buildOpenQuerySelect({
  linkServer: 'PRD_EMS2EMP',
  table: 'pub.item',
  columns: ['item."it-codigo" as itemCodigo', 'item."desc-item" as itemDescricao'],
  whereColumn: 'it-codigo',
  paramName: 'paramItemCodigo'
});

// Executar com cache
const result = await executeAndGetFirst(
  query,
  [createCodigoParam('paramItemCodigo', itemCodigo)],
  QueryCacheService.withItemCache
);

// Validar código
if (isValidCode(data.familiaCodigo)) {
  // buscar família
}

// Invalidar cache
await invalidateCachePatterns(['item:*', 'familia:*']);
```

## Vantagens

- ✓ Reduz código duplicado
- ✓ Padroniza error handling
- ✓ Facilita manutenção
- ✓ Logging automático
- ✓ Type-safe
