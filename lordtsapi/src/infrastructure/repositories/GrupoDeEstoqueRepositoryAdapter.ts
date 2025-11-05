// @ts-nocheck
// src/infrastructure/repositories/GrupoDeEstoqueRepositoryAdapter.ts

import type {
  IGrupoDeEstoqueRepository,
  GrupoEstoqueCompleto,
  PaginationOptions,
  PaginatedResult,
  SearchOptions,
} from '@application/interfaces/repositories';
import { GrupoEstoque } from '@domain/entities';

// Legacy repositories
import { GrupoDeEstoqueInformacoesGeraisRepository } from '@/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository';
import { GrupoDeEstoqueListarRepository } from '@/grupoDeEstoque/listar/repository';

/**
 * Adapter do Repositório de Grupo de Estoque
 */
export class GrupoDeEstoqueRepositoryAdapter implements IGrupoDeEstoqueRepository {
  async findByCodigo(codigo: string | number): Promise<GrupoEstoque | null> {
    try {
      const codigoStr = codigo.toString();
      const result =
        await GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster(codigoStr);

      if (!result) {
        return null;
      }

      return GrupoEstoque.create({
        codigo: result.grupoDeEstoqueCodigo,
        descricao: result.grupoDeEstoqueDescricao,
      });
    } catch (error) {
      console.error('Error finding grupo estoque:', error);
      return null;
    }
  }

  async findCompleto(codigo: string | number): Promise<GrupoEstoqueCompleto | null> {
    const grupo = await this.findByCodigo(codigo);
    if (!grupo) return null;

    return {
      grupo,
    };
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<GrupoEstoque>> {
    try {
      const results = await GrupoDeEstoqueListarRepository.listarTodos();

      const grupos: GrupoEstoque[] = results
        .map((result) => {
          try {
            return GrupoEstoque.create({
              codigo: result.codigo,
              descricao: result.descricao,
            });
          } catch {
            return null;
          }
        })
        .filter((g): g is GrupoEstoque => g !== null);

      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const offset = (page - 1) * limit;
      const paginated = grupos.slice(offset, offset + limit);

      return {
        data: paginated,
        pagination: {
          page,
          limit,
          total: grupos.length,
          totalPages: Math.ceil(grupos.length / limit),
          hasNext: offset + limit < grupos.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error listing grupos estoque:', error);
      throw error;
    }
  }

  async search(descricao: string, options?: SearchOptions): Promise<PaginatedResult<GrupoEstoque>> {
    const all = await this.findAll(options);
    const filtered = all.data.filter((g) =>
      g.descricaoValue.toLowerCase().includes(descricao.toLowerCase())
    );

    return {
      data: filtered,
      pagination: {
        ...all.pagination,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / (options?.limit ?? 20)),
      },
    };
  }

  async exists(codigo: string | number): Promise<boolean> {
    const grupo = await this.findByCodigo(codigo);
    return grupo !== null;
  }

  async count(): Promise<number> {
    const all = await this.findAll();
    return all.pagination.total;
  }
}
