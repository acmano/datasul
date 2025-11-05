// src/item/dadosCadastrais/dimensoes/helpers.ts

import type { RawItemDimensoesDB, RawEmbalagemDB, ItemDimensoesRaw } from './types';

/**
 * Converte valores de centímetros para metros
 * Datasul armazena dimensões em centímetros (multiplicados por 100)
 */
function cmToMeters(value: number | null): number | null {
  if (value === null || value === undefined) return null;
  return value / 100;
}

/**
 * Transforma dados brutos do banco em formato do repository
 *
 * @param raw - Dados do ext-item (ESP database)
 * @param embalagem - Dados da embalagem (EMP database) - opcional
 * @param itemDescricao - Descrição do item (de outro repository)
 * @returns Dados transformados para o service
 */
export function transformItemDimensoes(
  raw: RawItemDimensoesDB,
  embalagem: RawEmbalagemDB | null,
  itemDescricao: string
): ItemDimensoesRaw {
  // Calcular caixas por palete (lastro × camadas)
  const caixasPalete = raw.lastro !== null && raw.camada !== null ? raw.lastro * raw.camada : null;

  return {
    itemCodigo: raw.itemcod,
    itemDescricao,

    // Dimensões da peça (convertidas para metros)
    pecaAltura: cmToMeters(raw.pecaaltura),
    pecaLargura: cmToMeters(raw.pecalargura),
    pecaProfundidade: cmToMeters(raw.pecaprof),
    pecaPeso: cmToMeters(raw.pecapeso),

    // Dimensões da embalagem do item
    itemEmbalagemAltura: cmToMeters(raw.itembalt),
    itemEmbalagemLargura: cmToMeters(raw.itemblarg),
    itemEmbalagemProfundidade: cmToMeters(raw.itembprof),
    itemEmbalagemPeso: cmToMeters(raw.itembpeso),

    // Dimensões do item embalado (IVV)
    itemEmbaladoAltura: cmToMeters(raw.itemvalt),
    itemEmbaladoLargura: cmToMeters(raw.itemvlarg),
    itemEmbaladoProfundidade: cmToMeters(raw.itemvprof),
    itemEmbaladoPeso: cmToMeters(raw.itemvpeso),

    // Quantidade de peças por item
    pecasItem: raw.pecasitem,

    // Dimensões da embalagem do produto
    produtoEmbalagemAltura: cmToMeters(raw.prodebalt),
    produtoEmbalagemLargura: cmToMeters(raw.prodeblarg),
    produtoEmbalagemProfundidade: cmToMeters(raw.prodebprof),
    produtoEmbalagemPeso: cmToMeters(raw.prodebpeso),

    // GTIN13 do produto
    produtoGTIN13: raw.prodgtin13,

    // Dimensões do produto embalado (SKU)
    produtoEmbaladoAltura: cmToMeters(raw.prodvalt),
    produtoEmbaladoLargura: cmToMeters(raw.prodvlarg),
    produtoEmbaladoProfundidade: cmToMeters(raw.prodvprof),
    produtoEmbaladoPeso: cmToMeters(raw.prodvpeso),

    // Quantidade de itens por produto
    itensProduto: raw.itensprod,

    // Dados da embalagem (se disponível)
    embalagemSigla: raw.embcod,
    embalagemAltura: embalagem ? cmToMeters(embalagem.embalt) : null,
    embalagemLargura: embalagem ? cmToMeters(embalagem.emblarg) : null,
    embalagemProfundidade: embalagem ? cmToMeters(embalagem.embprof) : null,
    embalagemPeso: embalagem ? cmToMeters(embalagem.embpeso) : null,

    // GTIN14 da caixa
    caixaGTIN14: raw.caixagtin14,

    // Quantidade de produtos por caixa
    produtosCaixa: raw.prodscaixa,

    // Paletização
    paleteLastro: raw.lastro,
    paleteCamadas: raw.camada,
    caixasPalete,
  };
}
