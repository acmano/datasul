// src/modules/item/dadosCadastrais/informacoesGerais/utils/export/xlsx.ts

import * as XLSX from 'xlsx';
import { ItemSearchResultItem } from '../../../../search/types/search.types';

export const exportBaseToXLSX = (item: ItemSearchResultItem, filename: string = 'item_base') => {
  if (!item) {
    alert('Não há dados para exportar');
    return;
  }

  // Cabeçalhos
  const headers = [
    'Código',
    'Descrição',
    'Unidade de Medida',
    'Unidade Descrição',
    'Família',
    'Família Descrição',
    'Família Comercial',
    'Fam. Comercial Descrição',
    'Grupo de Estoque',
    'Grupo Estoque Descrição',
    'GTIN',
  ];

  // Valores
  const values = [
    item.itemCodigo,
    item.itemDescricao,
    item.unidadeMedidaCodigo || '',
    item.unidadeMedidaDescricao || '',
    item.familiaCodigo || '',
    item.familiaDescricao || '',
    item.familiaComercialCodigo || '',
    item.familiaComercialDescricao || '',
    item.grupoEstoqueCodigo || '',
    item.grupoEstoqueDescricao || '',
    item.gtin || '',
  ];

  // Monta array com 2 linhas: cabeçalhos e valores
  const data = [headers, values];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Largura das colunas
  ws['!cols'] = [
    { wch: 15 }, // Código
    { wch: 50 }, // Descrição
    { wch: 18 }, // Unidade de Medida
    { wch: 20 }, // Unidade Descrição
    { wch: 12 }, // Família
    { wch: 30 }, // Família Descrição
    { wch: 18 }, // Família Comercial
    { wch: 30 }, // Fam. Comercial Descrição
    { wch: 18 }, // Grupo de Estoque
    { wch: 30 }, // Grupo Estoque Descrição
    { wch: 20 }, // GTIN
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados Base');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(wb, `${filename}_${item.itemCodigo}_${timestamp}.xlsx`);
};
