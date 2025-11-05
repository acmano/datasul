// src/familia/listar/service.ts

import { FamiliaListarRepository } from './repository';
import type { FamiliaListItem } from './types';

export class ListarService {
  static async listarTodas(): Promise<FamiliaListItem[]> {
    const familias = await FamiliaListarRepository.listarTodas();

    return familias.map((f: FamiliaListItem) => ({
      codigo: String(f.codigo || '').trim(),
      descricao: f.descricao?.trim() || '',
    }));
  }
}
