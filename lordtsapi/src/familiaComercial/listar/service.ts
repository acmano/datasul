// src/familiaComercial/listar/service.ts

import { FamiliaComercialListarRepository } from './repository';
import type { FamiliaComercialListItem } from './type';

export class ListarService {
  static async listarTodas(): Promise<FamiliaComercialListItem[]> {
    const familiasComerciais = await FamiliaComercialListarRepository.listarTodas();

    return familiasComerciais.map((fc: FamiliaComercialListItem) => ({
      codigo: fc.codigo?.trim() || '',
      descricao: fc.descricao?.trim() || '',
    }));
  }
}
