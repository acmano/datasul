// @ts-nocheck
// src/infrastructure/repositories/FamiliaRepositoryAdapter.ts

import type {
  IFamiliaRepository,
  FamiliaCompleto,
  FamiliaFilter,
  PaginationOptions,
  PaginatedResult,
  SearchOptions,
} from '@application/interfaces/repositories';
import { Familia } from '@domain/entities';

// Legacy repositories
import { FamiliaInformacoesGeraisRepository } from '@/familia/dadosCadastrais/informacoesGerais/repository';
import { FamiliaListarRepository } from '@/familia/listar/repository';

/**
 * Adapter do Repositório de Família
 *
 * Implementa IFamiliaRepository usando repositórios legados.
 */
export class FamiliaRepositoryAdapter implements IFamiliaRepository {
  /**
   * Busca família por código
   */
  async findByCodigo(codigo: string): Promise<Familia | null> {
    try {
      const result = await FamiliaInformacoesGeraisRepository.getFamiliaMaster(codigo);

      if (!result) {
        return null;
      }

      return Familia.create({
        codigo: result.familiaCodigo,
        descricao: result.familiaDescricao,
      });
    } catch (error) {
      console.error('Error finding familia by codigo:', error);
      return null;
    }
  }

  /**
   * Busca família completa
   */
  async findCompleto(codigo: string): Promise<FamiliaCompleto | null> {
    try {
      const result = await FamiliaInformacoesGeraisRepository.getFamiliaMaster(codigo);

      if (!result) {
        return null;
      }

      const familia = Familia.create({
        codigo: result.familiaCodigo,
        descricao: result.familiaDescricao,
      });

      return {
        familia,
      };
    } catch (error) {
      console.error('Error finding complete familia:', error);
      return null;
    }
  }

  /**
   * Lista todas as famílias
   */
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<Familia>> {
    try {
      const results = await FamiliaListarRepository.listarTodas();

      const familias: Familia[] = results
        .map((result) => {
          try {
            return Familia.create({
              codigo: result.codigo,
              descricao: result.descricao,
            });
          } catch {
            return null;
          }
        })
        .filter((f): f is Familia => f !== null);

      // Paginação manual
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const offset = (page - 1) * limit;
      const paginatedFamilias = familias.slice(offset, offset + limit);

      return {
        data: paginatedFamilias,
        pagination: {
          page,
          limit,
          total: familias.length,
          totalPages: Math.ceil(familias.length / limit),
          hasNext: offset + limit < familias.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error listing familias:', error);
      throw error;
    }
  }

  /**
   * Busca famílias por descrição
   */
  async search(descricao: string, options?: SearchOptions): Promise<PaginatedResult<Familia>> {
    try {
      const all = await this.findAll(options);

      // Filtra por descrição
      const filtered = all.data.filter((f) =>
        f.descricaoValue.toLowerCase().includes(descricao.toLowerCase())
      );

      return {
        data: filtered,
        pagination: {
          ...all.pagination,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / (options?.limit ?? 20)),
        },
      };
    } catch (error) {
      console.error('Error searching familias:', error);
      throw error;
    }
  }

  /**
   * Verifica se família existe
   */
  async exists(codigo: string): Promise<boolean> {
    const familia = await this.findByCodigo(codigo);
    return familia !== null;
  }

  /**
   * Conta total de famílias
   */
  async count(filter?: FamiliaFilter): Promise<number> {
    try {
      const all = await this.findAll();
      return all.pagination.total;
    } catch (error) {
      console.error('Error counting familias:', error);
      return 0;
    }
  }
}
