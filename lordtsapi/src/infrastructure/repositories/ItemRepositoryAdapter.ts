// src/infrastructure/repositories/ItemRepositoryAdapter.ts

import type {
  IItemRepository,
  ItemCompleto,
  ItemFilter,
  PaginationOptions,
  PaginatedResult,
  SearchOptions,
} from '@application/interfaces/repositories';
import { Item } from '@domain/entities';
import type { ItemCodigo } from '@domain/value-objects';

// Legacy repositories
import { ItemInformacoesGeraisRepository } from '@/item/dadosCadastrais/informacoesGerais/repository';
import { ItemSearchRepository } from '@/item/search/repository';

/**
 * Adapter do Repositório de Item (implementação)
 *
 * @description
 * Implementa a interface IItemRepository (Port) usando os repositórios legados.
 * Segue o padrão Hexagonal Architecture (Ports & Adapters).
 *
 * **Responsabilidades:**
 * - Implementar contrato IItemRepository
 * - Usar repositórios legados internamente
 * - Mapear dados do banco → entidades do domínio
 * - Garantir que Use Cases não dependem de detalhes de infraestrutura
 *
 * @example
 * ```typescript
 * const repository: IItemRepository = new ItemRepositoryAdapter();
 * const item = await repository.findByCodigo('7530110');
 * // Retorna Item (entidade do domínio)
 * ```
 */
export class ItemRepositoryAdapter implements IItemRepository {
  /**
   * Busca item por código
   *
   * @param codigo - Código do item (ItemCodigo ou string)
   * @returns Item ou null se não encontrado
   */
  async findByCodigo(codigo: ItemCodigo | string): Promise<Item | null> {
    try {
      const codigoStr = typeof codigo === 'string' ? codigo : codigo.value;

      // Usa repositório legado
      const result = await ItemInformacoesGeraisRepository.getItemMaster(codigoStr);

      if (!result) {
        return null;
      }

      // Mapeia resultado do banco → entidade do domínio
      const item = Item.create({
        codigo: result.itemCodigo,
        descricao: result.itemDescricao,
        unidade: result.itemUnidade,
        ativo: result.status === 'Ativo',
        observacao: result.narrativa !== 'N/D' ? result.narrativa : undefined,
      });

      return item;
    } catch (error) {
      // Log do erro mas não expõe detalhes da infraestrutura
      console.error('Error finding item by codigo:', error);
      return null;
    }
  }

  /**
   * Busca item completo com relacionamentos
   *
   * @param codigo - Código do item
   * @returns Item completo ou null
   */
  async findCompleto(codigo: ItemCodigo | string): Promise<ItemCompleto | null> {
    try {
      const codigoStr = typeof codigo === 'string' ? codigo : codigo.value;

      // Usa repositório legado que já busca relacionamentos
      const result = await ItemInformacoesGeraisRepository.getItemCompleto(codigoStr);

      if (!result || !result.item) {
        return null;
      }

      // Mapeia item
      const item = Item.create({
        codigo: result.item.itemCodigo,
        descricao: result.item.itemDescricao,
        unidade: result.item.itemUnidade,
        ativo: result.item.status === 'Ativo',
        observacao: result.item.narrativa !== 'N/D' ? result.item.narrativa : undefined,
      });

      // Monta objeto completo
      const itemCompleto: ItemCompleto = {
        item,
        familia: result.familia
          ? {
              codigo: result.familia.familiaCodigo,
              descricao: result.familia.familiaDescricao,
            }
          : undefined,
        familiaComercial: result.familiaComercial
          ? {
              codigo: result.familiaComercial.familiaComercialCodigo,
              descricao: result.familiaComercial.familiaComercialDescricao,
            }
          : undefined,
        grupoEstoque: result.grupoDeEstoque
          ? {
              codigo: result.grupoDeEstoque.grupoDeEstoqueCodigo,
              descricao: result.grupoDeEstoque.grupoDeEstoqueDescricao,
            }
          : undefined,
        estabelecimentos: result.estabelecimentos?.map((est) => ({
          codigo: est.codigo,
          nome: est.nome,
        })),
      };

      return itemCompleto;
    } catch (error) {
      console.error('Error finding complete item:', error);
      return null;
    }
  }

