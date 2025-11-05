import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server para testes Node.js
 *
 * Intercepta requisições HTTP durante os testes e retorna
 * respostas mockadas definidas em handlers.ts
 */
export const server = setupServer(...handlers);
