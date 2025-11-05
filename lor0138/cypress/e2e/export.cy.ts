describe('Exportação de Dados', () => {
  beforeEach(() => {
    cy.visit('/');
    // Buscar item e selecionar
    cy.get('[data-testid="search-input-codigo"]').type('7530110');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="results-row"]').first().click();
  });

  it('deve exibir botões de exportação', () => {
    cy.get('[data-testid="export-csv"]').should('be.visible');
    cy.get('[data-testid="export-excel"]').should('be.visible');
    cy.get('[data-testid="export-pdf"]').should('be.visible');
  });

  it('deve exportar para CSV', () => {
    // Interceptar download
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.get('[data-testid="export-csv"]').click();

    // Verificar que CSV foi gerado (verificar console ou download)
    cy.contains('Exportado com sucesso').should('be.visible');
  });

  it('deve exportar para Excel', () => {
    cy.get('[data-testid="export-excel"]').click();
    cy.contains('Exportado com sucesso').should('be.visible');
  });

  it('deve exportar para PDF', () => {
    cy.get('[data-testid="export-pdf"]').click();
    cy.contains('Exportado com sucesso').should('be.visible');
  });

  it('deve abrir preview de impressão', () => {
    cy.window().then((win) => {
      cy.stub(win, 'print').as('windowPrint');
    });

    cy.get('[data-testid="export-print"]').click();

    cy.get('@windowPrint').should('have.been.called');
  });

  it('deve exportar com dados corretos', () => {
    // Mock de download para verificar conteúdo
    let downloadedData;

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake((blob) => {
        blob.text().then(text => {
          downloadedData = text;
        });
        return 'blob:mock';
      });
    });

    cy.get('[data-testid="export-csv"]').click();

    cy.wrap(null).then(() => {
      expect(downloadedData).to.include('7530110');
    });
  });
});
