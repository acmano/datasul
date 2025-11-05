# Stack Tecnológica - LOR0138

## Visão Geral

Este documento descreve detalhadamente toda a stack tecnológica utilizada no frontend da aplicação LOR0138, incluindo frameworks, bibliotecas, ferramentas de desenvolvimento e suas respectivas versões.

---

## Core Technologies

### Runtime & Framework
- **React** `19.2.0`
  - Biblioteca principal para construção de interfaces
  - Utiliza React Hooks para gerenciamento de estado
  - JSX transform moderno (react-jsx)

- **React DOM** `19.2.0`
  - Renderização de componentes React no DOM
  - Suporte a modo concorrente

### Linguagem
- **TypeScript** `4.9.5`
  - Tipagem estática para JavaScript
  - Configuração strict mode habilitada
  - Target: ES5 para máxima compatibilidade

---

## UI Framework & Components

### Ant Design Ecosystem
- **Ant Design (antd)** `5.27.4`
  - Framework de componentes UI completo
  - Suporte a temas (light/dark mode)
  - Locale: Português do Brasil (pt_BR)
  - Componentes utilizados:
    - Layout (Header, Sider, Content)
    - Form & Input components
    - Table com seleção e ordenação
    - Menu & Navigation
    - Modal & Message feedback
    - Card, Tabs, Tooltip, etc.

- **Ant Design Icons** `6.1.0`
  - Biblioteca de ícones oficial do Ant Design
  - Ícones tree-shaking compatíveis
  - Suporte a ícones personalizados

---

## HTTP & Data Fetching

### API Integration
- **Axios** `1.12.2`
  - Cliente HTTP promise-based
  - Interceptors para autenticação automática
  - Timeout configurado (30s)
  - Base URL configurável via variável de ambiente

### Shared Types
- **@acmano/lordtsapi-shared-types** `^1.0.0`
  - Pacote privado no GitHub Packages
  - Tipos TypeScript compartilhados entre frontend/backend
  - Garante consistência de contratos de API

---

## File Handling & Export

### Document Generation
- **jsPDF** `3.0.3`
  - Geração de documentos PDF no cliente
  - Utilizado para exportação de relatórios

- **jsPDF-AutoTable** `5.0.2`
  - Plugin para criação de tabelas em PDFs
  - Formatação automática de dados tabulares

### Spreadsheet Export
- **xlsx** `0.18.5` (SheetJS)
  - Leitura e escrita de planilhas Excel
  - Suporte a formatos .xlsx, .xls, .csv
  - Exportação de dados de tabelas

### File Download
- **file-saver** `2.0.5`
  - Utilitário para download de arquivos no navegador
  - Suporte cross-browser para salvar arquivos
  - Utilizado em conjunto com jsPDF e xlsx

---

## Build Tools & Development

### Build System
- **Create React App (react-scripts)** `5.0.1`
  - Configuração zero de webpack, Babel, ESLint
  - Hot Module Replacement (HMR)
  - Otimizações de produção automáticas
  - Code splitting e tree shaking

### Bundler (abstrato via CRA)
- **webpack** `5.x` (via react-scripts)
  - Module bundler
  - Asset optimization
  - Development server

### Transpiler (abstrato via CRA)
- **Babel** `7.x` (via react-scripts)
  - Transpilação de JSX e TypeScript
  - Polyfills automáticos baseados em browserslist
  - Presets: @babel/preset-env, @babel/preset-typescript

---

## Code Quality & Formatting

### Linting
- **ESLint** (via react-scripts)
  - Análise estática de código
  - Configuração customizada em `.eslintrc.json`
  - Plugins:
    - `eslint-config-react-app` (CRA defaults)
    - `eslint-plugin-react-hooks` `7.0.0`
    - `eslint-config-prettier` `10.1.8`

### Code Formatting
- **Prettier** `3.6.2`
  - Formatação automática de código
  - Configuração em `.prettierrc`
  - Integração com ESLint via eslint-config-prettier

### Git Hooks
- **Husky** `9.1.7`
  - Git hooks automation
  - Pre-commit validation
  - Configurado em `.husky/`

- **lint-staged** `16.2.5`
  - Executa linters apenas em arquivos staged
  - Formatação automática antes do commit
  - Performance otimizada

---

## Testing

### Testing Framework
- **Jest** (via react-scripts)
  - Test runner e assertion library
  - Suporte a mocking e spies
  - Coverage reports

### React Testing
- **@testing-library/react** `16.3.0`
  - Testes de componentes React
  - API focada em comportamento do usuário
  - Renderização e queries de componentes

