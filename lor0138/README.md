# LOR0138 - Sistema de Consulta ERP Datasul

## Visão Geral

LOR0138 é uma aplicação frontend moderna para consulta de tabelas, dados e informações do ERP Datasul. Desenvolvida com React e TypeScript, oferece uma interface intuitiva e responsiva para gerenciamento de dados mestres, engenharias, PCP, manufatura, suprimentos e informações fiscais.

**Versão**: 2.0.0
**Stack Principal**: React 19.2 + TypeScript 4.9 + Ant Design 5.27

---

## Características Principais

- Interface moderna e responsiva com Ant Design
- Suporte a tema claro/escuro
- Navegação por atalhos de teclado
- Exportação de dados (CSV, Excel, PDF)
- Busca avançada com múltiplos filtros
- Carregamento otimizado de dados (pre-fetching)
- TypeScript com tipagem estrita
- Testes automatizados
- Code quality enforcement (ESLint, Prettier, Husky)

---

## Início Rápido

### Pré-requisitos

- **Node.js**: 16.x ou superior
- **NPM**: 8.x ou superior
- **Git**: Para controle de versão
- **GITHUB_TOKEN**: Para acesso ao pacote privado @acmano/lordtsapi-shared-types

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd lor0138
```

#### Configuração do GitHub Packages

Este projeto usa o pacote privado `@acmano/lordtsapi-shared-types` hospedado no GitHub Packages. Para instalar as dependências, você precisa configurar a autenticação:

##### 1. Crie um Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Configure o token:
   - **Note**: "NPM Package Read Access" (ou nome descritivo)
   - **Expiration**: Escolha a validade (recomendado: 90 dias)
   - **Scopes**: Marque apenas `read:packages`
4. Clique em "Generate token" e copie o token gerado

##### 2. Configure o arquivo .npmrc local

```bash
# Copie o arquivo de exemplo
cp .npmrc.example .npmrc

# Edite o .npmrc e substitua ${GITHUB_TOKEN} pelo seu token
# Exemplo de conteúdo final:
# @acmano:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=ghp_SEU_TOKEN_AQUI
# legacy-peer-deps=true
```

**IMPORTANTE:**
- NUNCA commit o arquivo `.npmrc` (ele já está no .gitignore)
- Mantenha seu token seguro e privado
- Renove o token antes do vencimento

##### 3. Instale as dependências

```bash
npm install
```

### Configuração

1. Copie o arquivo `.env.example` para `.env` (se disponível)
2. Configure as variáveis de ambiente:

```bash
REACT_APP_API_URL=http://lordtsapi.lorenzetti.ibe:3002/api
REACT_APP_NAME=LOR0138
REACT_APP_VERSION=2.0.0
```

### Executar Desenvolvimento

```bash
# Inicia o servidor de desenvolvimento
npm start

# Aplicação estará disponível em http://localhost:3000
```

### Build de Produção

```bash
# Cria build otimizado
npm run build

