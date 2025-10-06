// src/shared/utils/cache/CacheAdapter.ts

/**
 * ========================================
 * INTERFACE BASE PARA ADAPTADORES DE CACHE
 * ========================================
 *
 * Define contrato padrão para implementações de cache, permitindo
 * trocar backend (memória, Redis, etc) sem modificar código da aplicação.
 *
 * PROPÓSITO:
 * - Abstração de backends de cache
 * - Facilitar testes (mock de cache)
 * - Permitir estratégias híbridas (L1 + L2)
 * - Garantir interface consistente
 *
 * IMPLEMENTAÇÕES DISPONÍVEIS:
 * - MemoryCacheAdapter: Cache local em memória (L1)
 * - RedisCacheAdapter: Cache distribuído via Redis (L2)
 * - LayeredCacheAdapter: Cache em camadas (L1 + L2)
 *
 * PADRÃO DE PROJETO:
 * - Strategy Pattern: Diferentes implementações de cache
 * - Adapter Pattern: Adapta diferentes backends para interface única
 *
 * @see MemoryCacheAdapter.ts - Implementação em memória
 * @see RedisCacheAdapter.ts - Implementação Redis
 * @see LayeredCacheAdapter.ts - Implementação em camadas
 * @see CacheManager.ts - Gerenciador que usa este adapter
 */

/**
 * ========================================
 * INTERFACE PRINCIPAL DO ADAPTADOR
 * ========================================
 */

/**
 * Interface base para adaptadores de cache
 *
 * PROPÓSITO:
 * Permite trocar backend (memória, Redis, etc) sem mudar código
 *
 * MÉTODOS OBRIGATÓRIOS:
 * - get: Buscar valor no cache
 * - set: Armazenar valor no cache
 * - delete: Remover valor do cache
 * - flush: Limpar todo o cache
 * - keys: Listar chaves em cache
 * - isReady: Verificar disponibilidade
 * - close: Fechar conexões
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const cache: CacheAdapter = new MemoryCacheAdapter(300);
 *
 * // Armazenar
 * await cache.set('item:123', { name: 'Product' }, 600);
 *
 * // Buscar
 * const data = await cache.get<Item>('item:123');
 *
 * // Remover
 * await cache.delete('item:123');
 * ```
 */
export interface CacheAdapter {
  /**
   * Busca valor no cache
   *
   * PROPÓSITO:
   * Recupera valor previamente armazenado usando a chave
   *
   * COMPORTAMENTO:
   * - Retorna valor se encontrado e não expirado
   * - Retorna undefined se não encontrado ou expirado
   * - Não lança exceções (retorna undefined em caso de erro)
   *
   * EXEMPLO:
   * ```typescript
   * const user = await cache.get<User>('user:123');
   * if (user) {
   *   console.log('Cache HIT:', user);
   * } else {
   *   console.log('Cache MISS');
   *   // Buscar do banco de dados
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Sempre verificar se retorno é undefined antes de usar
   * - Usar type parameter <T> para type safety
   * - Implementações devem ser resilientes a erros
   *
   * @param key - Chave do cache (ex: 'item:7530110')
   * @returns Promise com valor tipado ou undefined se não encontrado
   *
   * @template T - Tipo do valor armazenado
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Armazena valor no cache
   *
   * PROPÓSITO:
   * Salva valor no cache com expiração opcional
   *
   * COMPORTAMENTO:
   * - Sobrescreve valor existente se chave já existe
   * - TTL é opcional (usa padrão se não fornecido)
   * - Serializa automaticamente objetos complexos
   * - Retorna true em sucesso, false em falha
   *
   * EXEMPLO:
   * ```typescript
   * // Com TTL específico
   * await cache.set('item:123', item, 600); // 10 minutos
   *
   * // Com TTL padrão
   * await cache.set('temp:data', data); // Usa TTL do adapter
   *
   * // Verificar sucesso
   * const success = await cache.set('key', value);
   * if (!success) {
   *   log.warn('Falha ao armazenar no cache');
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Valores complexos são serializados (JSON.stringify)
   * - Objetos circulares causarão erro
   * - TTL em SEGUNDOS (não milissegundos)
   * - Implementações devem ser resilientes a erros de serialização
   *
   * @param key - Chave do cache (ex: 'item:7530110')
   * @param value - Valor a armazenar (será serializado se objeto)
   * @param ttl - Tempo de vida em SEGUNDOS (opcional)
   * @returns Promise<true> se sucesso, Promise<false> se falha
   *
   * @template T - Tipo do valor a ser armazenado
   */
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;

