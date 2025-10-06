// src/infrastructure/database/connections/MockConnection.ts

import { IConnection, QueryParameter } from '../types';

/**
 * Conexão mockada para desenvolvimento e testes
 *
 * @description
 * Implementação fake de IConnection que retorna dados fictícios fixos.
 * Usada automaticamente quando:
 * - Conexão real com o banco falha
 * - USE_MOCK_DATA=true no .env
 * - Durante testes automatizados
 *
 * Funcionalidades principais:
 * - Retorna dados fixos pré-configurados
 * - Não requer banco de dados real
 * - Sempre reporta conexão bem-sucedida
 * - Útil para desenvolvimento offline
 * - Essencial para testes unitários
 *
 * Características técnicas:
 * - Implementa IConnection completamente
 * - Reconhece queries por palavras-chave (pub.item, item-uni-estab)
 * - Ignora parâmetros de query (retorna sempre os mesmos dados)
 * - Latência zero (instantâneo)
 *
 * Casos de uso:
 * - Desenvolvimento sem acesso ao banco
 * - Testes unitários e integração
 * - Demonstrações e protótipos
 * - Fallback automático em caso de falha
 *
 * @example
 * // Usar diretamente
 * const mock = new MockConnection();
 * await mock.connect();
 * const items = await mock.query('SELECT * FROM pub.item');
 *
 * @example
 * // Via DatabaseManager (automático)
 * process.env.USE_MOCK_DATA = 'true';
 * await DatabaseManager.initialize();
 * // Todas as queries usarão MockConnection
 *
 * @critical
 * - NUNCA usar em produção (exceto como fallback temporário)
 * - Dados são FICTÍCIOS e não representam dados reais
 * - Sempre retorna os mesmos dados, independente da query
 * - Health check sempre retorna sucesso
 * - Use apenas para desenvolvimento e testes
 *
 * @see {@link IConnection} - Interface implementada
 * @see {@link DatabaseManager} - Usa como fallback
 */
export class MockConnection implements IConnection {
  /**
   * Dados mockados retornados pelas queries
   *
   * @description
   * Estrutura de dados fictícios que simula respostas do banco real.
   * Inclui dados básicos de item e estabelecimentos.
   *
   * @private
   */
  private mockData = {
    /**
     * Item master mockado
     * Simula resposta de: SELECT * FROM pub.item
     */
    item: {
      itemCodigo: 'MOCK001',
      itemDescricao: 'Item Mock para Testes',
      itemUnidade: 'UN',
    },

    /**
     * Estabelecimentos mockados
     * Simula resposta de: SELECT * FROM pub."item-uni-estab"
     */
    estabelecimentos: [
      {
        itemCodigo: 'MOCK001',
        estabCodigo: '01',
        estabNome: 'Estabelecimento Mock',
        codObsoleto: 0,
      },
    ],
  };

  /**
   * Simula conexão com o banco
   *
   * @description
   * Apenas registra mensagem de log.
   * Sempre bem-sucedido, nunca falha.
   * Retorna instantaneamente.
   *
   * @returns {Promise<void>}
   *
   * @example
   * const mock = new MockConnection();
   * await mock.connect(); // Instantâneo
   *
   * @critical
   * - Não valida credenciais
   * - Não testa rede
   * - Sempre retorna sucesso
   */
  async connect(): Promise<void> {
    console.log('Mock connection iniciada');
  }

  /**
   * Executa query mockada (retorna dados fictícios)
   *
   * @description
   * Analisa a query por palavras-chave e retorna dados correspondentes.
   * NÃO executa SQL real - apenas detecta padrões na string.
   *
   * Padrões reconhecidos:
   * - "pub.item" → retorna item master
   * - "item-uni-estab" → retorna estabelecimentos
   * - Outros → retorna array vazio
   *
   * @param queryString - Query SQL (analisada por palavras-chave)
   * @returns {Promise<any>} Dados mockados ou array vazio
   *
   * @example
   * // Retorna item
   * const items = await mock.query('SELECT * FROM pub.item');
   * // Resultado: [{ itemCodigo: 'MOCK001', ... }]
   *
   * @example
   * // Retorna estabelecimentos
   * const estabs = await mock.query('SELECT * FROM pub."item-uni-estab"');
   * // Resultado: [{ itemCodigo: 'MOCK001', estabCodigo: '01', ... }]
   *
   * @example
   * // Query não reconhecida
   * const result = await mock.query('SELECT * FROM outra_tabela');
   * // Resultado: []
   *
   * @critical
   * - NÃO executa SQL real
   * - Ignora WHERE, JOIN, ORDER BY, etc
   * - Sempre retorna os mesmos dados fixos
   * - Use apenas para desenvolvimento e testes
   */
  async query(queryString: string): Promise<any> {
    console.log('Mock query executada:', queryString);

    if (queryString.includes('pub.item')) {
      return [this.mockData.item];
    }

    if (queryString.includes('item-uni-estab')) {
      return this.mockData.estabelecimentos;
    }

    return [];
  }

  /**
   * Executa query parametrizada mockada (retorna dados fictícios)
   *
   * @description
   * Versão parametrizada de query(). Ignora completamente os parâmetros
   * e retorna os mesmos dados fixos baseado apenas em palavras-chave da query.
   *
   * Comportamento:
   * - Ignora todos os parâmetros
   * - Detecta padrões na query
   * - Retorna dados fixos
   *
   * @param queryString - Query SQL (analisada por palavras-chave)
   * @param params - Parâmetros (IGNORADOS)
   * @returns {Promise<any>} Dados mockados ou array vazio
   *
   * @example
   * // Parâmetros são ignorados
   * const result = await mock.queryWithParams(
   *   'SELECT * FROM pub.item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: 'QUALQUER' }]
   * );
   * // Sempre retorna MOCK001, independente do parâmetro
   *
   * @critical
   * - Parâmetros são completamente IGNORADOS
   * - Sempre retorna os mesmos dados fixos
   * - Não valida tipos ou valores
   * - Use apenas para testes
   */
  async queryWithParams(queryString: string, params: QueryParameter[]): Promise<any> {
    console.log('Mock query parametrizada:', queryString, params);

    if (queryString.includes('pub.item')) {
      return [this.mockData.item];
    }

    if (queryString.includes('item-uni-estab')) {
      return this.mockData.estabelecimentos;
    }

    return [];
  }

  /**
   * Simula fechamento de conexão
   *
   * @description
   * Apenas registra mensagem de log.
   * Sempre bem-sucedido, nunca falha.
   * Retorna instantaneamente.
   *
   * @returns {Promise<void>}
   *
   * @example
   * await mock.close(); // Instantâneo
   *
   * @critical
   * - Não libera recursos (não há recursos reais)
   * - Sempre retorna sucesso
   */
  async close(): Promise<void> {
    console.log('Mock connection fechada');
  }

  /**
   * Sempre retorna true (mock sempre conectado)
   *
   * @description
   * Mock sempre reporta estar conectado.
   * Não há estado real de conexão.
   *
   * @returns {boolean} Sempre true
   *
   * @example
   * const connected = mock.isConnected(); // true
   *
   * @critical
   * - Sempre retorna true
   * - Não reflete estado real de conexão
   */
  isConnected(): boolean {
    return true;
  }
}