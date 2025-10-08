# @datasul/shared-types

Types, constants, validators e utils compartilhados entre:
- lordtsapi (backend)
- lor0138 (frontend - futuro)
- Outros frontends

## Estrutura

```
src/
├── types/
│   ├── api/          # Request/Response types
│   └── entities/     # Domain entities
├── constants/        # Constantes compartilhadas
├── validators/       # Joi schemas
├── enums/           # Enums
└── utils/           # Funções puras
```

## Uso

```typescript
// Em lordtsapi ou frontends
import { ItemType, API_VERSION } from '@datasul/shared-types';
```

## Build

```bash
npm run build        # Compila para dist/
npm run watch       # Watch mode
```
