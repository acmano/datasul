// src/application/interfaces/infrastructure/IMetrics.ts

/**
 * Interface de Métricas (Port)
 *
 * @description
 * Define o contrato para coleta de métricas e observabilidade.
 * Abstrai implementação (Prometheus, Datadog, etc).
 *
 * @example
 * ```typescript
 * class GetItemUseCase {
 *   constructor(
 *     private metrics: IMetrics,
 *     private itemRepository: IItemRepository
 *   ) {}
 *
 *   async execute(codigo: string): Promise<ItemDTO> {
 *     const timer = this.metrics.startTimer('use_case_duration');
 *
 *     try {
 *       const item = await this.itemRepository.findByCodigo(codigo);
 *
 *       this.metrics.incrementCounter('items_fetched_total');
 *       this.metrics.observeHistogram('item_fetch_duration', timer());
 *
 *       return item;
 *     } catch (error) {
 *       this.metrics.incrementCounter('items_fetch_errors_total');
 *       throw error;
 *     }
 *   }
 * }
 * ```
 */
export interface IMetrics {
  /**
   * Incrementa contador
   *
   * @param name - Nome da métrica
   * @param value - Valor a incrementar (padrão: 1)
   * @param labels - Labels adicionais
   */
  incrementCounter(
    name: string,
    value?: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Decrementa gauge
   *
   * @param name - Nome da métrica
   * @param value - Valor
   * @param labels - Labels
   */
  decrementGauge(
    name: string,
    value?: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Define valor do gauge
   *
   * @param name - Nome da métrica
   * @param value - Valor
   * @param labels - Labels
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Observa valor em histograma
   *
   * @param name - Nome da métrica
   * @param value - Valor observado
   * @param labels - Labels
   */
  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Observa valor em summary
   *
   * @param name - Nome da métrica
   * @param value - Valor
   * @param labels - Labels
   */
  observeSummary(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Inicia timer para medir duração
   *
   * @param metricName - Nome da métrica de duração
   * @returns Função para finalizar timer e retornar duração
   *
   * @example
   * ```typescript
   * const end = metrics.startTimer('operation_duration');
   * // ... operação ...
   * const duration = end();
   * metrics.observeHistogram('operation_duration_seconds', duration);
   * ```
   */
  startTimer(metricName: string): () => number;

  /**
   * Registra duração de operação
   *
   * @param name - Nome da métrica
   * @param durationMs - Duração em milissegundos
   * @param labels - Labels
   */
  recordDuration(
    name: string,
    durationMs: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Registra tamanho de resposta
   *
   * @param name - Nome da métrica
   * @param sizeBytes - Tamanho em bytes
   * @param labels - Labels
   */
  recordSize(
    name: string,
    sizeBytes: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Retorna métricas formatadas (Prometheus format)
   *
   * @returns String com métricas
   */
  getMetrics(): Promise<string>;

  /**
   * Limpa todas as métricas
   */
  reset(): void;
}

/**
 * Labels padrão para métricas
 */
export interface MetricLabels {
  method?: string;
  route?: string;
  status?: string;
  error?: string;
  [key: string]: string | undefined;
}
