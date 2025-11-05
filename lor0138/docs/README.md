# Documentação Técnica - LOR0138

Bem-vindo à documentação técnica do projeto LOR0138 (Consulta de Itens e Estrutura de Produtos).

## Índice Geral

### Guias de Arquitetura

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Visão geral da arquitetura do sistema
- **[TECH_STACK.md](./TECH_STACK.md)** - Stack tecnológica completa (React, TypeScript, Ant Design, etc)
- **[API_INTEGRATION.md](./API_INTEGRATION.md)** - Padrões de integração com APIs backend

### Guias de Funcionalidades

- **[ESTRUTURA_VISUALIZACOES.md](./ESTRUTURA_VISUALIZACOES.md)** - Sistema de visualização de estruturas (BOM)
  - 5 tipos de visualização (Tabela, Sankey, Árvore, Treemap, Grafo)
  - Drill-down pattern
  - Sistema de cores e gradientes
  - Performance e otimizações
  - Como adicionar novas visualizações

- **[EXPORT_SYSTEM.md](./EXPORT_SYSTEM.md)** - Sistema de exportação de dados
  - Exportação CSV, Excel, PDF
  - Impressão otimizada
  - Builders modulares
  - Como adicionar novos formatos

### Guias de Desenvolvimento

- **[NEW_MODULE_GUIDE.md](./NEW_MODULE_GUIDE.md)** - Como criar novos módulos
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guia de contribuição
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - Histórico de refactorings

---

## Documentação de Visualizações (Estrutura)

O sistema implementa **5 visualizações diferentes** para dados hierárquicos de BOM (Bill of Materials):

| Visualização | Descrição | Casos de Uso |
|--------------|-----------|--------------|
| **Tabela** | Lista hierárquica com virtualização | Análise detalhada, exportação de dados |
| **Sankey** | Diagrama de fluxo direcionado | Visualizar dependências e quantidades |
| **Árvore** | Hierarquia clássica (3 orientações) | Entender estrutura organizacional |
| **Treemap** | Mapa compacto por áreas | Visão geral rápida de composição |
| **Grafo** | Rede com física (force/circular) | Explorar relações complexas |

### Recursos Principais

- **Drill-down**: Navegação hierárquica (duplo clique)
- **Breadcrumb**: Histórico de navegação
- **Processos de Fabricação**: Drawer com operações, tempos, recursos
- **Cache**: Dados em cache para performance
- **Exportação**: CSV, Excel, PDF para todas as visualizações
- **Persistência**: Preferências salvas em localStorage
- **Temas**: Suporte a light/dark mode
- **Performance**: Virtualização, memoização, otimizações

### Arquitetura de Dados

```
API Response (ItemPrincipal)
    ↓
adaptToTree()
    ↓
TreeNode (formato normalizado)
    ↓
┌───────────┬──────────────┬───────────┬────────────┬──────────┐
│           │              │           │            │          │
│ Tabela    │   Sankey     │  Árvore   │  Treemap   │  Grafo   │
│ (Flat)    │ (Nodes+Links)│ (Hierarchy)│(Hierarchy) │(Nodes+L) │
└───────────┴──────────────┴───────────┴────────────┴──────────┘
```

---

## Documentação do Sistema de Exportação

O sistema de exportação é **modular e extensível**, suportando múltiplos formatos:

### Formatos Suportados

| Formato | Biblioteca | Uso |
|---------|-----------|-----|
| **CSV** | Papa Parse | Dados tabulares para Excel/análise |
| **Excel** | xlsx (SheetJS) | Relatórios formatados com múltiplas abas |
| **PDF** | jsPDF | Documentos para impressão/arquivo |
| **Print** | window.print() | Impressão direta do browser |

### Builders Disponíveis

```typescript
// Tabela (FlatNode[])
exportToCSV(flatNodes, filename)
exportToExcel(flatNodes, filename)
exportTableToPDF(flatNodes, filename)
printTable(flatNodes)

// Gráficos ECharts
exportChartToPDF(chartInstance, filename, title)
printChart(chartInstance, title)
```

### Como Adicionar Novo Formato

Consulte [EXPORT_SYSTEM.md](./EXPORT_SYSTEM.md) para guia completo de implementação.

---

## Começando

### Para Novos Desenvolvedores

1. Leia [ARCHITECTURE.md](./ARCHITECTURE.md) para entender a estrutura geral
2. Revise [TECH_STACK.md](./TECH_STACK.md) para conhecer as tecnologias
3. Consulte [NEW_MODULE_GUIDE.md](./NEW_MODULE_GUIDE.md) para criar novos módulos
4. Siga [CONTRIBUTING.md](./CONTRIBUTING.md) para contribuir

### Para Claude (IA Assistant)

Quando iniciar uma nova sessão:

1. **Contexto de Estrutura**: Consulte [ESTRUTURA_VISUALIZACOES.md](./ESTRUTURA_VISUALIZACOES.md)
   - Tipos de dados (ItemPrincipal → TreeNode → FlatNode)
   - Como cada visualização funciona
   - Padrão drill-down
   - Sistema de cores

2. **Contexto de Exportação**: Consulte [EXPORT_SYSTEM.md](./EXPORT_SYSTEM.md)
   - Builders disponíveis
   - Como adicionar formatos
   - Padrões de implementação

3. **Arquitetura Geral**: Consulte [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Estrutura de pastas
   - Padrões de código
   - Convenções

---

## Estrutura de Pastas Documentadas

```
src/modules/engenharia/estrutura/
├── components/          # Componentes de visualização
│   ├── Main.tsx        # Orquestrador principal
│   ├── TabelaItensVirtualized.tsx
│   ├── Sankey.tsx
│   ├── Arvore.tsx
│   ├── Treemap.tsx
│   └── Grafo.tsx
│
├── utils/              # Utilitários
│   ├── dataProcessing.ts   # Transformações de dados
│   ├── colorUtils.ts       # Sistema de cores
│   ├── chartBuilders.ts    # Construtores ECharts
│   └── exportUtils.ts      # Exportação CSV/Excel/PDF
│
├── types/              # TypeScript types
│   └── estrutura.types.ts
│
└── services/           # Comunicação com API
    └── estrutura.service.ts
```

---

## Changelog da Documentação

| Data | Documento | Descrição |
|------|-----------|-----------|
| 2025-10-22 | ESTRUTURA_VISUALIZACOES.md | Criação inicial - documentação completa das 5 visualizações |
| 2025-10-22 | EXPORT_SYSTEM.md | Documentação do sistema de exportação |
| 2025-10-21 | NEW_MODULE_GUIDE.md | Guia de criação de módulos |
| 2025-10-21 | ARCHITECTURE.md | Visão geral da arquitetura |
| 2025-10-21 | TECH_STACK.md | Stack tecnológica |

---

## Contribuindo com a Documentação

Ao adicionar novos recursos ou módulos:

1. Atualize a documentação relevante
2. Adicione exemplos de código
3. Inclua diagramas ASCII quando útil
4. Mantenha este README atualizado
5. Adicione entrada no Changelog

---

**Última atualização**: 2025-10-22
**Mantido por**: Equipe de Desenvolvimento
