// src/modules/item/dadosCadastrais/informacoesGerais/utils/export/print.ts

import { ItemSearchResultItem } from '../../../../search/types/search.types';

export const printBase = (item: ItemSearchResultItem) => {
  if (!item) {
    alert('Não há dados para imprimir');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dados Base - ${item.itemCodigo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1890ff;
          border-bottom: 2px solid #1890ff;
          padding-bottom: 10px;
        }
        h2 {
          color: #555;
          margin-top: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #1890ff;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        @media print {
          body {
            margin: 0;
          }
          h1 {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>Dados Base do Item</h1>
      <h2>Item: ${item.itemCodigo} - ${item.itemDescricao}</h2>
      
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Unidade de Medida</th>
            <th>Unidade Descrição</th>
            <th>Família</th>
            <th>Família Descrição</th>
            <th>Família Comercial</th>
            <th>Fam. Comercial Descrição</th>
            <th>Grupo de Estoque</th>
            <th>Grupo Estoque Descrição</th>
            <th>GTIN</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${item.itemCodigo}</td>
            <td>${item.itemDescricao}</td>
            <td>${item.unidadeMedidaCodigo || '-'}</td>
            <td>${item.unidadeMedidaDescricao || '-'}</td>
            <td>${item.familiaCodigo || '-'}</td>
            <td>${item.familiaDescricao || '-'}</td>
            <td>${item.familiaComercialCodigo || '-'}</td>
            <td>${item.familiaComercialDescricao || '-'}</td>
            <td>${item.grupoEstoqueCodigo || '-'}</td>
            <td>${item.grupoEstoqueDescricao || '-'}</td>
            <td>${item.gtin || '-'}</td>
          </tr>
        </tbody>
      </table>
      
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