  /**
   * Remove valor do cache
   *
   * PROPÓSITO:
   * Remove uma ou mais chaves do cache
   *
   * COMPORTAMENTO:
   * - Remove chave especificada
   * - Retorna número de chaves removidas
   * - Retorna 0 se chave não existia
   * - Suporta wildcard em algumas implementações (Redis)
   *
   * EXEMPLO:
   * ```typescript
   * // Remover uma chave
   * const removed = await cache.delete('item:123');
   * console.log(`Removidas ${removed} chaves`);
   *
   * // Remover com wildcard (Redis)
   * const removed = await cache.delete('item:*');
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Operação é idempotente (pode chamar múltiplas vezes)
   * - Não falha se chave não existe
   * - Em cache distribuído, pode haver delay de propagação
   *
   * @param key - Chave a remover (pode suportar wildcard)
   * @returns Promise com número de chaves removidas
   */
  delete(key: string): Promise<number>;

  /**
   * Limpa todo o cache
   *
   * PROPÓSITO:
   * Remove TODAS as chaves do cache
   *
   * COMPORTAMENTO:
   * - Remove todas as chaves
   * - Operação destrutiva e irreversível
   * - Pode impactar performance se cache grande
   *
   * EXEMPLO:
   * ```typescript
   * // Limpar em deploy/restart
   * await cache.flush();
   * log.info('Cache completamente limpo');
   *
   * // Limpar em testes
   * afterEach(async () => {
   *   await cache.flush();
   * });
   * ```
   *
   * PONTOS CRÍTICOS:
   * - USE COM CUIDADO: Remove TUDO
   * - Em produção, preferir invalidação seletiva
   * - Em Redis compartilhado, afeta todas instâncias
   * - Pode causar "cache stampede" (muitas queries simultâneas ao banco)
   *
   * @returns Promise que resolve quando cache limpo
   */
  flush(): Promise<void>;

  /**
   * Lista todas as chaves em cache
   *
   * PROPÓSITO:
   * Retorna lista de chaves para inspeção e debug
   *
   * COMPORTAMENTO:
   * - Sem pattern: retorna TODAS as chaves
   * - Com pattern: retorna apenas chaves que correspondem
   * - Pattern suporta wildcard (*) em algumas implementações
   *
   * EXEMPLO:
   * ```typescript
   * // Listar todas chaves
   * const all = await cache.keys();
   * console.log(`Total: ${all.length} chaves`);
   *
   * // Listar chaves específicas
   * const items = await cache.keys('item:*');
   * console.log(`Items em cache: ${items.length}`);
   *
   * // Listar por namespace
   * const queries = await cache.keys('GET:*');
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Operação pode ser custosa com muitas chaves
   * - Em Redis, usar SCAN ao invés de KEYS em produção
   * - Pattern matching varia por implementação
   * - Não usar em código de produção de alta frequência
   *
   * @param pattern - Padrão de busca opcional (ex: 'item:*')
   * @returns Promise com array de chaves
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Verifica se o cache está disponível
   *
   * PROPÓSITO:
   * Verifica se cache está conectado e operacional
   *
   * COMPORTAMENTO:
   * - true: Cache funcionando normalmente
   * - false: Cache indisponível (erro de conexão, etc)
   *
   * EXEMPLO:
   * ```typescript
   * // Verificar antes de usar
   * if (await cache.isReady()) {
   *   const data = await cache.get('key');
   * } else {
   *   log.warn('Cache indisponível, usando banco diretamente');
   *   const data = await database.query();
   * }
   *
   * // Health check
   * app.get('/health', async (req, res) => {
   *   const cacheReady = await cache.isReady();
   *   res.json({ cache: cacheReady ? 'ok' : 'down' });
   * });
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Operação deve ser rápida (< 100ms)
   * - Não deve lançar exceções
   * - Cache memory sempre retorna true
   * - Redis pode retornar false durante reconexão
   *
   * @returns Promise<true> se disponível, Promise<false> se não
   */
  isReady(): Promise<boolean>;

