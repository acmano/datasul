// src/shared/utils/cache/CacheAdapter.ts

/**
 * Interface base para adaptadores de cache
 * Permite trocar backend (memória, Redis, etc) sem mudar código
 */
export interface CacheAdapter {
  /**
   * Busca valor no cache
   * @param key - Chave do cache
   * @returns Valor ou undefined se não encontrado
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Armazena valor no cache
   * @param key - Chave do cache
   * @param value - Valor a armazenar
   * @param ttl - Tempo de vida em segundos (opcional)
   * @returns true se sucesso
   */
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;

  /**
   * Remove valor do cache
   * @param key - Chave do cache
   * @returns Número de chaves removidas
   */
  delete(key: string): Promise<number>;

  /**
   * Limpa todo o cache
   */
  flush(): Promise<void>;

  /**
   * Lista todas as chaves em cache
   * @param pattern - Padrão de busca (opcional, ex: 'item:*')
   * @returns Array de chaves
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Verifica se o cache está disponível
   * @returns true se conectado e operacional
   */
  isReady(): Promise<boolean>;

  /**
   * Fecha conexão (se aplicável)
   */
  close(): Promise<void>;
}

/**
 * Estatísticas de cache (opcional, implementar se necessário)
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memoryUsage?: number;
}