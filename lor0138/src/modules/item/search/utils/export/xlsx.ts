import * as XLSX from 'xlsx';
import { ItemSearchResultItem } from '../../types/search.types';

export const exportSearchToXLSX = (
  data: ItemSearchResultItem[],
  filename: string = 'pesquisa_itens'
) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  const exportData = data.map((item) => ({
    Código: item.itemCodigo,
    Descrição: item.itemDescricao,
    Unidade: item.unidadeMedidaCodigo || '',
    Família: item.familiaCodigo || '',
    'Família Descrição': item.familiaDescricao || '',
    'Família Comercial': item.familiaComercialCodigo || '',
    'Fam. Comercial Descrição': item.familiaComercialDescricao || '',
    'Grupo Estoque': item.grupoEstoqueCodigo || '',
    'Grupo Estoque Descrição': item.grupoEstoqueDescricao || '',
    GTIN: item.gtin || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pesquisa');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};