- **@testing-library/dom** `10.4.1`
  - Queries e utilitários para testes de DOM
  - Base para React Testing Library

- **@testing-library/jest-dom** `6.9.1`
  - Matchers customizados para Jest
  - Assertions específicas para DOM
  - Ex: `toBeInTheDocument()`, `toHaveClass()`

- **@testing-library/user-event** `13.5.0`
  - Simulação de interações de usuário
  - Eventos de mouse, teclado, etc.

---

## Performance & Metrics

### Web Vitals
- **web-vitals** `2.1.4`
  - Métricas de performance web
  - Core Web Vitals (LCP, FID, CLS)
  - Integração com ferramentas de analytics

---

## TypeScript Type Definitions

### Type Packages
- **@types/jest** `27.5.2`
- **@types/node** `16.18.126`
- **@types/react** `19.2.2`
- **@types/react-dom** `19.2.1`
- **@types/file-saver** `2.0.7`

---

## Environment & Configuration

### Environment Variables
Configuradas em `.env`:
```bash
REACT_APP_API_URL=http://lordtsapi.lorenzetti.ibe:3002/api
REACT_APP_NAME=LOR0138
REACT_APP_VERSION=2.0.0
```

### Browser Compatibility
Definido em `package.json` > `browserslist`:

**Produção:**
- \>0.2% market share
- Browsers não mortos
- Exclusão: Opera Mini

**Desenvolvimento:**
- Última versão do Chrome
- Última versão do Firefox
- Última versão do Safari

---

## Architecture Patterns

### State Management
- **React Hooks**
  - `useState` - Estado local
  - `useEffect` - Efeitos colaterais
  - `useCallback` - Memoização de funções
  - `useRef` - Referências persistentes

### Custom Hooks
- `useKeyboardShortcuts` - Gerenciamento de atalhos de teclado

### Styling Approach
- **Inline Styles** - Estilos dinâmicos baseados em tema
- **CSS-in-JS** (via `<style>` tags) - Estilos complexos com seletores
- **Global CSS** - Resets e estilos base
- **Ant Design Theme** - Tokens de design system

---

## Project Structure

```
src/
├── layouts/           # Componentes de layout (MenuLateral)
├── modules/           # Módulos de features
│   └── item/          # Módulo de gerenciamento de itens
│       ├── search/    # Busca de itens
│       └── dadosCadastrais/  # Dados cadastrais (abas)
└── shared/            # Código compartilhado
    ├── components/    # Componentes reutilizáveis
    ├── services/      # Camada de serviços (API)
    ├── hooks/         # Custom React hooks
    ├── config/        # Configurações (API, etc.)
    └── utils/         # Utilitários e helpers
```

---

## Package Management

### Registry
- **NPM** - Gerenciador de pacotes padrão
- **GitHub Packages** - Para pacotes privados (@acmano/*)

### Configuração (.npmrc)
```bash
@acmano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

---

## Build & Deployment

### Scripts Disponíveis
```json
{
  "start": "react-scripts start",          // Dev server (porta 3000)
  "build": "react-scripts build",          // Build de produção
  "test": "react-scripts test",            // Test runner (watch mode)
  "lint": "eslint src --ext .ts,.tsx",     // Linting
  "lint:fix": "eslint src --fix",          // Auto-fix linting
  "format": "prettier --write \"src/**\"", // Formatação
  "type-check": "tsc --noEmit"             // Type checking
}
```

### Build Output
- **Diretório**: `/build`
- **Otimizações**:
  - Minificação (Terser)
  - Code splitting
  - Tree shaking
  - Asset hashing
  - Source maps

---

## Future Considerations

### Potenciais Adições (em análise)
- **React Router v6** - Roteamento baseado em URL
- **Zustand ou Jotai** - State management leve (se necessário)
- **React Query** - Cache e sincronização de dados do servidor
- **Styled Components** - CSS-in-JS mais robusto
- **Storybook** - Documentação de componentes
- **Cypress ou Playwright** - Testes E2E
- **Vite** - Build tool mais rápido (migração de CRA)

---

## Versioning

**Versão atual**: `0.1.0` (em desenvolvimento)
**Versão alvo pós-refatoração**: `2.0.0`

---

## Manutenção

### Atualizações Regulares
- Executar `npm audit` mensalmente
- Verificar vulnerabilidades de segurança
- Atualizar dependências patch/minor regularmente
- Testar thoroughly antes de major upgrades

### Deprecation Notices
- **Create React App** está em manutenção limitada
  - Considerar migração futura para Vite ou Next.js

---

**Última atualização**: 2025-10-21
**Mantido por**: Equipe de Desenvolvimento LOR0138
