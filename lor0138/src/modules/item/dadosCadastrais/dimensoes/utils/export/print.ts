// src/modules/item/dadosCadastrais/dimensoes/utils/export/print.ts

import { ItemDimensoes } from '../../types';

export const printDimensoes = (dimensoes: ItemDimensoes) => {
  if (!dimensoes) {
    alert('Não há dados para imprimir');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  const formatNumber = (value: number, decimals: number = 4): string => {
    return value.toFixed(decimals);
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dimensões - ${dimensoes.itemCodigo}</title>
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
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 10px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: center;
        }
        th {
          background-color: #1890ff;
          color: white;
          font-weight: bold;
          writing-mode: horizontal-tb;
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
          table {
            page-break-inside: avoid;
          }
          @page {
            size: landscape;
          }
        }
      </style>
    </head>
    <body>
      <h1>Dimensões do Item</h1>
      <p><strong>Item:</strong> ${dimensoes.itemCodigo} - ${dimensoes.itemDescricao}</p>
      
      <table>
        <thead>
          <tr>
            <th>Peça<br>Altura (m)</th>
            <th>Peça<br>Largura (m)</th>
            <th>Peça<br>Profund. (m)</th>
            <th>Peça<br>Peso (kg)</th>
            <th>Item Emb.<br>Altura (m)</th>
            <th>Item Emb.<br>Largura (m)</th>
            <th>Item Emb.<br>Profund. (m)</th>
            <th>Item Emb.<br>Peso (kg)</th>
            <th>Item Embal.<br>Altura (m)</th>
            <th>Item Embal.<br>Largura (m)</th>
            <th>Item Embal.<br>Profund. (m)</th>
            <th>Item Embal.<br>Peso (kg)</th>
            <th>Peças por<br>Item</th>
            <th>Prod. Emb.<br>Altura (m)</th>
            <th>Prod. Emb.<br>Largura (m)</th>
            <th>Prod. Emb.<br>Profund. (m)</th>
            <th>Prod. Emb.<br>Peso (kg)</th>
            <th>Prod. Embal.<br>Altura (m)</th>
            <th>Prod. Embal.<br>Largura (m)</th>
            <th>Prod. Embal.<br>Profund. (m)</th>
            <th>Prod. Embal.<br>Peso (kg)</th>
            <th>Itens por<br>Produto</th>
            <th>GTIN-13</th>
            <th>Caixa<br>Altura (m)</th>
            <th>Caixa<br>Largura (m)</th>
            <th>Caixa<br>Profund. (m)</th>
            <th>Caixa<br>Peso (kg)</th>
            <th>Produtos<br>por Caixa</th>
            <th>Caixa<br>Sigla</th>
            <th>GTIN-14</th>
            <th>Palete<br>Lastro</th>
            <th>Palete<br>Camadas</th>
            <th>Caixas por<br>Palete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${formatNumber(dimensoes.peca.altura)}</td>
            <td>${formatNumber(dimensoes.peca.largura)}</td>
            <td>${formatNumber(dimensoes.peca.profundidade)}</td>
            <td>${formatNumber(dimensoes.peca.peso)}</td>
            <td>${formatNumber(dimensoes.item.embalagem.altura)}</td>
            <td>${formatNumber(dimensoes.item.embalagem.largura)}</td>
            <td>${formatNumber(dimensoes.item.embalagem.profundidade)}</td>
            <td>${formatNumber(dimensoes.item.embalagem.peso)}</td>
            <td>${formatNumber(dimensoes.item.embalado.altura)}</td>
            <td>${formatNumber(dimensoes.item.embalado.largura)}</td>
            <td>${formatNumber(dimensoes.item.embalado.profundidade)}</td>
            <td>${formatNumber(dimensoes.item.embalado.peso)}</td>
            <td>${dimensoes.item.pecas}</td>
            <td>${formatNumber(dimensoes.produto.embalagem.altura)}</td>
            <td>${formatNumber(dimensoes.produto.embalagem.largura)}</td>
            <td>${formatNumber(dimensoes.produto.embalagem.profundidade)}</td>
            <td>${formatNumber(dimensoes.produto.embalagem.peso)}</td>
            <td>${formatNumber(dimensoes.produto.embalado.altura)}</td>
            <td>${formatNumber(dimensoes.produto.embalado.largura)}</td>
            <td>${formatNumber(dimensoes.produto.embalado.profundidade)}</td>
            <td>${formatNumber(dimensoes.produto.embalado.peso)}</td>
            <td>${dimensoes.produto.itens}</td>
            <td>${dimensoes.produto.gtin13 || '-'}</td>
            <td>${formatNumber(dimensoes.caixa.embalagem.altura)}</td>
            <td>${formatNumber(dimensoes.caixa.embalagem.largura)}</td>
            <td>${formatNumber(dimensoes.caixa.embalagem.profundidade)}</td>
            <td>${formatNumber(dimensoes.caixa.embalagem.peso)}</td>
            <td>${dimensoes.caixa.produtos}</td>
            <td>${dimensoes.caixa.embalagem.sigla || '-'}</td>
            <td>${dimensoes.caixa.gtin14 ? String(dimensoes.caixa.gtin14) : '-'}</td>
            <td>${dimensoes.palete.lastro}</td>
            <td>${dimensoes.palete.camadas}</td>
            <td>${dimensoes.palete.caixasPalete}</td>
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