  /**
   * Busca múltiplos items por códigos
   *
   * @param codigos - Array de códigos
   * @returns Array de items encontrados
   */
  async findManyCodigos(codigos: (ItemCodigo | string)[]): Promise<Item[]> {
    try {
      const codigosStr = codigos.map((c) => (typeof c === 'string' ? c : c.value));

      // Busca paralela
      const results = await Promise.all(codigosStr.map((codigo) => this.findByCodigo(codigo)));

      // Filtra nulls
      return results.filter((item): item is Item => item !== null);
    } catch (error) {
      console.error('Error finding many items:', error);
      return [];
    }
  }

  /**
   * Busca items por família
   *
   * @param familiaCodigo - Código da família
   * @param options - Opções de paginação
   * @returns Items da família (paginado)
   */
  async findByFamilia(
    familiaCodigo: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Item>> {
    try {
      // Por enquanto, retorna resultado vazio
      // TODO: Implementar quando houver repositório legado correspondente
      return {
        data: [],
        pagination: {
          page: options?.page ?? 1,
          limit: options?.limit ?? 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      console.error('Error finding items by familia:', error);
      throw error;
    }
  }

  /**
   * Busca items por grupo de estoque
   *
   * @param grupoEstoqueCodigo - Código do grupo
   * @param options - Opções de paginação
   * @returns Items do grupo (paginado)
   */
  async findByGrupoEstoque(
    grupoEstoqueCodigo: string | number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Item>> {
    try {
      // TODO: Implementar
      return {
        data: [],
        pagination: {
          page: options?.page ?? 1,
          limit: options?.limit ?? 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      console.error('Error finding items by grupo estoque:', error);
      throw error;
    }
  }

  /**
   * Busca item por GTIN (código de barras)
   *
   * @param gtin - GTIN do item
   * @returns Item ou null
   */
  async findByGtin(gtin: string): Promise<Item | null> {
    try {
      // Usa repositório de busca legado
      const searchResults = await ItemSearchRepository.searchItems({
        gtin,
      });

      if (!searchResults || searchResults.length === 0) {
        return null;
      }

      // Pega primeiro resultado e busca completo
      const firstResult = searchResults[0];
      if (!firstResult?.item?.codigo) {
        return null;
      }

      return await this.findByCodigo(firstResult.item.codigo);
    } catch (error) {
      console.error('Error finding item by GTIN:', error);
      return null;
    }
  }

  /**
   * Pesquisa items por texto livre
   *
   * @param searchTerm - Termo de busca
   * @param options - Opções de busca e paginação
   * @returns Items encontrados (paginado)
   */
  async search(searchTerm: string, options?: SearchOptions): Promise<PaginatedResult<Item>> {
    try {
      // Usa repositório de busca legado
      const searchResults = await ItemSearchRepository.searchItems({
        descricao: searchTerm,
        familia: options?.familiaCodigo,
        grupoEstoque: options?.grupoEstoqueCodigo?.toString(),
      });

      if (!searchResults || searchResults.length === 0) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: options?.limit ?? 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      // Mapeia resultados para entidades
      const items: Item[] = searchResults
        .map((result) => {
          try {
            return Item.create({
              codigo: result.item.codigo,
              descricao: result.item.descricao,
              unidade: result.item.unidade || 'UN',
              ativo: true,
            });
          } catch {
            return null;
          }
        })
        .filter((item): item is Item => item !== null);

      // Paginação manual (TODO: implementar no repositório legado)
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const offset = (page - 1) * limit;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total: items.length,
          totalPages: Math.ceil(items.length / limit),
          hasNext: offset + limit < items.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * Verifica se item existe
   *
   * @param codigo - Código do item
   * @returns true se existe
   */
  async exists(codigo: ItemCodigo | string): Promise<boolean> {
    const item = await this.findByCodigo(codigo);
    return item !== null;
  }

  /**
   * Conta total de items
   *
   * @param filter - Filtros opcionais
   * @returns Quantidade de items
   */
  async count(filter?: ItemFilter): Promise<number> {
    try {
      // TODO: Implementar contagem no repositório legado
      // Por enquanto, retorna 0
      return 0;
    } catch (error) {
      console.error('Error counting items:', error);
      return 0;
    }
  }
}