  /**
   * Fecha conexão com cache
   *
   * PROPÓSITO:
   * Libera recursos e fecha conexões (usado em graceful shutdown)
   *
   * COMPORTAMENTO:
   * - Fecha conexões de rede (Redis)
   * - Libera recursos (timers, event listeners)
   * - Após close, cache não deve ser usado novamente
   *
   * EXEMPLO:
   * ```typescript
   * // Graceful shutdown
   * process.on('SIGTERM', async () => {
   *   log.info('Fechando cache...');
   *   await cache.close();
   *   log.info('Cache fechado');
   *   process.exit(0);
   * });
   *
   * // Cleanup em testes
   * afterAll(async () => {
   *   await cache.close();
   * });
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Operação é irreversível
   * - Não usar cache após close
   * - Aguardar close completar antes de sair
   * - Memory cache não precisa close (mas implementa para compatibilidade)
   *
   * @returns Promise que resolve quando fechado
   */
  close(): Promise<void>;
}

/**
 * ========================================
 * INTERFACE DE ESTATÍSTICAS
 * ========================================
 */

/**
 * Estatísticas de cache (opcional)
 *
 * PROPÓSITO:
 * Fornecer métricas sobre uso e performance do cache
 *
 * IMPLEMENTAÇÃO:
 * - Opcional: nem todos adapters precisam implementar
 * - Usado para monitoramento e otimização
 * - Métricas podem variar por implementação
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Obter estatísticas
 * const stats: CacheStats = await cache.getStats();
 *
 * console.log(`Hit Rate: ${stats.hitRate}%`);
 * console.log(`Total Keys: ${stats.keys}`);
 * console.log(`Memory: ${stats.memoryUsage} bytes`);
 *
 * // Monitoramento
 * setInterval(async () => {
 *   const stats = await cache.getStats();
 *   if (stats.hitRate < 50) {
 *     log.warn('Cache hit rate baixo', stats);
 *   }
 * }, 60000);
 * ```
 */
export interface CacheStats {
  /**
   * Número de cache hits (encontrado)
   *
   * PROPÓSITO:
   * Contador de quantas vezes o valor foi encontrado no cache
   */
  hits: number;

  /**
   * Número de cache misses (não encontrado)
   *
   * PROPÓSITO:
   * Contador de quantas vezes o valor não foi encontrado
   */
  misses: number;

  /**
   * Taxa de acerto do cache em porcentagem
   *
   * CÁLCULO:
   * ```typescript
   * hitRate = (hits / (hits + misses)) * 100
   * ```
   *
   * VALORES ESPERADOS:
   * - > 80%: Excelente
   * - 50-80%: Bom
   * - < 50%: Revisar estratégia de cache
   */
  hitRate: number;

  /**
   * Número total de chaves em cache
   *
   * PROPÓSITO:
   * Monitorar tamanho do cache
   *
   * ALERTAS:
   * - Crescimento descontrolado pode indicar memory leak
   * - Muitas chaves podem impactar performance
   */
  keys: number;

  /**
   * Uso de memória em bytes (opcional)
   *
   * PROPÓSITO:
   * Monitorar consumo de memória do cache
   *
   * DISPONIBILIDADE:
   * - MemoryCacheAdapter: Implementa
   * - RedisCacheAdapter: Pode implementar via INFO
   * - LayeredCacheAdapter: Soma L1 + L2
   *
   * @optional
   */
  memoryUsage?: number;
}