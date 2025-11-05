describe('Rate Limit UI Feedback', () => {
  it('deve exibir alerta quando rate limit é atingido', () => {
    // Interceptar e forçar erro 429
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 429,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Date.now() + 60000,
        'Retry-After': '60'
      },
      body: { error: 'Rate limit exceeded' }
    }).as('rateLimitError');

    cy.visit('/');
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="search-button"]').click();

    cy.wait('@rateLimitError');

    cy.get('[data-testid="rate-limit-warning"]').should('be.visible');
    cy.contains('limite de requisições').should('be.visible');
  });

  it('deve exibir countdown de retry', () => {
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 429,
      headers: {
        'Retry-After': '60'
      }
    });

    cy.visit('/');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="rate-limit-countdown"]').should('contain', '01:00');
  });

  it('deve desabilitar botão retry durante countdown', () => {
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 429,
      headers: { 'Retry-After': '10' }
    });

    cy.visit('/');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="retry-button"]').should('be.disabled');
  });

  it('deve habilitar botão retry após countdown', () => {
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 429,
      headers: { 'Retry-After': '2' }
    });

    cy.visit('/');
    cy.get('[data-testid="search-button"]').click();

    // Aguardar 2 segundos
    cy.wait(2000);

    cy.get('[data-testid="retry-button"]').should('be.enabled');
  });

  it('deve fechar alerta ao clicar em fechar', () => {
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 429,
      headers: { 'Retry-After': '60' }
    });

    cy.visit('/');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="rate-limit-warning"]').should('be.visible');
    cy.get('[data-testid="close-rate-limit"]').click();
    cy.get('[data-testid="rate-limit-warning"]').should('not.exist');
  });

  it('deve mostrar badge de rate limit no header', () => {
    cy.intercept('GET', '/api/lor0138/item/search*', {
      statusCode: 200,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '25'
      },
      body: { data: [], total: 0 }
    });

    cy.visit('/');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="rate-limit-badge"]').should('be.visible');
    cy.get('[data-testid="rate-limit-badge"]').should('contain', '25');
  });

  it('deve atualizar badge após cada requisição', () => {
    let remaining = 50;

    cy.intercept('GET', '/api/lor0138/item/search*', (req) => {
      req.reply({
        statusCode: 200,
        headers: {
          'X-RateLimit-Remaining': String(remaining--)
        },
        body: { data: [], total: 0 }
      });
    });

    cy.visit('/');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="rate-limit-badge"]').should('contain', '50');

    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="rate-limit-badge"]').should('contain', '49');
  });
});
