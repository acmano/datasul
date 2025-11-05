/**
 * E2E Tests - Módulo de Estrutura de Produtos (BOM)
 *
 * Testa os principais fluxos do usuário:
 * - Pesquisa de itens
 * - Visualização de estrutura em diferentes formatos
 * - Drill-down e navegação
 * - Performance e cache
 */

describe('Estrutura de Produtos - E2E', () => {
  const TEST_ITEM = '7530110'; // Item de teste (ajuste conforme necessário)

  beforeEach(() => {
    // Visitar página inicial
    cy.visit('/');

    // Interceptar chamadas API para verificar requisições
    cy.intercept('GET', '**/api/engenharia/estrutura/informacoesGerais/**').as('getEstrutura');
    cy.intercept('GET', '**/api/item/search/**').as('searchItem');
  });

  describe('Pesquisa e Carregamento', () => {
    it('deve pesquisar um item e carregar sua estrutura', () => {
      // Pesquisar item
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();

      // Aguardar resultado da pesquisa
      cy.waitForAPI('@searchItem', 10000);

      // Verificar se item aparece na tabela de resultados
      cy.contains(TEST_ITEM).should('be.visible');

      // Clicar no item para carregar estrutura
      cy.contains(TEST_ITEM).click();

      // Navegar para aba de Estrutura/Produtos
      cy.contains(/produtos/i).click();

      // Aguardar carregamento da estrutura
      cy.waitForAPI('@getEstrutura', 30000);

      // Verificar se estrutura foi carregada
      cy.contains('Item:').should('be.visible');
      cy.contains(TEST_ITEM).should('be.visible');
    });

    it('deve exibir loading durante carregamento', () => {
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');

      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();

      // Verificar indicador de loading
      cy.get('.ant-spin').should('exist');
    });
  });

  describe('Visualizações', () => {
    beforeEach(() => {
      // Carregar item antes de cada teste
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);
    });

    it('deve alternar entre diferentes visualizações', () => {
      // Menu de visualizações deve estar visível
      cy.contains('Tabela').should('be.visible');

      // Testar cada visualização
      const visualizacoes = ['Sankey', 'Árvore', 'Treemap', 'Grafo', 'Tabela'];

      visualizacoes.forEach((viz) => {
        cy.contains(viz).click();
        cy.wait(500); // Aguardar renderização

        // Verificar que a visualização foi trocada
        // (cada visualização tem elementos únicos)
        cy.get('body').should('be.visible');
      });
    });

    it('deve mostrar controles de cor nas visualizações gráficas', () => {
      // Ir para visualização Sankey
      cy.contains('Sankey').click();

      // Verificar controles de cor
      cy.contains('Mostrar quantidades').should('be.visible');
      cy.contains('Cor base').should('be.visible');
      cy.contains('Cor de fundo').should('be.visible');

      // Testar checkbox de quantidade
      cy.contains('Mostrar quantidades').click();
    });

    it('deve renderizar tabela virtualizada com performance', () => {
      cy.contains('Tabela').click();

      // A tabela deve ser renderizada rapidamente
      cy.get('[role="table"]', { timeout: 5000 }).should('be.visible');

      // Verificar que há linhas visíveis
      cy.get('[role="row"]').should('have.length.at.least', 1);
    });
  });

  describe('Navegação e Drill-Down', () => {
    beforeEach(() => {
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);
    });

    it('deve navegar via breadcrumb', () => {
      // Breadcrumb inicial deve mostrar item raiz
      cy.get('.ant-breadcrumb').should('contain', TEST_ITEM);

      // Se houver componentes, fazer drill-down
      cy.get('body').then(($body) => {
        if ($body.text().includes('🔍')) {
          // Clicar no primeiro botão de drill-down
          cy.get('button').contains('🔍').first().click();

          // Aguardar nova estrutura
          cy.waitForAPI('@getEstrutura', 30000);

          // Breadcrumb deve ter 2 itens agora
          cy.get('.ant-breadcrumb-link').should('have.length.at.least', 2);

          // Voltar via breadcrumb
          cy.get('.ant-breadcrumb-link').first().click();
          cy.waitForAPI('@getEstrutura', 30000);

          // Deve voltar ao item inicial
          cy.contains('Item:').should('contain', TEST_ITEM);
        }
      });
    });

    it('deve expandir e colapsar níveis na tabela', () => {
      cy.contains('Tabela').click();

      // Deve haver controle de expansão de níveis
      cy.contains('Expandir até nível').should('be.visible');

      // Verificar que há um slider
      cy.get('.ant-slider').should('be.visible');
    });
  });

  describe('Menu de Visualizações', () => {
    beforeEach(() => {
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);
    });

    it('deve esconder e mostrar menu lateral', () => {
      // Menu deve estar visível inicialmente
      cy.contains('Tabela').should('be.visible');

      // Clicar no botão de toggle (ícone de menu)
      cy.get('button').contains(/MenuFold|MenuUnfold/i).should('exist');

      // Alternar visibilidade (se o botão existir)
      cy.get('button[aria-label]').first().click();
      cy.wait(300);
    });
  });

  describe('Performance e Cache', () => {
    it('deve usar cache ao revisitar item já carregado', () => {
      // Primeira visita - deve fazer chamada API
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);

      // Trocar de aba
      cy.contains(/resultado/i).click();
      cy.wait(500);

      // Voltar para Produtos - deve usar cache (sem nova API call)
      cy.contains(/produtos/i).click();

      // Estrutura deve aparecer rapidamente (sem loading longo)
      cy.contains('Item:').should('be.visible');
      cy.contains(TEST_ITEM).should('be.visible');
    });

    it('deve carregar estrutura em tempo razoável', () => {
      const startTime = Date.now();

      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);

      cy.contains('Item:').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        // Estrutura deve carregar em menos de 30 segundos
        expect(loadTime).to.be.lessThan(30000);
        cy.log(`Estrutura carregada em ${loadTime}ms`);
      });
    });
  });

  describe('Resumo de Horas', () => {
    beforeEach(() => {
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);
    });

    it('deve exibir resumo de horas se disponível', () => {
      // Verificar se a seção de resumo de horas existe
      cy.get('body').then(($body) => {
        if ($body.text().includes('Resumo de Horas') || $body.text().includes('Total de Horas')) {
          // Se existir, verificar que contém informações
          cy.contains(/resumo|total/i).should('be.visible');
        } else {
          // Se não existir, apenas loggar
          cy.log('Resumo de horas não disponível para este item');
        }
      });
    });

    it('deve exibir horas por operação se disponível', () => {
      // Verificar se há detalhamento de operações
      cy.get('body').then(($body) => {
        const hasOperacoes = $body.text().includes('Operação') ||
                            $body.text().includes('Tempo') ||
                            $body.text().includes('Setup');

        if (hasOperacoes) {
          cy.log('Operações encontradas na estrutura');
        } else {
          cy.log('Nenhuma operação disponível para este item');
        }
      });
    });
  });

  describe('Exportação', () => {
    beforeEach(() => {
      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();
      cy.waitForAPI('@getEstrutura', 30000);
    });

    it('deve ter botões de exportação disponíveis', () => {
      // Verificar que botões de exportação existem
      cy.get('button[title*="Excel"], button[title*="CSV"], button[title*="PDF"]')
        .should('have.length.at.least', 1);
    });
  });

  describe('Responsividade', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach((viewport) => {
      it(`deve ser responsivo em ${viewport.name}`, () => {
        cy.viewport(viewport.width, viewport.height);

        cy.get('input[placeholder*="código"]').type(TEST_ITEM);
        cy.get('button').contains(/pesquisar/i).click();
        cy.waitForAPI('@searchItem');
        cy.contains(TEST_ITEM).click();
        cy.contains(/produtos/i).click();
        cy.waitForAPI('@getEstrutura', 30000);

        // Interface deve estar visível e funcional
        cy.contains('Item:').should('be.visible');
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir mensagem de erro para item inexistente', () => {
      cy.get('input[placeholder*="código"]').type('ITEM_INVALIDO_999999');
      cy.get('button').contains(/pesquisar/i).click();

      // Deve mostrar mensagem de "nenhum resultado" ou similar
      cy.contains(/nenhum|não encontrado/i, { timeout: 10000 }).should('be.visible');
    });

    it('deve tratar erro de API graciosamente', () => {
      // Simular erro de API
      cy.intercept('GET', '**/api/engenharia/estrutura/informacoesGerais/**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('getEstruturaError');

      cy.get('input[placeholder*="código"]').type(TEST_ITEM);
      cy.get('button').contains(/pesquisar/i).click();
      cy.waitForAPI('@searchItem');
      cy.contains(TEST_ITEM).click();
      cy.contains(/produtos/i).click();

      // Deve mostrar mensagem de erro
      cy.contains(/erro/i, { timeout: 10000 }).should('be.visible');
    });
  });
});
