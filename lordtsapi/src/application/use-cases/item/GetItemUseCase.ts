// src/application/use-cases/item/GetItemUseCase.ts

import type { IItemRepository } from '@application/interfaces/repositories';
import type { ILogger, ICache } from '@application/interfaces/infrastructure';
import type { ItemDetailDTO } from '../../dtos/ItemDTO';
import { ItemMapper } from '../../mappers/ItemMapper';

/**
 * Use Case - Obter Item por Código
 *
 * @description
 * Orquestra o fluxo para buscar um item completo com todas as suas relações.
 * Segue os princípios de Clean Architecture:
 * - Depende APENAS de interfaces (Ports), não de implementações
 * - Contém lógica de negócio de aplicação
 * - Coordena fluxo entre repositórios e mappers
 * - Retorna DTOs, não entidades
 *
 * Fluxo:
 * 1. Validar código do item
 * 2. Verificar cache
 * 3. Buscar item completo no repositório (se não em cache)
 * 4. Converter entidade → DTO
 * 5. Salvar em cache
 * 6. Retornar resultado
 *
 * @example
 * ```typescript
 * const useCase = new GetItemUseCase(
 *   itemRepository,
 *   logger,
 *   cache
 * );
 * const item = await useCase.execute('7530110');
 * ```
 */
export class GetItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly logger: ILogger,
    private readonly cache: ICache
  ) {}

  /**
   * Executa o use case
   *
   * @param itemCodigo - Código do item a buscar
   * @returns DTO com dados completos do item
   * @throws Error se item não encontrado ou código inválido
   */
  async execute(itemCodigo: string): Promise<ItemDetailDTO> {
    // 1. Validar entrada
    this.validateInput(itemCodigo);

    // 2. Log de início
    this.logger.info('GetItemUseCase: Fetching item', { itemCodigo });

    // 3. Tentar buscar do cache
    const cacheKey = `item:completo:${itemCodigo}`;
    const cached = await this.cache.get<ItemDetailDTO>(cacheKey);

    if (cached) {
      this.logger.debug('GetItemUseCase: Cache hit', { itemCodigo });
      return cached;
    }

    this.logger.debug('GetItemUseCase: Cache miss', { itemCodigo });

    // 4. Buscar do repositório
    const itemCompleto = await this.itemRepository.findCompleto(itemCodigo);

    if (!itemCompleto) {
      this.logger.warn('GetItemUseCase: Item not found', { itemCodigo });
      throw new Error(`Item não encontrado: ${itemCodigo}`);
    }

    // 5. Converter entidade → DTO
    const dto = ItemMapper.toDetailDTO(itemCompleto.item, {
      familia: itemCompleto.familia,
      familiaComercial: itemCompleto.familiaComercial,
      grupoEstoque: itemCompleto.grupoEstoque,
      estabelecimentos: itemCompleto.estabelecimentos,
    });

    // 6. Salvar no cache (5 minutos)
    await this.cache.set(cacheKey, dto, 300);

    this.logger.info('GetItemUseCase: Item fetched successfully', {
      itemCodigo,
    });

    return dto;
  }

  /**
   * Valida entrada
   * @private
   */
  private validateInput(itemCodigo: string): void {
    if (!itemCodigo || itemCodigo.trim() === '') {
      throw new Error('Código do item é obrigatório');
    }

    if (itemCodigo.length > 16) {
      throw new Error('Código do item deve ter no máximo 16 caracteres');
    }
  }
}