# Build estará em /build
```

---

## Scripts Disponíveis

### Desenvolvimento

```bash
npm start              # Inicia servidor de desenvolvimento
npm test               # Executa testes em modo watch
npm run build          # Cria build de produção
```

### Code Quality

```bash
npm run lint           # Verifica problemas de linting
npm run lint:fix       # Corrige problemas de linting automaticamente
npm run format         # Formata código com Prettier
npm run format:check   # Verifica formatação sem alterar arquivos
npm run type-check     # Verifica tipagem TypeScript
```

---

## Estrutura do Projeto

```
lor0138/
├── public/                 # Arquivos estáticos
│   ├── images/            # Imagens e ícones
│   └── index.html         # HTML template
│
├── src/                   # Código fonte
│   ├── App.tsx            # Componente raiz
│   ├── index.tsx          # Entry point
│   │
│   ├── layouts/           # Componentes de layout
│   │   └── MenuLateral.tsx
│   │
│   ├── modules/           # Módulos de features
│   │   └── item/          # Módulo de itens
│   │       ├── search/         # Busca de itens
│   │       └── dadosCadastrais/  # Dados cadastrais
│   │
│   └── shared/            # Recursos compartilhados
│       ├── components/    # Componentes reutilizáveis
│       ├── services/      # Serviços de API
│       ├── hooks/         # Custom React hooks
│       ├── config/        # Configurações
│       └── utils/         # Utilitários
│
├── docs/                  # Documentação
│   ├── TECH_STACK.md      # Stack tecnológica
│   ├── ARCHITECTURE.md    # Arquitetura do projeto
│   ├── NEW_MODULE_GUIDE.md # Guia para criar módulos
│   └── ...
│
├── .husky/                # Git hooks
├── build/                 # Build de produção (gerado)
├── node_modules/          # Dependências (gerado)
│
├── .env                   # Variáveis de ambiente
├── .eslintrc.json         # Configuração ESLint
├── .prettierrc            # Configuração Prettier
├── package.json           # Dependências e scripts
├── tsconfig.json          # Configuração TypeScript
└── README.md              # Este arquivo
```

---

## Funcionalidades

### Módulos Disponíveis

1. **Dados Mestres (Item)**
   - Busca avançada de itens
   - Visualização de dados cadastrais
   - Abas: Base, Dimensões, Planejamento, Manufatura, Fiscal, Suprimentos

2. **Engenharias** (em desenvolvimento)
3. **PCP** (em desenvolvimento)
4. **Manufatura** (em desenvolvimento)
5. **Suprimentos** (em desenvolvimento)
6. **Fiscal** (em desenvolvimento)

### Atalhos de Teclado

**Navegação entre Menus:**
- `Ctrl + 1-9`: Seleciona item do menu principal
- `Ctrl + 0`: Toggle menu lateral

**Navegação entre Abas:**
- `Alt + 1-7`: Alterna entre abas do módulo ativo

**Interações:**
- `Enter`: Executa busca
- `Arrow Keys`: Navega na tabela
- `Home/End`: Primeira/última linha
- `PageUp/PageDown`: Navega por páginas

---

## Exportação de Dados

A aplicação suporta exportação de dados em múltiplos formatos:

- **CSV**: Formato universal para importação em outras ferramentas
- **Excel (XLSX)**: Planilhas formatadas
- **PDF**: Documentos para impressão
- **Impressão**: Direta do navegador

---

## Tecnologias Utilizadas

### Core
- **React** 19.2.0 - Framework UI
- **TypeScript** 4.9.5 - Tipagem estática
- **Ant Design** 5.27.4 - Componentes UI

### Ferramentas
- **Axios** - Cliente HTTP
- **jsPDF** - Geração de PDFs
- **xlsx** - Manipulação de planilhas
- **React Testing Library** - Testes de componentes
- **ESLint + Prettier** - Code quality
- **Husky + lint-staged** - Git hooks

Para detalhes completos, consulte [docs/TECH_STACK.md](docs/TECH_STACK.md)

---

## Desenvolvimento

### Documentação

- [NEW_MODULE_GUIDE.md](docs/NEW_MODULE_GUIDE.md) - Como criar novos módulos
- [GITHUB_PACKAGES_SECURITY.md](docs/GITHUB_PACKAGES_SECURITY.md) - Guia completo de segurança para pacotes privados
- [TECH_STACK.md](docs/TECH_STACK.md) - Stack tecnológica
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura do projeto

### Criar um Novo Módulo

Consulte o guia completo: [docs/NEW_MODULE_GUIDE.md](docs/NEW_MODULE_GUIDE.md)

### Padrões de Código

- **Nomenclatura**: camelCase (sem underscores)
- **Componentes**: PascalCase
- **Arquivos de serviço**: `*.service.ts`
- **Arquivos de tipos**: `*.types.ts`
- **Hooks**: Prefixo `use`

### Commits

O projeto utiliza Husky para validação pré-commit:
- Linting automático
- Formatação de código
- Type checking

---

## Testes

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm test -- --coverage

# Executar testes específicos
npm test -- SearchForm
```

---

## Arquitetura

O projeto segue uma arquitetura modular baseada em features:

- **Feature-based modules**: Cada módulo contém seus próprios componentes, services, types
- **Shared layer**: Código reutilizável entre módulos
- **Service layer**: Abstração de chamadas de API
- **Custom hooks**: Lógica reutilizável de estado

Para detalhes, consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Integração com API

A aplicação se conecta com o backend LOR DTS API:

- **Base URL**: Configurável via `REACT_APP_API_URL`
- **Autenticação**: Bearer token (localStorage)
- **Interceptors**: Injeção automática de token
- **Error handling**: Redirecionamento em caso de 401

Para detalhes, consulte [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)

---

## Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
2. Faça suas alterações seguindo os padrões do projeto
3. Commit suas mudanças: `git commit -m "feat: adiciona nova funcionalidade"`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

Consulte [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) para detalhes

---

## Troubleshooting

### Erro ao instalar dependências

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Erro de autenticação GitHub Packages

**Para desenvolvimento local:**

```bash
# 1. Crie um Personal Access Token no GitHub com permissão 'read:packages'
# 2. Configure o token como variável de ambiente
export GITHUB_TOKEN=seu_token_aqui

# 3. Ou adicione ao .npmrc local
echo "//npm.pkg.github.com/:_authToken=SEU_TOKEN" >> ~/.npmrc
```

**Para GitHub Actions:**

O workflow já está configurado para usar `GITHUB_TOKEN`. Se você encontrar erros de permissão:

1. Verifique se o repositório tem acesso ao pacote `@acmano/lordtsapi-shared-types`
2. Considere criar um Personal Access Token com permissão `read:packages` e adicioná-lo como secret `PACKAGES_TOKEN`
3. O workflow usará automaticamente o token disponível

### Porta 3000 já em uso

```bash
# Usar porta diferente
PORT=3001 npm start
```

---

## Suporte

- **Documentação**: Consulte a pasta `/docs`
- **Issues**: Reporte problemas via Git issues
- **Contato**: Entre em contato com a equipe de desenvolvimento

---

## Licença

Propriedade da Lorenzetti S.A. - Uso interno.

---

## Changelog

Consulte [CHANGELOG.md](CHANGELOG.md) para histórico de versões.

---

**Desenvolvido com ❤️ pela equipe Lorenzetti**

