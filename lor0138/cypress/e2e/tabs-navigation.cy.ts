describe('Navegação entre Abas', () => {
  beforeEach(() => {
    cy.visit('/');
    // Buscar item primeiro
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="results-table"]').should('be.visible');
    // Selecionar primeiro resultado
    cy.get('[data-testid="results-row"]').first().click();
  });

  it('deve exibir aba Informações Gerais por padrão', () => {
    cy.get('[data-testid="tab-informacoes-gerais"]').should('have.class', 'ant-tabs-tab-active');
    cy.contains('Código do Item').should('be.visible');
  });

  it('deve navegar para aba Dimensões', () => {
    cy.get('[data-testid="tab-dimensoes"]').click();
    cy.get('[data-testid="tab-dimensoes"]').should('have.class', 'ant-tabs-tab-active');
    cy.contains('Altura').should('be.visible');
  });

  it('deve navegar para aba Planejamento', () => {
    cy.get('[data-testid="tab-planejamento"]').click();
    cy.contains('Lead Time').should('be.visible');
  });

  it('deve navegar para aba Manufatura', () => {
    cy.get('[data-testid="tab-manufatura"]').click();
    cy.contains('Roteiro').should('be.visible');
  });

  it('deve navegar para aba Fiscal', () => {
    cy.get('[data-testid="tab-fiscal"]').click();
    cy.contains('NCM').should('be.visible');
  });

  it('deve manter dados ao navegar entre abas', () => {
    // Verificar dado na aba 1
    cy.contains('7530110').should('be.visible');

    // Navegar para aba 2
    cy.get('[data-testid="tab-dimensoes"]').click();

    // Voltar para aba 1
    cy.get('[data-testid="tab-informacoes-gerais"]').click();

    // Dado ainda deve estar lá
    cy.contains('7530110').should('be.visible');
  });

  it('deve usar atalho Alt+1 para primeira aba', () => {
    cy.get('[data-testid="tab-dimensoes"]').click();
    cy.get('body').type('{alt}1');
    cy.get('[data-testid="tab-informacoes-gerais"]').should('have.class', 'ant-tabs-tab-active');
  });

  it('deve usar atalho Alt+2 para segunda aba', () => {
    cy.get('body').type('{alt}2');
    cy.get('[data-testid="tab-dimensoes"]').should('have.class', 'ant-tabs-tab-active');
  });
});
