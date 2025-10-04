// src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts
// EXEMPLO: Como integrar cache no repository (READ-ONLY)

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';

export class InformacoesGeraisRepository {
  private cache: CacheManager;
  private cacheEnabled: boolean;
  private cacheTTL: number;

  constructor() {
    this.cache = CacheManager.getInstance();
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
    this.cacheTTL = parseInt(process.env.CACHE_ITEM_TTL || '600', 10);
  }

  /**
   * Busca informações gerais do item com cache
   */
  async getItemInformacoesGerais(itemCodigo: string): Promise<any> {
    // Se cache desabilitado, busca direto do banco
    if (!this.cacheEnabled) {
      return this.fetchFromDatabase(itemCodigo);
    }

    // Gera chave de cache
    const cacheKey = generateCacheKey('item', itemCodigo, 'informacoesGerais');

    // Usa cache-aside pattern: busca do cache ou executa query
    return this.cache.getOrSet(
      cacheKey,
      () => this.fetchFromDatabase(itemCodigo),
      this.cacheTTL
    );
  }

  /**
   * Busca dados do banco (método privado)
   */
  private async fetchFromDatabase(itemCodigo: string): Promise<any> {
    const query = `
      DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
      
      -- Sua query completa aqui
      SELECT * FROM OPENQUERY(...)
    `;

    const params = [
      { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
    ];

    const result = await DatabaseManager.queryEmpWithParams(query, params);
    return result;
  }
}