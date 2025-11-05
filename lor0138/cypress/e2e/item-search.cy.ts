describe('Fluxo de Busca de Itens', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve carregar a página inicial', () => {
    cy.contains('Consulta de Itens').should('be.visible');
  });

  it('deve buscar item por código exato', () => {
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="results-table"]').should('be.visible');
    cy.contains('7530110').should('be.visible');
  });

  it('deve buscar item por wildcard', () => {
    cy.get('[data-testid="search-input-codigo"]').type('753*');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="results-table"]').should('be.visible');
    cy.get('[data-testid="results-row"]').should('have.length.gt', 0);
  });

  it('deve buscar item por descrição', () => {
    cy.get('[data-testid="search-input-descricao"]').type('PARAFUSO');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="results-table"]').should('be.visible');
  });

  it('deve exibir mensagem quando não encontrar resultados', () => {
    cy.get('[data-testid="search-input-codigo"]').type('ZZZZZ999');
    cy.get('[data-testid="search-button"]').click();

    cy.contains('Nenhum resultado encontrado').should('be.visible');
  });

  it('deve permitir filtrar por família', () => {
    cy.get('[data-testid="filter-familia"]').click();
    cy.contains('FAM01').click();
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="results-table"]').should('be.visible');
  });

  it('deve limpar filtros ao clicar em limpar', () => {
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="clear-filters"]').click();

    cy.get('[data-testid="search-input-codigo"]').should('have.value', '');
  });
});
