# Git Hooks - Husky

Este projeto usa [Husky](https://typicode.github.io/husky/) para executar hooks do Git automaticamente.

## Hooks Configurados

### pre-commit
Executado antes de cada commit. Valida código staged:

- **ESLint**: Verifica e corrige problemas de linting
- **Prettier**: Formata código automaticamente
- **Jest**: Executa testes relacionados aos arquivos modificados

**Como funciona:**
```bash
# Ao fazer commit, automaticamente executa:
npm run lint:staged
```

### commit-msg
Executado ao criar mensagem de commit. Valida formato da mensagem segundo [Conventional Commits](https://www.conventionalcommits.org/).

**Formato válido:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types permitidos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças em documentação
- `style`: Formatação, ponto-e-vírgula faltando, etc
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição ou correção de testes
- `build`: Mudanças no sistema de build ou dependências
- `ci`: Mudanças em arquivos de CI
- `chore`: Outras mudanças que não modificam src ou test
- `revert`: Reverter commit anterior

**Exemplos válidos:**
```bash
feat(item): adiciona endpoint de busca por código
fix(cache): corrige invalidação de cache em updates
docs(readme): atualiza instruções de instalação
test(validators): adiciona testes para validateItemCodigo
```

**Exemplos inválidos:**
```bash
Add new feature          # ❌ Sem type
FEAT: new feature        # ❌ Type em maiúscula
feat add feature         # ❌ Faltando ':'
feat: Add new feature    # ❌ Subject começa com maiúscula
feat: add new feature.   # ❌ Subject termina com ponto
```

## Instalação

Os hooks são instalados automaticamente ao rodar:
```bash
npm install
```

## Bypassar Hooks (Emergências)

**⚠️ Use apenas em casos extremos:**
```bash
git commit --no-verify -m "mensagem"
```

## Troubleshooting

### Hooks não estão executando
```bash
# Reinstalar Husky
rm -rf .husky
npm run prepare
```

### Erro de permissão
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Lint-staged falha
```bash
# Limpar cache do Jest
npm run test -- --clearCache

# Verificar manualmente
npm run lint:staged
```

## Configuração

- **lint-staged**: Configurado em `package.json`
- **commitlint**: Configurado em `.commitlintrc.json`
- **husky**: Hooks em `.husky/`

## Performance

Os hooks são otimizados para executar apenas no código modificado:
- ESLint e Prettier rodam apenas em arquivos staged
- Jest roda apenas testes relacionados aos arquivos modificados
- Commitlint valida apenas a mensagem de commit

Tempo médio: **5-15 segundos** por commit.
