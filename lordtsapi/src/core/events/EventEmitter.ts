// src/core/events/EventEmitter.ts

/**
 * Event Emitter - Observer Pattern
 *
 * @description
 * Sistema de eventos desacoplado baseado no padrão Observer.
 * Permite que componentes se comuniquem sem dependências diretas.
 *
 * @example
 * ```typescript
 * // Criar evento
 * const itemCreatedEvent = new DomainEvent('item.created', {
 *   itemCodigo: '7530110',
 *   timestamp: new Date()
 * });
 *
 * // Registrar listener
 * EventEmitter.on('item.created', (event) => {
 *   console.log('Item criado:', event.data.itemCodigo);
 * });
 *
 * // Emitir evento
 * EventEmitter.emit(itemCreatedEvent);
 * ```
 */
export class EventEmitter {
  private static listeners: Map<string, EventListener[]> = new Map();

  /**
   * Registra listener para um evento
   *
   * @param eventName - Nome do evento
   * @param listener - Função callback
   * @returns Função para cancelar registro
   */
  static on(eventName: string, listener: EventListener): UnsubscribeFn {
    const listeners = this.listeners.get(eventName) || [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);

    // Retorna função para cancelar
    return () => this.off(eventName, listener);
  }

  /**
   * Registra listener que executa apenas uma vez
   *
   * @param eventName - Nome do evento
   * @param listener - Função callback
   * @returns Função para cancelar registro
   */
  static once(eventName: string, listener: EventListener): UnsubscribeFn {
    const onceListener: EventListener = (event) => {
      listener(event);
      this.off(eventName, onceListener);
    };

    return this.on(eventName, onceListener);
  }

  /**
   * Remove listener
   *
   * @param eventName - Nome do evento
   * @param listener - Função a remover
   */
  static off(eventName: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventName) || [];
    const filtered = listeners.filter((l) => l !== listener);

    if (filtered.length === 0) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.set(eventName, filtered);
    }
  }

  /**
   * Emite evento
   *
   * @param event - Evento a emitir
   */
  static emit(event: DomainEvent): void {
    const listeners = this.listeners.get(event.name) || [];

    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(
          `Error in event listener for ${event.name}:`,
          error
        );
      }
    });
  }

  /**
   * Emite evento de forma assíncrona
   *
   * @param event - Evento a emitir
   * @returns Promise que resolve quando todos os listeners terminarem
   */
  static async emitAsync(event: DomainEvent): Promise<void> {
    const listeners = this.listeners.get(event.name) || [];

    await Promise.all(
      listeners.map(async (listener) => {
        try {
          await listener(event);
        } catch (error) {
          console.error(
            `Error in async event listener for ${event.name}:`,
            error
          );
        }
      })
    );
  }

  /**
   * Remove todos os listeners de um evento
   *
   * @param eventName - Nome do evento
   */
  static removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Retorna quantidade de listeners para um evento
   *
   * @param eventName - Nome do evento
   * @returns Quantidade de listeners
   */
  static listenerCount(eventName: string): number {
    return (this.listeners.get(eventName) || []).length;
  }

  /**
   * Retorna todos os nomes de eventos registrados
   *
   * @returns Array de nomes de eventos
   */
  static eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// ============================================================================
// DOMAIN EVENT
// ============================================================================

/**
 * Evento de domínio
 */
export class DomainEvent<T = any> {
  public readonly name: string;
  public readonly data: T;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    name: string,
    data: T,
    options?: {
      correlationId?: string;
    }
  ) {
    this.name = name;
    this.data = data;
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export type EventListener = (event: DomainEvent) => void | Promise<void>;
export type UnsubscribeFn = () => void;

// ============================================================================
// EVENT NAMES (CONSTANTS)
// ============================================================================

/**
 * Nomes de eventos do domínio
 */
export const DomainEvents = {
  // Item events
  ITEM_CREATED: 'item.created',
  ITEM_UPDATED: 'item.updated',
  ITEM_DELETED: 'item.deleted',
  ITEM_ACTIVATED: 'item.activated',
  ITEM_DEACTIVATED: 'item.deactivated',

  // Familia events
  FAMILIA_CREATED: 'familia.created',
  FAMILIA_UPDATED: 'familia.updated',

  // Cache events
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  CACHE_INVALIDATED: 'cache.invalidated',

  // Error events
  ERROR_OCCURRED: 'error.occurred',
  VALIDATION_FAILED: 'validation.failed',

  // Database events
  QUERY_EXECUTED: 'database.query.executed',
  CONNECTION_ERROR: 'database.connection.error',
} as const;
