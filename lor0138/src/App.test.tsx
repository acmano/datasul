import App from './App';

/**
 * Teste básico de sanidade do componente App
 * Verifica se o módulo pode ser importado sem erros de sintaxe
 */
test('App module can be imported', () => {
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');
});
