describe('Atalhos de Teclado', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve executar busca ao pressionar Enter', () => {
    cy.get('[data-testid="search-input-codigo"]').type('7530110{enter}');
    cy.get('[data-testid="results-table"]').should('be.visible');
  });

  it('deve abrir menu com Ctrl+0', () => {
    cy.get('body').type('{ctrl}0');
    cy.get('[data-testid="menu-lateral"]').should('be.visible');
  });

  it('deve fechar menu com Ctrl+0 novamente', () => {
    cy.get('body').type('{ctrl}0');
    cy.get('[data-testid="menu-lateral"]').should('be.visible');

    cy.get('body').type('{ctrl}0');
    cy.get('[data-testid="menu-lateral"]').should('not.be.visible');
  });

  it('deve navegar para Dados Mestres com Ctrl+1', () => {
    cy.get('body').type('{ctrl}1');
    cy.url().should('include', '/dados-mestres');
  });

  it('deve navegar para Engenharias com Ctrl+2', () => {
    cy.get('body').type('{ctrl}2');
    cy.url().should('include', '/engenharias');
  });

  it('deve abrir ajuda com F1', () => {
    cy.get('body').trigger('keydown', { key: 'F1' });
    cy.get('[data-testid="help-modal"]').should('be.visible');
  });

  it('deve fechar modal de ajuda com ESC', () => {
    cy.get('body').trigger('keydown', { key: 'F1' });
    cy.get('[data-testid="help-modal"]').should('be.visible');

    cy.get('body').type('{esc}');
    cy.get('[data-testid="help-modal"]').should('not.exist');
  });

  it('deve alternar tema com Ctrl+T', () => {
    // Tema inicial (light)
    cy.get('body').should('have.class', 'light-theme');

    cy.get('body').type('{ctrl}t');

    // Tema mudou (dark)
    cy.get('body').should('have.class', 'dark-theme');
  });
});
