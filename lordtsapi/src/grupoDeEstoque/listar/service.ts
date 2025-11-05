// src/grupoDeEstoque/listar/service.ts

import { GrupoDeEstoqueListarRepository } from './repository';
import type { GrupoDeEstoqueListItem } from './types';

export class ListarService {
  static async listarTodos(): Promise<GrupoDeEstoqueListItem[]> {
    const gruposDeEstoque = await GrupoDeEstoqueListarRepository.listarTodos();

    return gruposDeEstoque.map((ge: GrupoDeEstoqueListItem) => ({
      codigo: String(ge.codigo || '').trim(),
      descricao: ge.descricao?.trim() || '',
    }));
  }
}
