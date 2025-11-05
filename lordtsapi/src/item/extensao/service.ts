// src/item/extensao/service.ts

import { ItemExtensaoRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/errors';
import type { ItemExtensao } from './types';

export class ItemExtensaoService {
  static async listarTodos(): Promise<ItemExtensao[]> {
    const extensoes = await ItemExtensaoRepository.listarTodos();

    return extensoes.map((e: ItemExtensao) => ({
      itemcod: String(e.itemcod || '').trim(),

      // Dimensões da Peça
      pecaaltura: Number(e.pecaaltura) || 0,
      pecalargura: Number(e.pecalargura) || 0,
      pecaprof: Number(e.pecaprof) || 0,
      pecapeso: Number(e.pecapeso) || 0,

      // Embalagem do Item
      itembalt: Number(e.itembalt) || 0,
      itemblarg: Number(e.itemblarg) || 0,
      itembprof: Number(e.itembprof) || 0,
      itembpeso: Number(e.itembpeso) || 0,

      // Dados IVV
      itemvalt: Number(e.itemvalt) || 0,
      itemvlarg: Number(e.itemvlarg) || 0,
      itemvprof: Number(e.itemvprof) || 0,
      itemvpeso: Number(e.itemvpeso) || 0,
      pecasitem: Number(e.pecasitem) || 0,

      // Embalagem do Produto
      prodebalt: Number(e.prodebalt) || 0,
      prodeblarg: Number(e.prodeblarg) || 0,
      prodebprof: Number(e.prodebprof) || 0,
      prodebpeso: Number(e.prodebpeso) || 0,

      // Códigos de Barras
      prodgtin13: String(e.prodgtin13 || '').trim(),
      caixagtin14: String(e.caixagtin14 || '').trim(),

      // Dimensões SKU
      prodvalt: Number(e.prodvalt) || 0,
      prodvlarg: Number(e.prodvlarg) || 0,
      prodvprof: Number(e.prodvprof) || 0,
      prodvpeso: Number(e.prodvpeso) || 0,

      // Quantidades e Organização
      itensprod: Number(e.itensprod) || 0,
      prodscaixa: Number(e.prodscaixa) || 0,
      lastro: Number(e.lastro) || 0,
      camada: Number(e.camada) || 0,
      embcod: String(e.embcod || '').trim(),
    }));
  }

  static async getByCodigo(itemCodigo: string): Promise<ItemExtensao> {
    const extensao = await ItemExtensaoRepository.getByCodigo(itemCodigo);

    if (!extensao) {
      throw new ItemNotFoundError(itemCodigo);
    }

    // Transformação e limpeza dos dados
    return {
      itemcod: String(extensao.itemcod || '').trim(),

      // Dimensões da Peça
      pecaaltura: Number(extensao.pecaaltura) || 0,
      pecalargura: Number(extensao.pecalargura) || 0,
      pecaprof: Number(extensao.pecaprof) || 0,
      pecapeso: Number(extensao.pecapeso) || 0,

      // Embalagem do Item
      itembalt: Number(extensao.itembalt) || 0,
      itemblarg: Number(extensao.itemblarg) || 0,
      itembprof: Number(extensao.itembprof) || 0,
      itembpeso: Number(extensao.itembpeso) || 0,

      // Dados IVV
      itemvalt: Number(extensao.itemvalt) || 0,
      itemvlarg: Number(extensao.itemvlarg) || 0,
      itemvprof: Number(extensao.itemvprof) || 0,
      itemvpeso: Number(extensao.itemvpeso) || 0,
      pecasitem: Number(extensao.pecasitem) || 0,

      // Embalagem do Produto
      prodebalt: Number(extensao.prodebalt) || 0,
      prodeblarg: Number(extensao.prodeblarg) || 0,
      prodebprof: Number(extensao.prodebprof) || 0,
      prodebpeso: Number(extensao.prodebpeso) || 0,

      // Códigos de Barras
      prodgtin13: String(extensao.prodgtin13 || '').trim(),
      caixagtin14: String(extensao.caixagtin14 || '').trim(),

      // Dimensões SKU
      prodvalt: Number(extensao.prodvalt) || 0,
      prodvlarg: Number(extensao.prodvlarg) || 0,
      prodvprof: Number(extensao.prodvprof) || 0,
      prodvpeso: Number(extensao.prodvpeso) || 0,

      // Quantidades e Organização
      itensprod: Number(extensao.itensprod) || 0,
      prodscaixa: Number(extensao.prodscaixa) || 0,
      lastro: Number(extensao.lastro) || 0,
      camada: Number(extensao.camada) || 0,
      embcod: String(extensao.embcod || '').trim(),
    };
  }
}
