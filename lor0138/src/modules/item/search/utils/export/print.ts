import { ItemSearchResultItem } from '../../types/search.types';

export const printSearch = (data: ItemSearchResultItem[]) => {
  if (!data || data.length === 0) {
    alert('Não há dados para imprimir');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pesquisa de Itens</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 20px; margin-bottom: 5px; }
          .info { font-size: 12px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #1890ff; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Pesquisa de Itens - Resultados</h1>
        <div class="info">
          <div>Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
          <div>Total: ${data.length} item(ns)</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Unidade</th>
              <th>Família</th>
              <th>Família Comercial</th>
              <th>Grupo Estoque</th>
              <th>GTIN</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (item) => `
              <tr>
                <td>${item.itemCodigo}</td>
                <td>${item.itemDescricao}</td>
                <td>${item.unidadeMedidaCodigo || ''}</td>
                <td>${item.familiaCodigo || ''}</td>
                <td>${item.familiaComercialCodigo || ''}</td>
                <td>${item.grupoEstoqueCodigo || ''}</td>
                <td>${item.gtin || ''}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <br>
        <button onclick="window.print()">Imprimir</button>
        <button onclick="window.close()">Fechar</button>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
