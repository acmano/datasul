// src/modules/item/dadosCadastrais/informacoesGerais/utils/export/csv.ts

import { ItemSearchResultItem } from '../../../../search/types/search.types';

export const exportBaseToCSV = (item: ItemSearchResultItem, filename: string = 'item_base') => {
  if (!item) {
    alert('Não há dados para exportar');
    return;
  }

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

  const csvRows = [headers.map((h) => `"${h}"`).join(';'), values.map((v) => `"${v}"`).join(';')];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${item.itemCodigo}_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
