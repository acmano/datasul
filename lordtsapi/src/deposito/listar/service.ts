// src/deposito/listar/service.ts

import { DepositoListarRepository } from './repository';
import type { DepositoListItem } from './types';

export class ListarService {
  static async listarTodos(): Promise<DepositoListItem[]> {
    const depositos = await DepositoListarRepository.listarTodos();

    return depositos.map((d: DepositoListItem) => ({
      codigo: String(d.codigo || '').trim(),
      nome: d.nome?.trim() || '',
      consideraSaldoDisponivel: d.consideraSaldoDisponivel?.trim() || 'Não',
      consideraSaldoAlocado: d.consideraSaldoAlocado?.trim() || 'Não',
      permissaoMovDeposito1: d.permissaoMovDeposito1?.trim() || '',
      permissaoMovDeposito2: d.permissaoMovDeposito2?.trim() || '',
      permissaoMovDeposito3: d.permissaoMovDeposito3?.trim() || '',
      produtoAcabado: d.produtoAcabado?.trim() || 'Não',
      tipoDeposito: d.tipoDeposito?.trim() || '',
      depositoProcesso: d.depositoProcesso?.trim() || 'Não',
      nomeAbrev: d.nomeAbrev?.trim() || '',
      saldoDisponivel: d.saldoDisponivel?.trim() || 'Não',
      depositoCQ: d.depositoCQ?.trim() || 'Não',
      depositoRejeito: d.depositoRejeito?.trim() || 'Não',
      char1: d.char1?.trim() || '',
      char2: d.char2?.trim() || '',
      dec1: d.dec1 || 0,
      dec2: d.dec2 || 0,
      int1: d.int1 || 0,
      int2: d.int2 || 0,
      log1: d.log1 || false,
      log2: d.log2 || false,
      data1: d.data1 || null,
      data2: d.data2 || null,
      checkSum: d.checkSum?.trim() || '',
      depositoReciclado: d.depositoReciclado?.trim() || 'Não',
      consideraOrdens: d.consideraOrdens?.trim() || 'Não',
      depositoWMS: d.depositoWMS?.trim() || 'Não',
      alocaSaldoERP: d.alocaSaldoERP?.trim() || 'Não',
      origemExterna: d.origemExterna?.trim() || 'Não',
      depositoWmsExterno: d.depositoWmsExterno?.trim() || 'Não',
      alocaSaldoWmsExterno: d.alocaSaldoWmsExterno?.trim() || 'Não',
    }));
  }
}
