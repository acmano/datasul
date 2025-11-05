# Integração com API

## Configuração

### Base URL
Configurada via variável de ambiente:
```bash
REACT_APP_API_URL=http://lordtsapi.lorenzetti.ibe:3002/api
```

### Cliente HTTP
```typescript
// shared/config/api.config.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});
```

## Autenticação

### Bearer Token
Token armazenado em `localStorage` e injetado automaticamente:

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Tratamento de Erro 401
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Padrões de Endpoints

### Busca com Filtros
```
GET /entity/search?param1=value1&param2=value2
```

### Busca por Código
```
GET /entity/{code}
```

### CRUD Operations
```
POST /entity          # Criar
PUT /entity/{code}    # Atualizar
DELETE /entity/{code} # Remover
```

## Estrutura de Service

```typescript
export const entityService = {
  async search(filters: Filters): Promise<Response> {
    try {
      const response = await api.get('/entity/search', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  },

  async getByCode(code: string): Promise<Entity> {
    try {
      const response = await api.get(`/entity/${code}`);
      return response.data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  },
};
```

## Tratamento de Erros

### No Service
```typescript
try {
  const response = await api.get('/endpoint');
  return response.data;
} catch (error) {
  console.error('Erro específico:', error);
  throw error; // Propaga para o componente
}
```

### No Componente
```typescript
try {
  await service.getData();
  message.success('Sucesso!');
} catch (error) {
  message.error('Erro ao carregar dados');
}
```

## Tipos TypeScript

### Request/Response Types
```typescript
// Request
export interface EntityRequest {
  field1: string;
  field2: number;
}

// Response
export interface EntityResponse {
  items: Entity[];
  total: number;
  page: number;
}

// Entidade
export interface Entity {
  codigo: string;
  descricao: string;
  ativo: boolean;
}
```

## Shared Types Package

Tipos compartilhados entre frontend/backend:

```bash
@acmano/lordtsapi-shared-types
```

Garante consistência de contratos de API.

## Best Practices

1. **Sempre use try-catch** nos services
2. **Log erros** para debugging
3. **Tipos explícitos** para request/response
4. **Timeout adequado** (30s padrão)
5. **Feedback ao usuário** via message.error/success
6. **Não exponha tokens** no código

## Debugging

```typescript
// Adicionar interceptor temporário para log
api.interceptors.request.use((config) => {
  console.log('Request:', config);
  return config;
});

api.interceptors.response.use((response) => {
  console.log('Response:', response);
  return response;
});
```

---

**Este documento será expandido conforme novos endpoints são integrados.**

Última atualização: 2025-10-21
