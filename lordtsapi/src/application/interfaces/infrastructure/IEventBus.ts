// src/application/interfaces/infrastructure/IEventBus.ts

/**
 * Interface de Event Bus (Port)
 *
 * @description
 * Define o contrato para publicação/subscrição de eventos.
 * Abstrai implementação (Redis Pub/Sub, RabbitMQ, Kafka, etc).
 *
 * @example
 * ```typescript
 * class CreateItemUseCase {
 *   constructor(
 *     private eventBus: IEventBus,
 *     private itemRepository: IItemRepository
 *   ) {}
 *
 *   async execute(data: CreateItemDTO): Promise<ItemDTO> {
 *     const item = await this.itemRepository.create(data);
 *
 *     // Publica evento
 *     await this.eventBus.publish('item.created', {
 *       itemId: item.id,
 *       timestamp: new Date()
 *     });
 *
 *     return item;
 *   }
 * }
 * ```
 */
export interface IEventBus {
  /**
   * Publica evento
   *
   * @param eventName - Nome do evento
   * @param data - Dados do evento
   */
  publish(eventName: string, data: unknown): Promise<void>;

  /**
   * Subscreve a evento
   *
   * @param eventName - Nome do evento
   * @param handler - Handler do evento
   * @returns Função para cancelar subscrição
   */
  subscribe(
    eventName: string,
    handler: EventHandler
  ): Promise<UnsubscribeFunction>;

  /**
   * Cancela subscrição
   *
   * @param eventName - Nome do evento
   */
  unsubscribe(eventName: string): Promise<void>;

  /**
   * Fecha conexão
   */
  close(): Promise<void>;
}

export type EventHandler = (data: unknown) => void | Promise<void>;
export type UnsubscribeFunction = () => Promise<void>;
