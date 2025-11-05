// src/shared/errors/AppError.ts

/**
 * Tipo para contexto adicional de erros
 * Permite valores primitivos, arrays e objetos aninhados
 */
export type ErrorContext = Record<string, unknown>;

/**
 * Classe base para todos os erros customizados da aplicação
 * @module AppError
 * @category Errors
 */
export class AppError extends Error {
  /**
   * Código de status HTTP associado ao erro
   */
  public readonly statusCode: number;

  /**
   * Indica se o erro é operacional (esperado) ou programático (bug)
   */
  public readonly isOperational: boolean;

  /**
   * Objeto com dados adicionais relacionados ao erro
   */
  public readonly context?: ErrorContext;

  /**
   * Cria nova instância de AppError
   *
   * @param statusCode - Código HTTP (200-599)
   * @param message - Mensagem descritiva do erro
   * @param isOperational - Se é erro operacional (padrão: true)
   * @param context - Dados adicionais (opcional)
   */
  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Captura stack trace (V8 optimization)
    Error.captureStackTrace(this, this.constructor);

    // Corrige prototype chain (TypeScript fix)
    Object.setPrototypeOf(this, new.target.prototype);

    // Define nome do erro como nome da classe
    this.name = this.constructor.name;
  }
}
