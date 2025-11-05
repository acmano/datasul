# Arquitetura do Projeto LOR0138

## Visão Geral

LOR0138 segue uma **arquitetura modular baseada em features**, combinando padrões de Clean Architecture com a simplicidade de React Hooks.

## Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Components, Layouts, UI Logic)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Application Layer              │
│  (Hooks, State Management, Contexts)    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           Service Layer                 │
│  (API Integration, Data Fetching)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Infrastructure Layer            │
│  (Axios Config, Types, Constants)       │
└─────────────────────────────────────────┘
```

## Estrutura Modular

### Feature Modules
Cada módulo é auto-contido e segue a estrutura:

```
modules/{feature}/
├── components/     # Componentes React
├── services/       # Lógica de API
├── types/          # TypeScript types
├── hooks/          # Custom hooks
├── utils/          # Utilitários
└── constants/      # Constantes
```

### Shared Layer
Recursos compartilhados entre módulos:

```
shared/
├── components/     # Componentes reutilizáveis
├── services/       # Services comuns
├── hooks/          # Hooks globais
├── config/         # Configurações
└── utils/          # Utilitários globais
```

## Padrões Arquiteturais

### 1. Container/Presenter Pattern
- **Container (Main.tsx)**: Lógica de negócio, state management
- **Presenter**: Componentes puros de apresentação

### 2. Service Layer Pattern
Abstração de chamadas de API:
```typescript
export const entityService = {
  async getAll(): Promise<Entity[]> { },
  async getByCode(code: string): Promise<Entity> { },
};
```

### 3. Custom Hooks Pattern
Encapsulamento de lógica reutilizável:
```typescript
export const useEntityData = () => {
  const [data, setData] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  // ... lógica
  return { data, loading, fetchData };
};
```

### 4. Pre-fetching Pattern
Carregamento paralelo para zero latência:
```typescript
const results = await Promise.allSettled([
  service1.get(code),
  service2.get(code),
]);
```

## Gerenciamento de Estado

### Estratégia Atual
- **Local State**: useState para estado de componente
- **Lifted State**: Estado compartilhado elevado ao pai
- **Context API**: Para estado global (em implementação)

### Fluxo de Dados
```
App.tsx (Root State)
  ├─> Search Filters
  ├─> Search Results
  └─> Selected Item
        └─> DadosCadastraisMain
              ├─> Pre-fetched Data
              └─> Tab Components
```

## Integração com API

### Configuração
```typescript
// shared/config/api.config.ts
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000,
});

// Request Interceptor: Auto-inject token
// Response Interceptor: Handle 401
```

### Convenções de Endpoints
- `GET /entity/search?params` - Busca com filtros
- `GET /entity/{code}` - Busca por código
- `POST /entity` - Criar
- `PUT /entity/{code}` - Atualizar
- `DELETE /entity/{code}` - Remover

## Otimizações de Performance

### Implementadas
- Data pre-fetching para tabs
- Auto-select first result
- Keyboard shortcuts
- Responsive layouts

### Em Desenvolvimento
- React.memo() para componentes puros
- useMemo/useCallback estratégico
- Lazy loading de componentes
- Code splitting por rota
- Virtualização de tabelas grandes

## Styling Strategy

### Abordagem Atual
- **Inline Styles**: Estilos dinâmicos
- **CSS-in-JS**: `<style>` tags para seletores complexos
- **Ant Design Theme**: Design tokens
- **Global CSS**: Resets básicos

### Abordagem Futura (pós-refatoração)
- Theme tokens centralizados
- Styled components ou CSS Modules
- Estilos reutilizáveis

## Roteamento

### Atual
Navegação baseada em estado (sem router)

### Planejado
React Router v6 com estrutura:
```
/
/item/search
/item/:code/base
/item/:code/dimensoes
/item/:code/planejamento
/item/:code/manufatura
/item/:code/fiscal
/item/:code/suprimentos
```

## Testing Strategy

### Pirâmide de Testes
```
        /\
       /E2E\
      /──────\
     /  Integ  \
    /────────────\
   /   Unit Tests  \
  /──────────────────\
```

- **Unit**: Services, utilities, hooks
- **Integration**: Component + hook + service
- **E2E**: User flows críticos

## Code Quality

### Enforcements
- TypeScript strict mode
- ESLint + Prettier
- Pre-commit hooks (Husky)
- Type checking no CI/CD

### Convenções
- camelCase (sem underscores)
- JSDoc para funções públicas
- Imports organizados
- Componentes < 300 linhas

## Dependências

### Princípios
- Minimizar dependências externas
- Preferir bibliotecas mantidas
- Avaliar bundle size impact
- Documentar decisões arquiteturais

---

**Este documento será atualizado conforme a refatoração progride.**

Última atualização: 2025-10-21
