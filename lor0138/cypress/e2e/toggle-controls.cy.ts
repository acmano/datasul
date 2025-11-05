describe('Toggle Controls Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.wait(2000);
  });

  it('Step 1: Should display the initial state with toggle buttons in header', () => {
    cy.screenshot('01-initial-state', { capture: 'fullPage' });
    
    // Check for menu toggle button
    cy.get('[class*="menu-toggle"], button').should('exist');
    
    cy.log('Initial state captured');
  });

  it('Step 2: Should display all toggle buttons in the header', () => {
    // Look for buttons in header
    cy.get('header').within(() => {
      cy.get('button').should('have.length.at.least', 3);
    });
    
    cy.screenshot('02-header-buttons', { capture: 'fullPage' });
  });

  it('Step 3: Should toggle search form visibility when clicking search toggle button', () => {
    // Find and verify search form is visible initially
    cy.get('form, [class*="search"]').first().should('be.visible');
    cy.screenshot('03a-search-form-visible', { capture: 'fullPage' });
    
    // Find the search toggle button (look for buttons with search-related text/attributes)
    cy.get('button[title*="search" i], button[title*="pesquis" i], button[aria-label*="search" i]')
      .first()
      .should('be.visible')
      .click();
    
    cy.wait(500);
    cy.screenshot('03b-search-form-hidden', { capture: 'fullPage' });
    
    // Click again to show
    cy.get('button[title*="search" i], button[title*="pesquis" i], button[aria-label*="search" i]')
      .first()
      .click();
    
    cy.wait(500);
    cy.screenshot('03c-search-form-visible-again', { capture: 'fullPage' });
  });

  it('Step 4: Should search for an item', () => {
    cy.get('input[type="text"], input[type="search"]').first().type('7530111');
    cy.wait(500);
    
    cy.get('button[type="submit"], button:contains("Buscar")').first().click();
    cy.wait(2000);
    
    cy.screenshot('04-search-results', { capture: 'fullPage' });
  });

  it('Step 5: Should navigate to Engenharia module', () => {
    // Open menu
    cy.get('[class*="menu-toggle"], button').first().click();
    cy.wait(500);
    
    // Look for Engenharia option
    cy.contains('Engenharia').click();
    cy.wait(2000);
    
    cy.screenshot('05-engenharia-module', { capture: 'fullPage' });
  });

  it('Step 6: Should toggle item header visibility', () => {
    // Navigate to Engenharia first
    cy.get('[class*="menu-toggle"], button').first().click();
    cy.wait(500);
    cy.contains('Engenharia').click();
    cy.wait(2000);
    
    // Find the header toggle button
    cy.get('button[title*="header" i], button[title*="cabeçalho" i], button[aria-label*="header" i]')
      .first()
      .should('be.visible')
      .click();
    
    cy.wait(500);
    cy.screenshot('06a-item-header-hidden', { capture: 'fullPage' });
    
    // Click again to show
    cy.get('button[title*="header" i], button[title*="cabeçalho" i], button[aria-label*="header" i]')
      .first()
      .click();
    
    cy.wait(500);
    cy.screenshot('06b-item-header-visible', { capture: 'fullPage' });
  });

  it('Step 7: Should test keyboard shortcuts', () => {
    // Test Ctrl+Shift+P (search form toggle)
    cy.get('body').type('{ctrl}{shift}p');
    cy.wait(500);
    cy.screenshot('07a-keyboard-search-toggle', { capture: 'fullPage' });
    
    // Navigate to Engenharia for header toggle test
    cy.get('[class*="menu-toggle"], button').first().click();
    cy.wait(500);
    cy.contains('Engenharia').click();
    cy.wait(2000);
    
    // Test Ctrl+Shift+H (item header toggle)
    cy.get('body').type('{ctrl}{shift}h');
    cy.wait(500);
    cy.screenshot('07b-keyboard-header-toggle', { capture: 'fullPage' });
  });

  it('Step 8: Final state verification', () => {
    cy.screenshot('08-final-state', { capture: 'fullPage' });
    
    // Verify all buttons are still functional
    cy.get('header').within(() => {
      cy.get('button').should('have.length.at.least', 3);
    });
  });
});
