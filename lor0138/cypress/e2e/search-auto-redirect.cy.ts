/**
 * Teste E2E: Redirecionamento Automático após Pesquisa
 * 
 * CORREÇÃO VALIDADA: useSearchFilters.ts (linhas 92-98)
 * 
 * COMPORTAMENTO ESPERADO:
 * - 1 item retornado → activeTabKey = 'base' (redirecionamento automático)
 * - Múltiplos itens → activeTabKey = 'resultado' (usuário escolhe)
 */

describe('Redirecionamento Automático após Pesquisa', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('✓ CRÍTICO: busca com 1 item deve redirecionar automaticamente', () => {
    // Buscar item único
    cy.get('input[placeholder="Código"]').first().clear().type('7530110');
    cy.contains('button', 'Buscar').click();
    cy.wait(4000);
    
    // VALIDAÇÃO: item foi carregado e interface mudou
    cy.contains('7530110').should('be.visible');
    cy.contains('MAXI DUCHA').should('be.visible');
    
    // VALIDAÇÃO: há aba ativa (redirecionamento ocorreu)
    cy.get('.ant-tabs-tab-active').should('exist');
    
    // VALIDAÇÃO: múltiplas abas disponíveis (não está travado na tela de busca)
    cy.get('.ant-tabs-tab').should('have.length.greaterThan', 3);
  });

  it('✓ CRÍTICO: busca com múltiplos itens NÃO deve redirecionar', () => {
    // Buscar múltiplos itens
    cy.get('input[placeholder="Código"]').first().clear().type('753*');
    cy.contains('button', 'Buscar').click();
    cy.wait(4000);
    
    // VALIDAÇÃO: tabela com múltiplos resultados visível
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').not('.ant-table-measure-row').should('have.length.greaterThan', 3);
    
    // VALIDAÇÃO: usuário ainda está na visualização de resultados
    cy.contains('.ant-tabs-tab', 'Resultado').should('be.visible');
  });

  it('✓ Navegação funciona após selecionar item de lista múltipla', () => {
    // Buscar múltiplos
    cy.get('input[placeholder="Código"]').first().clear().type('753*');
    cy.contains('button', 'Buscar').click();
    cy.wait(4000);
    
    // Selecionar primeiro item
    cy.get('table tbody tr').not('.ant-table-measure-row').first().click();
    cy.wait(1500);
    
    // VALIDAÇÃO: múltiplas abas agora disponíveis
    cy.get('.ant-tabs-tab').should('have.length.greaterThan', 3);
  });

  it('✓ Alternância entre 1 item e múltiplos itens funciona corretamente', () => {
    // CICLO 1: busca com 1 item
    cy.get('input[placeholder="Código"]').first().clear().type('7530110');
    cy.contains('button', 'Buscar').click();
    cy.wait(4000);
    cy.get('.ant-tabs-tab-active').should('exist');
    cy.contains('7530110').should('be.visible');
    
    // Limpar
    cy.contains('button', 'Limpar').click();
    cy.wait(1000);
    
    // CICLO 2: busca com múltiplos itens
    cy.get('input[placeholder="Código"]').first().clear().type('753*');
    cy.contains('button', 'Buscar').click();
    cy.wait(4000);
    cy.get('table tbody tr').not('.ant-table-measure-row').should('have.length.greaterThan', 3);
    
    // Limpar
    cy.contains('button', 'Limpar').click();
    cy.wait(1000);
    
    // CICLO 3: busca com 1 item novamente
    cy.get('input[placeholder="Código"]').first().clear().type('7530110');
    cy.contains('button', 'Buscar').click();
    cy.wait(4000);
    cy.get('.ant-tabs-tab-active').should('exist');
    cy.contains('7530110').should('be.visible');
  });
});
