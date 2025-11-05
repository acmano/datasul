// src/modules/engenharia/estrutura/utils/exportUtils.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FlatNode } from '../types/estrutura.types';

// CSV Export
export const exportToCSV = (flatNodes: FlatNode[], filename: string = 'estrutura.csv'): void => {
  const headers = ['Nível', 'Código', 'Descrição', 'Quantidade', 'Unidade Medida'];

  const rows = flatNodes
    .filter((node) => node.level > 0) // Exclude root level
    .map((node) => [
      node.level.toString(),
      node.code,
      node.name,
      typeof node.qty === 'number' ? node.qty.toFixed(7) : node.qty,
      node.unidadeMedida || '',
    ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape cells containing commas or quotes
          const cellStr = cell.toString();
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

// Excel Export
export const exportToExcel = (flatNodes: FlatNode[], filename: string = 'estrutura.xlsx'): void => {
  const data = flatNodes
    .filter((node) => node.level > 0) // Exclude root level
    .map((node) => ({
      Nível: node.level,
      Código: node.code,
      Descrição: node.name,
      Quantidade: typeof node.qty === 'number' ? node.qty : node.qty,
      'Unidade Medida': node.unidadeMedida || '',
    }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const columnWidths = [
    { wch: 10 }, // Nível
    { wch: 20 }, // Código
    { wch: 40 }, // Descrição
    { wch: 15 }, // Quantidade
    { wch: 15 }, // Unidade Medida
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estrutura');

  XLSX.writeFile(workbook, filename);
};

// PDF Table Export
export const exportTableToPDF = (
  flatNodes: FlatNode[],
  filename: string = 'estrutura.pdf'
): void => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text('Estrutura de Produto', 14, 15);

  // Table data
  const tableData = flatNodes
    .filter((node) => node.level > 0) // Exclude root level
    .map((node) => [
      node.level.toString(),
      node.code,
      node.name,
      typeof node.qty === 'number' ? node.qty.toFixed(7) : node.qty,
      node.unidadeMedida || '',
    ]);

  autoTable(doc, {
    head: [['Nível', 'Código', 'Descrição', 'Quantidade', 'UN']],
    body: tableData,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: {
      fillColor: [66, 139, 202] as any,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 30 },
      2: { cellWidth: 70 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15 },
    },
  });

  doc.save(filename);
};

// PDF Image Export (for charts/graphs)
export const exportChartToPDF = async (
  chartInstance: any,
  filename: string = 'grafico.pdf',
  title: string = 'Visualização da Estrutura'
): Promise<void> => {
  try {
    // Get chart as base64 image - using canvas renderer for proper image export
    const canvas = chartInstance.getDom().querySelector('canvas');
    let imageData: string;

    if (canvas) {
      // If canvas is available, use it directly
      imageData = canvas.toDataURL('image/png');
    } else {
      // Fallback: convert SVG to canvas
      const svgElement = chartInstance.getDom().querySelector('svg');
      if (!svgElement) {
        throw new Error('Could not find chart element');
      }

      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Wait for image to load
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          tempCanvas.width = svgElement.clientWidth * 2;
          tempCanvas.height = svgElement.clientHeight * 2;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          }
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG'));
        };
        img.src = url;
      });

      imageData = tempCanvas.toDataURL('image/png');
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add image
    const imgWidth = 277; // A4 landscape width minus margins
    const imgHeight = 180; // Proportional height
    doc.addImage(imageData, 'PNG', 14, 25, imgWidth, imgHeight);

    doc.save(filename);
  } catch (error) {
    console.error('Error exporting chart to PDF:', error);
    throw error;
  }
};

// Print Table
export const printTable = (flatNodes: FlatNode[]): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, habilite pop-ups para imprimir');
    return;
  }

  const tableRows = flatNodes
    .filter((node) => node.level > 0) // Exclude root level
    .map(
      (node) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${node.level}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${node.code}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${node.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
          ${typeof node.qty === 'number' ? node.qty.toFixed(7) : node.qty}
        </td>
        <td style="border: 1px solid #ddd; padding: 8px;">${node.unidadeMedida || ''}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Estrutura de Produto</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            font-size: 18px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            background-color: #428bca;
            color: white;
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Estrutura de Produto</h1>
        <table>
          <thead>
            <tr>
              <th>Nível</th>
              <th>Código</th>
              <th>Descrição</th>
              <th>Quantidade</th>
              <th>UN</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Print Chart
export const printChart = (
  chartInstance: any,
  title: string = 'Visualização da Estrutura'
): void => {
  try {
    // Get canvas or convert SVG to data URL
    const canvas = chartInstance.getDom().querySelector('canvas');
    let imageData: string;

    if (canvas) {
      imageData = canvas.toDataURL('image/png');
    } else {
      // For SVG, get SVG element directly for print
      const svgElement = chartInstance.getDom().querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        imageData = url;
      } else {
        throw new Error('Could not find chart element');
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, habilite pop-ups para imprimir');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <img src="${imageData}" alt="Chart" />
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing chart:', error);
    alert('Erro ao imprimir o gráfico');
  }
};
