// src/estabelecimento/listar/service.ts

import { EstabelecimentoListarRepository } from './repository';
import type { EstabelecimentoListItem } from './types';

export class ListarService {
  static async listarTodos(): Promise<EstabelecimentoListItem[]> {
    const estabelecimentos = await EstabelecimentoListarRepository.listarTodos();

    return estabelecimentos.map((e: EstabelecimentoListItem) => ({
      codigo: String(e.codigo || '').trim(),
      nome: e.nome?.trim() || '',
    }));
  }
}
