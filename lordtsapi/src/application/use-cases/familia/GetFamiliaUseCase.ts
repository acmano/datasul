// src/application/use-cases/familia/GetFamiliaUseCase.ts

import type { FamiliaDTO } from '../../dtos/FamiliaDTO';

/**
 * Use Case - Obter Família por Código
 *
 * Orquestra o fluxo para buscar uma família.
 *
 * @example
 * const useCase = new GetFamiliaUseCase(familiaRepository);
 * const result = await useCase.execute('001');
 */
export class GetFamiliaUseCase {
  /**
   * Executa o use case
   *
   * @param familiaCodigo - Código da família
   * @returns DTO da família
   */
  async execute(familiaCodigo: string): Promise<FamiliaDTO> {
    // Validação
    if (!familiaCodigo || familiaCodigo.trim() === '') {
      throw new Error('Código da família é obrigatório');
    }

    // Implementação será conectada aos repositórios
    // const familia = await this.familiaRepository.findByCode(familiaCodigo);
    // return FamiliaMapper.toDTO(familia);

    // Por enquanto, retorna estrutura de exemplo
    return {
      codigo: familiaCodigo,
      descricao: 'Família de exemplo',
      ativo: true
    };
  }
}
