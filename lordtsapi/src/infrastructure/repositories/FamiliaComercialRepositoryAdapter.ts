// @ts-nocheck
// src/infrastructure/repositories/FamiliaComercialRepositoryAdapter.ts

import type {
  IFamiliaComercialRepository,
  FamiliaComercialCompleto,
  PaginationOptions,
  PaginatedResult,
  SearchOptions,
} from '@application/interfaces/repositories';
import { FamiliaComercial } from '@domain/entities';

// Legacy repositories
import { FamiliaComercialInformacoesGeraisRepository } from '@/familiaComercial/dadosCadastrais/informacoesGerais/repository';
import { FamiliaComercialListarRepository } from '@/familiaComercial/listar/repository';

/**
 * Adapter do Repositório de Família Comercial
 */
export class FamiliaComercialRepositoryAdapter implements IFamiliaComercialRepository {
  async findByCodigo(codigo: string): Promise<FamiliaComercial | null> {
    try {
      const result =
        await FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster(codigo);

      if (!result) {
        return null;
      }

      return FamiliaComercial.create({
        codigo: result.familiaComercialCodigo,
        descricao: result.familiaComercialDescricao,
      });
    } catch (error) {
      console.error('Error finding familia comercial:', error);
      return null;
    }
  }

  async findCompleto(codigo: string): Promise<FamiliaComercialCompleto | null> {
    const familiaComercial = await this.findByCodigo(codigo);
    if (!familiaComercial) return null;

    return {
      familiaComercial,
    };
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<FamiliaComercial>> {
    try {
      const results = await FamiliaComercialListarRepository.listarTodas();

      const familias: FamiliaComercial[] = results
        .map((result) => {
          try {
            return FamiliaComercial.create({
              codigo: result.codigo,
              descricao: result.descricao,
            });
          } catch {
            return null;
          }
        })
        .filter((f): f is FamiliaComercial => f !== null);

      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const offset = (page - 1) * limit;
      const paginated = familias.slice(offset, offset + limit);

      return {
        data: paginated,
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
      console.error('Error listing familias comerciais:', error);
      throw error;
    }
  }

  async search(
    descricao: string,
    options?: SearchOptions
  ): Promise<PaginatedResult<FamiliaComercial>> {
    const all = await this.findAll(options);
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
  }

  async exists(codigo: string): Promise<boolean> {
    const familia = await this.findByCodigo(codigo);
    return familia !== null;
  }

  async count(): Promise<number> {
    const all = await this.findAll();
    return all.pagination.total;
  }
}
