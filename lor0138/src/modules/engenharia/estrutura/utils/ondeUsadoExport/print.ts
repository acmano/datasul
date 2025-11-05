import { TreeNodeOndeUsado } from '../../types/ondeUsado.types';

/**
 * Imprime Onde Usado com cabeçalho apropriado
 */
export const printOndeUsado = (tree: TreeNodeOndeUsado | null) => {
  if (!tree) {
    alert('Não há dados para imprimir');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  const rows: string[] = [];

  const walkTree = (node: TreeNodeOndeUsado, level: number) => {
    const indent = '&nbsp;&nbsp;'.repeat(level);
    const levelPrefix = level > 0 ? `${indent}└─&nbsp;` : '';
    const qty = (node.qty || 1).toFixed(7);
    const processo = node.hasProcess ? 'Sim' : 'Não';
    const unidade = node.unidadeMedida || '';

    rows.push(`
      <tr>
        <td>${level}</td>
        <td>${node.code}</td>
        <td style="text-align: left; font-family: 'Courier New', monospace;">${levelPrefix}${node.name}</td>
        <td>${qty}</td>
        <td>${unidade}</td>
        <td>${processo}</td>
      </tr>
    `);

    node.children.forEach((child) => {
      walkTree(child, level + 1);
    });
  };

  walkTree(tree, 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Onde Usado - ${tree.code}</title>
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
          padding: 8px;
          text-align: center;
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
            margin: 10px;
          }
          h1 {
            page-break-after: avoid;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <h1>Onde Usado (Where Used)</h1>
      <p><strong>Item:</strong> ${tree.code} - ${tree.name}</p>

      <table>
        <thead>
          <tr>
            <th>Nível</th>
            <th>Código</th>
            <th style="width: 50%;">Descrição</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Tem Processo</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
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
