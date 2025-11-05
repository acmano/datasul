// ***********************************************************
// Custom Cypress Commands
// ***********************************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login (if needed in the future)
       */
      login(username: string, password: string): Chainable<void>;

      /**
       * Custom command to wait for API response
       */
      waitForAPI(alias: string, timeout?: number): Chainable<void>;

      /**
       * Custom command to search for an item
       */
      searchItem(itemCode: string): Chainable<void>;
    }
  }
}

// Login command (placeholder for future authentication)
Cypress.Commands.add('login', (username: string, password: string) => {
  // Implementation depends on your auth system
  cy.log(`Login with ${username}`);
});

// Wait for API with custom timeout
Cypress.Commands.add('waitForAPI', (alias: string, timeout = 30000) => {
  cy.wait(alias, { timeout });
});

// Search for an item
Cypress.Commands.add('searchItem', (itemCode: string) => {
  cy.get('input[placeholder*="item"]').clear().type(itemCode);
  cy.get('button').contains(/pesquisar/i).click();
});

export {};
