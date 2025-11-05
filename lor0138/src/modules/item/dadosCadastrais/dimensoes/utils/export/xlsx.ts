// src/modules/item/dadosCadastrais/dimensoes/utils/export/xlsx.ts

import * as XLSX from 'xlsx';
import { ItemDimensoes } from '../../types';

export const exportDimensoesToXLSX = (
  dimensoes: ItemDimensoes,
  filename: string = 'item_dimensoes'
) => {
  if (!dimensoes) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = [
    'Peça Altura (m)',
    'Peça Largura (m)',
    'Peça Profundidade (m)',
    'Peça Peso (kg)',
    'Item Emb. Altura (m)',
    'Item Emb. Largura (m)',
    'Item Emb. Profundidade (m)',
    'Item Emb. Peso (kg)',
    'Item Embalado Altura (m)',
    'Item Embalado Largura (m)',
    'Item Embalado Profundidade (m)',
    'Item Embalado Peso (kg)',
    'Peças por Item',
    'Produto Emb. Altura (m)',
    'Produto Emb. Largura (m)',
    'Produto Emb. Profundidade (m)',
    'Produto Emb. Peso (kg)',
    'Produto Embalado Altura (m)',
    'Produto Embalado Largura (m)',
    'Produto Embalado Profundidade (m)',
    'Produto Embalado Peso (kg)',
    'Itens por Produto',
    'GTIN-13',
    'Caixa Altura (m)',
    'Caixa Largura (m)',
    'Caixa Profundidade (m)',
    'Caixa Peso (kg)',
    'Produtos por Caixa',
    'Caixa Sigla',
    'GTIN-14',
    'Palete Lastro',
    'Palete Camadas',
    'Caixas por Palete',
  ];

  const values = [
    dimensoes.peca.altura,
    dimensoes.peca.largura,
    dimensoes.peca.profundidade,
    dimensoes.peca.peso,
    dimensoes.item.embalagem.altura,
    dimensoes.item.embalagem.largura,
    dimensoes.item.embalagem.profundidade,
    dimensoes.item.embalagem.peso,
    dimensoes.item.embalado.altura,
    dimensoes.item.embalado.largura,
    dimensoes.item.embalado.profundidade,
    dimensoes.item.embalado.peso,
    dimensoes.item.pecas,
    dimensoes.produto.embalagem.altura,
    dimensoes.produto.embalagem.largura,
    dimensoes.produto.embalagem.profundidade,
    dimensoes.produto.embalagem.peso,
    dimensoes.produto.embalado.altura,
    dimensoes.produto.embalado.largura,
    dimensoes.produto.embalado.profundidade,
    dimensoes.produto.embalado.peso,
    dimensoes.produto.itens,
    dimensoes.produto.gtin13 || '',
    dimensoes.caixa.embalagem.altura,
    dimensoes.caixa.embalagem.largura,
    dimensoes.caixa.embalagem.profundidade,
    dimensoes.caixa.embalagem.peso,
    dimensoes.caixa.produtos,
    dimensoes.caixa.embalagem.sigla || '',
    dimensoes.caixa.gtin14 ? String(dimensoes.caixa.gtin14) : '',
    dimensoes.palete.lastro,
    dimensoes.palete.camadas,
    dimensoes.palete.caixasPalete,
  ];

  const data = [headers, values];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = Array(33).fill({ wch: 15 });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dimensões');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(wb, `${filename}_${dimensoes.itemCodigo}_${timestamp}.xlsx`);
};
