# Testes E2E com Cypress

Este diretório contém os testes end-to-end (E2E) da aplicação usando Cypress.

## 🚀 Como Executar

### Pré-requisitos

1. Certifique-se de que o servidor de desenvolvimento está rodando:
   ```bash
   npm start
   ```
   O servidor deve estar disponível em `http://localhost:3000`

2. Certifique-se de que a API backend está rodando e acessível

### Executar Testes

**Modo Headless (CI/CD):**
```bash
npm run test:e2e
```

**Modo Interativo (Development):**
```bash
npm run test:e2e:open
```

**Modo Headed (Ver execução):**
```bash
npm run test:e2e:headed
```

## 📁 Estrutura

```
cypress/
├── e2e/                    # Testes E2E
│   └── estrutura.cy.ts    # Testes do módulo de estrutura
├── fixtures/               # Dados mock para testes
├── support/                # Comandos customizados e configuração
│   ├── commands.ts        # Comandos Cypress customizados
│   └── e2e.ts            # Setup global
└── README.md              # Este arquivo
```

## 🧪 Testes Implementados

### estrutura.cy.ts

Testa o módulo completo de Estrutura de Produtos (BOM):

**1. Pesquisa e Carregamento**
- ✅ Pesquisar item e carregar estrutura
- ✅ Exibir loading durante carregamento

**2. Visualizações**
- ✅ Alternar entre diferentes visualizações (Tabela, Sankey, Árvore, Treemap, Grafo)
- ✅ Controles de cor e quantidades
- ✅ Performance da tabela virtualizada

**3. Navegação e Drill-Down**
- ✅ Navegação via breadcrumb
- ✅ Expandir/colapsar níveis

**4. Menu de Visualizações**
- ✅ Esconder/mostrar menu lateral

**5. Performance e Cache**
- ✅ Uso de cache ao revisitar itens
- ✅ Tempo de carregamento razoável (<30s)

**6. Resumo de Horas**
- ✅ Exibir resumo de horas se disponível
- ✅ Exibir horas por operação se disponível

**7. Exportação**
- ✅ Botões de exportação disponíveis

**8. Responsividade**
- ✅ Mobile (375x667)
- ✅ Tablet (768x1024)
- ✅ Desktop (1920x1080)

**9. Tratamento de Erros**
- ✅ Item inexistente
- ✅ Erro de API (500)

## 🔧 Configuração

A configuração do Cypress está em `cypress.config.ts`:

```typescript
{
  baseUrl: 'http://localhost:3000',
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  viewportWidth: 1280,
  viewportHeight: 720,
}
```

## 📝 Comandos Customizados

Comandos disponíveis em `cypress/support/commands.ts`:

- `cy.login(username, password)` - Login (placeholder)
- `cy.waitForAPI(alias, timeout)` - Aguardar resposta de API
- `cy.searchItem(itemCode)` - Pesquisar item

## 🎯 Melhores Práticas

1. **Use interceptors para APIs**: Sempre intercepte chamadas API importantes
2. **Use aliases**: Facilita esperar por requisições específicas
3. **Evite seletores frágeis**: Use data-testid ou roles
4. **Testes isolados**: Cada teste deve ser independente
5. **Timeouts apropriados**: APIs lentas podem precisar de timeout maior

## 📊 Cobertura

Os testes E2E cobrem:
- ✅ Fluxos críticos do usuário
- ✅ Todas as visualizações principais
- ✅ Navegação e drill-down
- ✅ Cache e performance
- ✅ Responsividade
- ✅ Tratamento de erros

## 🐛 Debugging

**Ver testes em tempo real:**
```bash
npm run test:e2e:open
```

**Screenshots:** Salvos automaticamente em `cypress/screenshots/` em caso de falha

**Vídeos:** Configurados para não gravar (video: false)

## 🔄 CI/CD

Para rodar em pipeline CI/CD:

```yaml
- name: E2E Tests
  run: |
    npm start & # Iniciar servidor em background
    sleep 10     # Aguardar servidor iniciar
    npm run test:e2e
```

## 📚 Recursos

- [Cypress Docs](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library](https://testing-library.com/docs/cypress-testing-library/intro/)
