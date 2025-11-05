// src/application/use-cases/familia/ListFamiliasUseCase.ts

import type { ListFamiliasDTO, ListFamiliasResultDTO } from '../../dtos/FamiliaDTO';

/**
 * Use Case - Listar Famílias
 *
 * Orquestra o fluxo para listar famílias com paginação.
 *
 * @example
 * const useCase = new ListFamiliasUseCase(familiaRepository);
 * const result = await useCase.execute({ limit: 50, offset: 0 });
 */
export class ListFamiliasUseCase {
  /**
   * Executa o use case
   *
   * @param params - Parâmetros de listagem
   * @returns Resultado paginado
   */
  async execute(params: ListFamiliasDTO): Promise<ListFamiliasResultDTO> {
    // Defaults
    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    // Implementação será conectada aos repositórios
    // const familias = await this.familiaRepository.list({
    //   ativo: params.ativo,
    //   limit,
    //   offset
    // });
    // const total = await this.familiaRepository.count({ ativo: params.ativo });

    return {
      familias: [],
      total: 0,
      limit,
      offset,
      hasMore: false
    };
  }
}
