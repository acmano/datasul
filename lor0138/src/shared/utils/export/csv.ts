import { ItemSearchResultItem } from '../../../modules/item/search/types/search.types';

export const exportToCSV = (data: ItemSearchResultItem[], filename: string = 'itens') => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Cabeçalhos
  const headers = [
    'Código',
    'Descrição',
    'Unidade',
    'Família',
    'Família Descrição',
    'Família Comercial',
    'Fam. Comercial Descrição',
    'Grupo Estoque',
    'Grupo Estoque Descrição',
    'GTIN',
  ];

  // Converter dados para CSV
  const csvRows = [
    headers.join(';'),
    ...data.map((item) =>
      [
        item.itemCodigo,
        `"${item.itemDescricao}"`,
        item.unidadeMedidaCodigo || '',
        item.familiaCodigo || '',
        `"${item.familiaDescricao || ''}"`,
        item.familiaComercialCodigo || '',
        `"${item.familiaComercialDescricao || ''}"`,
        item.grupoEstoqueCodigo || '',
        `"${item.grupoEstoqueDescricao || ''}"`,
        item.gtin || '',
      ].join(';')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
