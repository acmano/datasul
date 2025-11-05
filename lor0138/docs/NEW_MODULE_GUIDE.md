# Guia para Criação de Novos Módulos

## Visão Geral

Este guia fornece um passo a passo completo para criar novos módulos na aplicação LOR0138, seguindo os padrões arquiteturais e boas práticas estabelecidas no projeto.

---

## Índice

1. [Estrutura de Diretórios](#estrutura-de-diretórios)
2. [Passo a Passo](#passo-a-passo)
3. [Exemplo Prático](#exemplo-prático)
4. [Padrões e Convenções](#padrões-e-convenções)
5. [Checklist de Criação](#checklist-de-criação)

---

## Estrutura de Diretórios

### Anatomia de um Módulo

```
src/modules/{moduleName}/
├── components/                    # Componentes React do módulo
│   ├── Main.tsx                   # Componente principal (Container)
│   ├── {Feature}Form.tsx          # Componentes de formulário
│   ├── {Feature}Table.tsx         # Componentes de tabela
│   └── {Feature}Details.tsx       # Componentes de detalhes
│
├── services/                      # Camada de serviços (API)
│   ├── {entity}.service.ts        # Service para entidade principal
│   └── {relatedEntity}.service.ts # Services relacionados
│
├── types/                         # Definições TypeScript
│   ├── index.ts                   # Barrel export de tipos
│   ├── {entity}.types.ts          # Tipos da entidade principal
│   └── {feature}.types.ts         # Tipos específicos de features
│
├── hooks/                         # Custom hooks do módulo
│   ├── use{Feature}Data.ts        # Hook para busca de dados
│   ├── use{Feature}Form.ts        # Hook para lógica de formulário
│   └── use{Feature}Selection.ts   # Hook para seleção de items
│
├── utils/                         # Utilitários específicos do módulo
│   ├── export/                    # Utilitários de exportação
│   │   ├── csv.ts                 # Exportação para CSV
│   │   ├── xlsx.ts                # Exportação para Excel
│   │   ├── pdf.ts                 # Exportação para PDF
│   │   └── print.ts               # Impressão
│   ├── validation.ts              # Validações específicas
│   └── formatters.ts              # Formatadores de dados
│
└── constants/                     # Constantes do módulo
    └── {feature}.constants.ts     # Constantes específicas
```

---

## Passo a Passo

### 1. Criar Estrutura de Diretórios

```bash
# A partir do diretório raiz do projeto
cd src/modules

# Criar estrutura do módulo (exemplo: produto)
mkdir -p produto/{components,services,types,hooks,utils/export,constants}
```

### 2. Definir Tipos TypeScript

**Arquivo**: `src/modules/produto/types/produto.types.ts`

```typescript
/**
 * Representa um produto no sistema
 */
export interface Produto {
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
  ativo: boolean;
  dataCadastro: string;
}

/**
 * Filtros para busca de produtos
 */
export interface ProdutoSearchFilters {
  codigo?: string;
  descricao?: string;
  ativo?: boolean;
}

/**
 * Resposta da API de busca de produtos
 */
export interface ProdutoSearchResponse {
  items: Produto[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Request para criar/atualizar produto
 */
export interface ProdutoRequest {
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
  ativo: boolean;
}
```

**Arquivo**: `src/modules/produto/types/index.ts` (Barrel Export)

```typescript
export * from './produto.types';
```

### 3. Criar Service Layer

**Arquivo**: `src/modules/produto/services/produto.service.ts`

```typescript
import api from '@shared/config/api.config';
import {
  Produto,
  ProdutoSearchFilters,
  ProdutoSearchResponse,
  ProdutoRequest
} from '../types';

/**
 * Service para operações de produto
 */
export const produtoService = {
  /**
   * Busca produtos com filtros
   * @param filters - Filtros de busca
   * @returns Promise com resultados da busca
   */
  async search(filters: ProdutoSearchFilters): Promise<ProdutoSearchResponse> {
    try {
      const response = await api.get('/produto/search', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  /**
   * Busca produto por código
   * @param codigo - Código do produto
   * @returns Promise com dados do produto
   */
  async getByCode(codigo: string): Promise<Produto> {
    try {
      const response = await api.get(`/produto/${codigo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw error;
    }
  },

  /**
   * Cria novo produto
   * @param data - Dados do produto
   * @returns Promise com produto criado
   */
  async create(data: ProdutoRequest): Promise<Produto> {
    try {
      const response = await api.post('/produto', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },

  /**
   * Atualiza produto existente
   * @param codigo - Código do produto
   * @param data - Dados atualizados
   * @returns Promise com produto atualizado
   */
  async update(codigo: string, data: Partial<ProdutoRequest>): Promise<Produto> {
    try {
      const response = await api.put(`/produto/${codigo}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },

  /**
   * Remove produto
   * @param codigo - Código do produto
   * @returns Promise void
   */
  async delete(codigo: string): Promise<void> {
    try {
      await api.delete(`/produto/${codigo}`);
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      throw error;
    }
  },
};
```

### 4. Criar Custom Hook

**Arquivo**: `src/modules/produto/hooks/useProdutoData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { produtoService } from '../services/produto.service';
import { Produto, ProdutoSearchFilters } from '../types';

/**
 * Hook customizado para gerenciar dados de produtos
 */
export const useProdutoData = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  /**
   * Busca produtos com filtros
   */
  const searchProdutos = useCallback(async (filters: ProdutoSearchFilters) => {
    try {
      setLoading(true);
      const response = await produtoService.search(filters);
      setProdutos(response.items);
      message.success(`${response.total} produto(s) encontrado(s)`);
    } catch (error) {
      message.error('Erro ao buscar produtos');
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega produto por código
   */
  const loadProduto = useCallback(async (codigo: string) => {
    try {
      setLoading(true);
      const produto = await produtoService.getByCode(codigo);
      setSelectedProduto(produto);
    } catch (error) {
      message.error('Erro ao carregar produto');
      setSelectedProduto(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpa seleção
   */
  const clearSelection = useCallback(() => {
    setSelectedProduto(null);
    setProdutos([]);
  }, []);

  return {
    produtos,
    loading,
    selectedProduto,
    searchProdutos,
    loadProduto,
    clearSelection,
  };
};
```

### 5. Criar Componentes

#### 5.1 Componente Principal (Container)

**Arquivo**: `src/modules/produto/components/Main.tsx`

```typescript
import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import ProdutoSearchForm from './ProdutoSearchForm';
import ProdutoTable from './ProdutoTable';
import ProdutoDetails from './ProdutoDetails';
import { useProdutoData } from '../hooks/useProdutoData';

const { TabPane } = Tabs;

/**
 * Componente principal do módulo de produtos
 */
const ProdutoMain: React.FC = () => {
  const {
    produtos,
    loading,
    selectedProduto,
    searchProdutos,
    loadProduto,
    clearSelection,
  } = useProdutoData();

  const [activeTab, setActiveTab] = useState('search');

  const handleProdutoSelect = (codigo: string) => {
    loadProduto(codigo);
    setActiveTab('details');
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Busca" key="search">
            <ProdutoSearchForm onSearch={searchProdutos} loading={loading} />
            <ProdutoTable
              produtos={produtos}
              loading={loading}
              onSelect={handleProdutoSelect}
            />
          </TabPane>

          <TabPane tab="Detalhes" key="details" disabled={!selectedProduto}>
            {selectedProduto && (
              <ProdutoDetails produto={selectedProduto} />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProdutoMain;
```

#### 5.2 Componente de Formulário

**Arquivo**: `src/modules/produto/components/ProdutoSearchForm.tsx`

```typescript
import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Switch } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ProdutoSearchFilters } from '../types';

interface ProdutoSearchFormProps {
  onSearch: (filters: ProdutoSearchFilters) => void;
  loading: boolean;
}

/**
 * Formulário de busca de produtos
 */
const ProdutoSearchForm: React.FC<ProdutoSearchFormProps> = ({
  onSearch,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: ProdutoSearchFilters) => {
    onSearch(values);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item label="Código" name="codigo">
            <Input placeholder="Digite o código" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Descrição" name="descricao">
            <Input placeholder="Digite a descrição" />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item label="Ativo" name="ativo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={loading}
          >
            Buscar
          </Button>
        </Col>
        <Col>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            Limpar
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default ProdutoSearchForm;
```

#### 5.3 Componente de Tabela

**Arquivo**: `src/modules/produto/components/ProdutoTable.tsx`

```typescript
import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Produto } from '../types';

interface ProdutoTableProps {
  produtos: Produto[];
  loading: boolean;
  onSelect: (codigo: string) => void;
}

/**
 * Tabela de produtos
 */
const ProdutoTable: React.FC<ProdutoTableProps> = ({
  produtos,
  loading,
  onSelect,
}) => {
  const columns: ColumnsType<Produto> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      sorter: (a, b) => a.descricao.localeCompare(b.descricao),
    },
    {
      title: 'Unidade',
      dataIndex: 'unidade',
      key: 'unidade',
      width: 100,
    },
    {
      title: 'Preço',
      dataIndex: 'preco',
      key: 'preco',
      width: 120,
      render: (preco: number) => `R$ ${preco.toFixed(2)}`,
      sorter: (a, b) => a.preco - b.preco,
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      render: (ativo: boolean) => (ativo ? 'Ativo' : 'Inativo'),
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (value, record) => record.ativo === value,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={produtos}
      loading={loading}
      rowKey="codigo"
      onRow={(record) => ({
        onClick: () => onSelect(record.codigo),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Total: ${total} produtos`,
      }}
      scroll={{ y: 'calc(100vh - 400px)' }}
    />
  );
};

export default ProdutoTable;
```

### 6. Criar Utilitários de Exportação

**Arquivo**: `src/modules/produto/utils/export/csv.ts`

```typescript
import { Produto } from '../../types';

/**
 * Exporta produtos para CSV
 */
export const exportProdutosToCSV = (produtos: Produto[], filename: string = 'produtos') => {
  const headers = ['Código', 'Descrição', 'Unidade', 'Preço', 'Status'];

  const rows = produtos.map((produto) => [
    produto.codigo,
    produto.descricao,
    produto.unidade,
    produto.preco.toFixed(2),
    produto.ativo ? 'Ativo' : 'Inativo',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.join(';')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
```

### 7. Integrar no Menu Principal

**Arquivo**: `src/layouts/MenuLateral.tsx`

```typescript
// Adicionar novo item ao menu
const menuItems = [
  {
    key: '1',
    icon: <DatabaseOutlined />,
    label: 'Dados Mestres',
  },
  {
    key: '2',
    icon: <ShoppingOutlined />,  // Novo item
    label: 'Produtos',
  },
  // ... outros itens
];
```

**Arquivo**: `src/App.tsx`

```typescript
import ProdutoMain from './modules/produto/components/Main';

// No componente App
{selectedMenuKey === '2' && <ProdutoMain />}
```

---

## Exemplo Prático

Veja um exemplo completo de módulo já implementado:

```
src/modules/item/
├── search/
│   ├── components/
│   │   ├── SearchForm.tsx
│   │   ├── ResultsTable.tsx
│   │   └── ResultsTabs.tsx
│   ├── services/
│   │   └── itemSearch.service.ts
│   └── types/
│       └── search.types.ts
│
└── dadosCadastrais/
    ├── components/
    │   └── Main.tsx
    ├── informacoesGerais/
    │   ├── components/
    │   │   └── Main.tsx
    │   ├── services/
    │   │   └── itemInformacoesGerais.service.ts
    │   └── types/
    │       └── index.ts
    └── ... (outras abas)
```

---

## Padrões e Convenções

### Nomenclatura

1. **Arquivos de Componentes**: PascalCase
   - `ProdutoMain.tsx`, `SearchForm.tsx`

2. **Arquivos de Service**: camelCase + `.service.ts`
   - `produto.service.ts`, `itemSearch.service.ts`

3. **Arquivos de Types**: camelCase + `.types.ts`
   - `produto.types.ts`, `search.types.ts`

4. **Arquivos de Hooks**: camelCase + prefixo `use`
   - `useProdutoData.ts`, `useSearchFilters.ts`

5. **Variáveis e Funções**: camelCase
   - `searchProdutos`, `handleSubmit`, `isLoading`

6. **Interfaces**: PascalCase
   - `Produto`, `ProdutoSearchFilters`, `ProdutoSearchResponse`

7. **Constantes**: UPPER_SNAKE_CASE
   - `MAX_ITEMS_PER_PAGE`, `DEFAULT_TIMEOUT`

### Organização de Código

1. **Imports**: Organizar por categoria
   ```typescript
   // Bibliotecas externas
   import React, { useState } from 'react';
   import { Form, Input } from 'antd';

   // Paths aliases
   import { api } from '@shared/config/api.config';

   // Imports relativos
   import { Produto } from '../types';
   import { produtoService } from '../services/produto.service';
   ```

2. **JSDoc Comments**: Documentar funções públicas
   ```typescript
   /**
    * Busca produtos com filtros
    * @param filters - Filtros de busca
    * @returns Promise com resultados
    */
   async search(filters: ProdutoSearchFilters): Promise<ProdutoSearchResponse>
   ```

3. **Tratamento de Erros**: Sempre usar try-catch em services
   ```typescript
   try {
     const response = await api.get('/endpoint');
     return response.data;
   } catch (error) {
     console.error('Erro:', error);
     throw error;
   }
   ```

### TypeScript

1. **Tipagem Explícita**: Sempre definir tipos de retorno
   ```typescript
   const getProduto = (codigo: string): Promise<Produto> => {...}
   ```

2. **Interfaces vs Types**: Preferir interfaces para objetos
   ```typescript
   // ✅ Bom
   interface Produto { ... }

   // ⚠️ Use type para unions/intersections
   type Status = 'ativo' | 'inativo';
   ```

3. **Evitar `any`**: Usar `unknown` quando tipo é desconhecido
   ```typescript
   // ❌ Evitar
   const data: any = response.data;

   // ✅ Preferir
   const data: unknown = response.data;
   ```

---

## Checklist de Criação

### Antes de Começar
- [ ] Definir escopo e responsabilidades do módulo
- [ ] Identificar entidades e relacionamentos
- [ ] Mapear endpoints da API necessários
- [ ] Listar componentes visuais necessários

### Estrutura
- [ ] Criar estrutura de diretórios
- [ ] Configurar barrel exports (`index.ts`)

### Types
- [ ] Definir interfaces de entidades
- [ ] Definir tipos de Request/Response
- [ ] Definir tipos de filtros e parâmetros
- [ ] Adicionar JSDoc comments

### Services
- [ ] Implementar métodos CRUD básicos
- [ ] Adicionar tratamento de erros
- [ ] Adicionar JSDoc comments
- [ ] Testar chamadas de API

### Hooks
- [ ] Criar hooks para lógica reutilizável
- [ ] Implementar memoização onde apropriado
- [ ] Documentar hooks customizados

### Componentes
- [ ] Criar componente principal (Main)
- [ ] Criar componentes de formulário
- [ ] Criar componentes de tabela/lista
- [ ] Criar componentes de detalhes
- [ ] Aplicar styles consistentes

### Utilitários
- [ ] Implementar exportação CSV
- [ ] Implementar exportação Excel
- [ ] Implementar exportação PDF
- [ ] Implementar impressão

### Integração
- [ ] Adicionar rota/item ao menu
- [ ] Integrar com App.tsx
- [ ] Testar navegação

### Testes
- [ ] Criar testes unitários para services
- [ ] Criar testes para hooks
- [ ] Criar testes de componentes
- [ ] Verificar cobertura de testes

### Documentação
- [ ] Adicionar README do módulo (se necessário)
- [ ] Documentar componentes complexos
- [ ] Atualizar documentação principal

### Code Quality
- [ ] Executar `npm run lint`
- [ ] Executar `npm run format`
- [ ] Executar `npm run type-check`
- [ ] Code review

---

## Recursos Adicionais

### Path Aliases Disponíveis

```typescript
import Component from '@shared/components/Component';
import { service } from '@modules/produto/services/produto.service';
import Layout from '@layouts/MenuLateral';
```

### Componentes Compartilhados

Utilize componentes já existentes em `src/shared/components/`:
- `ExportButtons` - Botões de exportação
- `TabLayoutWrapper` - Wrapper para abas com loading/error
- `BarcodeDisplay` - Exibição de código de barras

### Hooks Compartilhados

- `useKeyboardShortcuts` - Atalhos de teclado
- (Adicione novos hooks compartilhados em `src/shared/hooks/`)

---

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação existente em `/docs`
2. Revise módulos similares já implementados
3. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 2025-10-21
**Mantido por**: Equipe de Desenvolvimento LOR0138
