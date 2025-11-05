// src/application/interfaces/infrastructure/ILogger.ts

/**
 * Interface de Logger (Port)
 *
 * @description
 * Define o contrato para serviços de logging.
 * Segue o princípio da Inversão de Dependência.
 *
 * Use Cases e Services dependem APENAS desta interface,
 * não de implementações específicas (Winston, Console, etc).
 *
 * @example
 * ```typescript
 * class GetItemUseCase {
 *   constructor(
 *     private logger: ILogger,
 *     private itemRepository: IItemRepository
 *   ) {}
 *
 *   async execute(codigo: string): Promise<ItemDTO> {
 *     this.logger.info('Fetching item', { codigo });
 *     // ...
 *   }
 * }
 * ```
 */
export interface ILogger {
  /**
   * Log de debug (desenvolvimento)
   *
   * @param message - Mensagem
   * @param meta - Metadata adicional
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de informação (operações normais)
   *
   * @param message - Mensagem
   * @param meta - Metadata adicional
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de aviso (situações recuperáveis)
   *
   * @param message - Mensagem
   * @param meta - Metadata adicional
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de erro
   *
   * @param message - Mensagem
   * @param meta - Metadata adicional (incluindo error)
   */
  error(message: string, meta?: Record<string, unknown>): void;

  /**
   * Cria logger filho com contexto
   *
   * @param context - Contexto adicional (ex: correlationId)
   * @returns Logger filho
   */
  child(context: Record<string, unknown>): ILogger;
}

/**
 * Contexto de log
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  [key: string]: unknown;
}
