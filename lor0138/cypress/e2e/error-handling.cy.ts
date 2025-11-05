describe('Tratamento de Erros', () => {
  it('deve exibir ErrorDisplay quando componente falha', () => {
    // Visitar rota que causa erro propositalmente
    cy.visit('/error-test');

    cy.contains('Ops! Algo deu errado').should('be.visible');
  });

  it('deve exibir Correlation ID em erro', () => {
    cy.visit('/error-test');

    cy.contains('ID de Rastreamento').should('be.visible');
    cy.get('[data-testid="correlation-id"]').should('exist');
  });

  it('deve permitir copiar Correlation ID', () => {
    cy.visit('/error-test');

    cy.get('[data-testid="copy-correlation-id"]').click();
    cy.contains('ID copiado').should('be.visible');
  });

  it('deve exibir erro em toast quando API falha', () => {
    // Interceptar e forçar erro 500
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    });

    cy.visit('/');
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="search-button"]').click();

    cy.get('.ant-message-error').should('be.visible');
    cy.contains('Erro ao buscar itens').should('be.visible');
  });

  it('deve incluir Correlation ID em toast de erro', () => {
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 500,
      headers: {
        'X-Correlation-ID': 'test-correlation-123'
      },
      body: { error: 'Internal Server Error' }
    });

    cy.visit('/');
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="search-button"]').click();

    cy.get('.ant-message-error').should('contain', 'test-corr');
  });

  it('deve exibir erro 404 amigável', () => {
    cy.intercept('GET', '/api/lor0138/item/7530110', {
      statusCode: 404,
      body: { error: 'Item not found' }
    });

    cy.visit('/item/7530110');

    cy.contains('Item não encontrado').should('be.visible');
  });

  it('deve permitir retry após erro', () => {
    cy.visit('/error-test');

    cy.get('[data-testid="retry-button"]').click();

    // Deve tentar recarregar
    cy.contains('Carregando').should('be.visible');
  });
});
