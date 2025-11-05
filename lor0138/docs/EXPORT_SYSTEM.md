# Sistema de Exportação - Documentação Técnica

## Visão Geral

Sistema unificado de exportação implementado para o módulo de Estrutura de Produtos, oferecendo suporte a múltiplos formatos de exportação e impressão. O sistema foi projetado para ser reutilizável e extensível.

## Arquitetura

### Estrutura de Arquivos

```
src/modules/engenharia/estrutura/
├── utils/
│   └── exportUtils.ts          # Funções de exportação (core)
└── components/
    ├── ExportToolbar.tsx       # Componente de UI para exportação
    ├── TabelaItensVirtualized.tsx  # Implementação para tabelas
    ├── Sankey.tsx              # Implementação para gráfico Sankey
    ├── Arvore.tsx              # Implementação para gráfico de árvore
    ├── Treemap.tsx             # Implementação para treemap
    └── Grafo.tsx               # Implementação para grafo
```

### Fluxo de Exportação

```
┌─────────────────┐
│  ExportToolbar  │  (UI Component)
│   - CSV Button  │
│   - Excel Button│
│   - PDF Button  │
│   - Print Button│
└────────┬────────┘
         │
         │ onClick handlers
         ▼
┌─────────────────────────┐
│   Component (Tabela,    │
│   Sankey, Arvore, etc)  │
│   - handleExportCSV()   │
│   - handleExportExcel() │
│   - handleExportPDF()   │
│   - handlePrint()       │
└────────┬────────────────┘
         │
         │ calls
         ▼
┌─────────────────────────┐
│   exportUtils.ts        │
│   - exportToCSV()       │
│   - exportToExcel()     │
│   - exportTableToPDF()  │
│   - exportChartToPDF()  │
│   - printTable()        │
│   - printChart()        │
└─────────────────────────┘
```

## Funções de Exportação

### 1. `exportToCSV()`

Exporta dados tabulares para formato CSV com suporte UTF-8.

**Assinatura:**
```typescript
export const exportToCSV = (
  flatNodes: FlatNode[],
  filename: string = 'estrutura.csv'
): void
```

**Parâmetros:**
- `flatNodes`: Array de nós achatados da estrutura
- `filename`: Nome do arquivo (padrão: 'estrutura.csv')

**Características:**
- Adiciona BOM UTF-8 (`\ufeff`) para compatibilidade com Excel
- Escapa células contendo vírgulas, aspas ou quebras de linha
- Filtra nível 0 (raiz) automaticamente
- Headers: Nível, Código, Descrição, Quantidade, Unidade Medida

**Implementação:**
```typescript
const csvContent = [
  headers.join(','),
  ...rows.map(row => row.map(cell => {
    const cellStr = cell.toString();
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  }).join(','))
].join('\n');

const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
saveAs(blob, filename);
```

**Uso:**
```typescript
const handleExportCSV = useCallback(() => {
  try {
    exportToCSV(flat, 'estrutura.csv');
    message.success('CSV exportado com sucesso!');
  } catch (error) {
    message.error('Erro ao exportar CSV');
    console.error('CSV export error:', error);
  }
}, [flat]);
```

---

### 2. `exportToExcel()`

Exporta dados para formato Excel (.xlsx) com formatação de colunas.

**Assinatura:**
```typescript
export const exportToExcel = (
  flatNodes: FlatNode[],
  filename: string = 'estrutura.xlsx'
): void
```

**Parâmetros:**
- `flatNodes`: Array de nós achatados da estrutura
- `filename`: Nome do arquivo (padrão: 'estrutura.xlsx')

**Características:**
- Utiliza biblioteca `xlsx` (SheetJS)
- Auto-dimensionamento de colunas
- Filtra nível 0 (raiz) automaticamente
- Cria planilha nomeada "Estrutura"

**Larguras de Coluna:**
- Nível: 10 caracteres
- Código: 20 caracteres
- Descrição: 40 caracteres
- Quantidade: 15 caracteres
- Unidade Medida: 15 caracteres

**Implementação:**
```typescript
const data = flatNodes
  .filter(node => node.level > 0)
  .map(node => ({
    'Nível': node.level,
    'Código': node.code,
    'Descrição': node.name,
    'Quantidade': typeof node.qty === 'number' ? node.qty : node.qty,
    'Unidade Medida': node.unidadeMedida || '',
  }));

const worksheet = XLSX.utils.json_to_sheet(data);
worksheet['!cols'] = columnWidths;

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Estrutura');
XLSX.writeFile(workbook, filename);
```

---

### 3. `exportTableToPDF()`

Exporta dados tabulares para PDF usando jsPDF e autoTable.

**Assinatura:**
```typescript
export const exportTableToPDF = (
  flatNodes: FlatNode[],
  filename: string = 'estrutura.pdf'
): void
```

**Parâmetros:**
- `flatNodes`: Array de nós achatados da estrutura
- `filename`: Nome do arquivo (padrão: 'estrutura.pdf')

**Características:**
- Título: "Estrutura de Produto" (tamanho 16)
- Tabela com estilo automático
- Header com fundo azul (#428bca)
- Fonte tamanho 8 para melhor legibilidade
- Larguras de coluna personalizadas

**Configuração:**
```typescript
autoTable(doc, {
  head: [['Nível', 'Código', 'Descrição', 'Quantidade', 'UN']],
  body: tableData,
  startY: 25,
  styles: { fontSize: 8 },
  headStyles: {
    fillColor: [66, 139, 202], // #428bca
  },
  columnStyles: {
    0: { cellWidth: 15 },   // Nível
    1: { cellWidth: 30 },   // Código
    2: { cellWidth: 70 },   // Descrição
    3: { cellWidth: 25 },   // Quantidade
    4: { cellWidth: 15 },   // UN
  },
});
```

---

### 4. `exportChartToPDF()` ⭐ CRÍTICO

Exporta visualizações gráficas (Sankey, Árvore, Treemap, Grafo) para PDF.

**IMPORTANTE:** Esta função resolve o bug crítico de "PNG signature" ao converter SVG para Canvas.

**Assinatura:**
```typescript
export const exportChartToPDF = async (
  chartInstance: any,
  filename: string = 'grafico.pdf',
  title: string = 'Visualização da Estrutura'
): Promise<void>
```

**Parâmetros:**
- `chartInstance`: Instância do ECharts
- `filename`: Nome do arquivo (padrão: 'grafico.pdf')
- `title`: Título do documento

**Características:**
- Formato: A4 landscape
- Dimensões: 277mm x 180mm (com margens)
- Suporta Canvas e SVG
- **Conversão SVG→Canvas→PNG** para evitar erros de assinatura

### 🐛 Solução do Bug "PNG Signature"

**Problema:**
O jsPDF não conseguia processar SVG diretamente, resultando em erro: "Supplied data is not a valid png image".

**Solução Implementada:**

```typescript
// 1. Detecta se é Canvas (preferencial) ou SVG
const canvas = chartInstance.getDom().querySelector('canvas');
let imageData: string;

if (canvas) {
  // Caminho direto para Canvas
  imageData = canvas.toDataURL('image/png');
} else {
  // Fallback: Converte SVG para Canvas
  const svgElement = chartInstance.getDom().querySelector('svg');

  // 2. Cria Canvas temporário
  const tempCanvas = document.createElement('canvas');
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // 3. Aguarda carregamento da imagem
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      tempCanvas.width = svgElement.clientWidth * 2;
      tempCanvas.height = svgElement.clientHeight * 2;
      const ctx = tempCanvas.getContext('2d');

      // 4. Pinta fundo branco
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 5. Desenha SVG no Canvas
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

  // 6. Converte Canvas para PNG base64
  imageData = tempCanvas.toDataURL('image/png');
}

// 7. Adiciona imagem PNG ao PDF
doc.addImage(imageData, 'PNG', 14, 25, imgWidth, imgHeight);
```

**Por que funciona:**
1. SVG é serializado para string XML
2. Blob cria URL temporária do SVG
3. Image carrega o SVG como imagem
4. Canvas recebe a imagem renderizada
5. `toDataURL('image/png')` gera PNG válido
6. jsPDF aceita PNG sem erros

**Uso:**
```typescript
const handleExportPDF = useCallback(async () => {
  if (chartRef.current) {
    try {
      const echartsInstance = chartRef.current.getEchartsInstance();
      await exportChartToPDF(echartsInstance, 'sankey.pdf', 'Diagrama Sankey');
      message.success('PDF exportado com sucesso!');
    } catch (error) {
      message.error('Erro ao exportar PDF');
      console.error('PDF export error:', error);
    }
  }
}, []);
```

---

### 5. `printTable()`

Imprime tabela em nova janela com formatação.

**Assinatura:**
```typescript
export const printTable = (flatNodes: FlatNode[]): void
```

**Parâmetros:**
- `flatNodes`: Array de nós achatados da estrutura

**Características:**
- Abre janela pop-up com conteúdo HTML
- Estilo responsivo para impressão
- Fecha janela automaticamente após impressão
- Header azul (#428bca) consistente com PDF

**Fluxo:**
1. Cria nova janela (`window.open`)
2. Gera HTML com tabela formatada
3. Aplica CSS de impressão (`@media print`)
4. Auto-dispara `window.print()` no `onload`
5. Fecha janela no `onafterprint`

---

### 6. `printChart()`

Imprime gráficos em nova janela.

**Assinatura:**
```typescript
export const printChart = (
  chartInstance: any,
  title: string = 'Visualização da Estrutura'
): void
```

**Parâmetros:**
- `chartInstance`: Instância do ECharts
- `title`: Título da impressão

**Características:**
- Suporta Canvas e SVG
- Imagem responsiva (`max-width: 100%`)
- Fecha janela automaticamente após impressão

**Diferença do PDF:**
- Não precisa aguardar conversão assíncrona
- Usa `toDataURL` diretamente ou URL do SVG blob

---

## ExportToolbar Component

Componente reutilizável de UI para botões de exportação.

### Props

```typescript
interface ExportToolbarProps {
  onExportCSV?: () => void;      // Handler para exportar CSV
  onExportExcel?: () => void;    // Handler para exportar Excel
  onExportPDF?: () => void;      // Handler para exportar PDF
  onPrint?: () => void;          // Handler para imprimir
  csvEnabled?: boolean;          // Habilita botão CSV (padrão: true)
  excelEnabled?: boolean;        // Habilita botão Excel (padrão: true)
  pdfEnabled?: boolean;          // Habilita botão PDF (padrão: true)
  printEnabled?: boolean;        // Habilita botão Print (padrão: true)
  size?: 'small' | 'middle' | 'large';  // Tamanho dos botões (padrão: 'small')
}
```

### Uso

```typescript
import ExportToolbar from './ExportToolbar';
import { exportToCSV, exportToExcel, exportTableToPDF, printTable } from '../utils/exportUtils';

// Em componente de tabela
<ExportToolbar
  onExportCSV={handleExportCSV}
  onExportExcel={handleExportExcel}
  onExportPDF={handleExportPDF}
  onPrint={handlePrint}
  csvEnabled={true}
  excelEnabled={true}
  pdfEnabled={true}
  printEnabled={true}
  size="small"
/>

// Em componente de gráfico (desabilita CSV/Excel)
<ExportToolbar
  onExportPDF={handleExportPDF}
  onPrint={handlePrint}
  csvEnabled={false}
  excelEnabled={false}
  pdfEnabled={true}
  printEnabled={true}
  size="small"
/>
```

### Estilos dos Botões

- **CSV**: Botão padrão com ícone `FileTextOutlined`
- **Excel**: Botão verde (`#52c41a`) com ícone `FileExcelOutlined`
- **PDF**: Botão vermelho (danger) com ícone `FilePdfOutlined`
- **Print**: Botão padrão com ícone `PrinterOutlined`

---

## Convenção de Nomes de Arquivo

O sistema segue um padrão consistente de nomeação:

### Padrão Base
```
{tipo}_{visualizacao}.{extensao}
```

### Exemplos por Visualização

**Tabela:**
- `estrutura.csv`
- `estrutura.xlsx`
- `estrutura.pdf`

**Sankey:**
- `sankey.pdf`
- Impressão: "Diagrama Sankey"

**Árvore:**
- `arvore.pdf`
- Impressão: "Árvore de Estrutura"

**Treemap:**
- `treemap.pdf`
- Impressão: "Treemap de Estrutura"

**Grafo:**
- `grafo.pdf`
- Impressão: "Grafo de Estrutura"

### Timestamp (Opcional)

Para evitar sobrescrever arquivos, considere adicionar timestamp:

```typescript
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = `estrutura_${timestamp}.xlsx`;
// Exemplo: estrutura_2025-10-22T23-15-30.xlsx
```

---

## Bibliotecas Utilizadas

### 1. jsPDF
**Versão:** ^2.x
**Propósito:** Geração de arquivos PDF
**Instalação:**
```bash
npm install jspdf
```

**Importação:**
```typescript
import jsPDF from 'jspdf';
```

**Uso Principal:**
- Criação de documentos PDF
- Configuração de layout (portrait/landscape)
- Adição de texto e imagens

---

### 2. jspdf-autotable
**Versão:** ^3.x
**Propósito:** Plugin para adicionar tabelas ao jsPDF
**Instalação:**
```bash
npm install jspdf-autotable
```

**Importação:**
```typescript
import autoTable from 'jspdf-autotable';
```

**Uso Principal:**
- Criação automática de tabelas formatadas
- Configuração de estilos (cores, fontes, larguras)
- Paginação automática

---

### 3. xlsx (SheetJS)
**Versão:** ^0.18.x
**Propósito:** Leitura e escrita de planilhas Excel
**Instalação:**
```bash
npm install xlsx
```

**Importação:**
```typescript
import * as XLSX from 'xlsx';
```

**Uso Principal:**
- Conversão JSON → Worksheet
- Configuração de larguras de coluna
- Criação de workbooks
- Escrita de arquivos .xlsx

---

### 4. file-saver
**Versão:** ^2.x
**Propósito:** Salvar arquivos no navegador
**Instalação:**
```bash
npm install file-saver
npm install -D @types/file-saver
```

**Importação:**
```typescript
import { saveAs } from 'file-saver';
```

**Uso Principal:**
- Download de Blobs como arquivos
- Compatibilidade cross-browser
- Utilizado principalmente para CSV

---

## Troubleshooting

### 1. Erro "Supplied data is not a valid png image"

**Causa:** jsPDF tentando processar SVG diretamente.

**Solução:** Converter SVG para Canvas antes de gerar PNG (já implementado em `exportChartToPDF`).

**Verificação:**
```typescript
// ✅ Correto
const imageData = tempCanvas.toDataURL('image/png');
doc.addImage(imageData, 'PNG', x, y, width, height);

// ❌ Errado
doc.addImage(svgElement, 'PNG', x, y, width, height);
```

---

### 2. CSV com caracteres especiais quebrados no Excel

**Causa:** Falta de BOM UTF-8.

**Solução:** Adicionar `\ufeff` no início do conteúdo.

**Verificação:**
```typescript
// ✅ Correto
const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

// ❌ Errado
const blob = new Blob([csvContent], { type: 'text/csv' });
```

---

### 3. Colunas do Excel muito estreitas

**Causa:** Falta de configuração de largura.

**Solução:** Definir `worksheet['!cols']`.

**Verificação:**
```typescript
// ✅ Correto
worksheet['!cols'] = [
  { wch: 10 },
  { wch: 20 },
  // ...
];

// ❌ Errado
// Sem configuração de colunas
```

---

### 4. Pop-up bloqueado ao imprimir

**Causa:** Navegador bloqueia `window.open()`.

**Solução:** Informar usuário e verificar retorno.

**Implementação:**
```typescript
const printWindow = window.open('', '_blank');
if (!printWindow) {
  alert('Por favor, habilite pop-ups para imprimir');
  return;
}
```

---

### 5. Imagem do gráfico cortada no PDF

**Causa:** Dimensões fixas inadequadas.

**Solução:** Usar dimensões proporcionais à página A4 landscape.

**Configuração correta:**
```typescript
const imgWidth = 277; // A4 landscape (297mm - 20mm margens)
const imgHeight = 180; // Proporcional
doc.addImage(imageData, 'PNG', 14, 25, imgWidth, imgHeight);
```

---

### 6. Erro ao exportar gráfico sem instância

**Causa:** Tentativa de exportar antes do gráfico renderizar.

**Solução:** Verificar se `chartRef.current` existe.

**Implementação:**
```typescript
const handleExportPDF = useCallback(async () => {
  if (!chartRef.current) {
    message.error('Gráfico não disponível');
    return;
  }

  try {
    const echartsInstance = chartRef.current.getEchartsInstance();
    await exportChartToPDF(echartsInstance, 'grafico.pdf');
  } catch (error) {
    console.error('Export error:', error);
    message.error('Erro ao exportar');
  }
}, []);
```

---

### 7. Quantidade com precisão incorreta

**Causa:** Conversão numérica inadequada.

**Solução:** Usar `toFixed(7)` para manter 7 casas decimais.

**Implementação:**
```typescript
// ✅ Correto
typeof node.qty === 'number' ? node.qty.toFixed(7) : node.qty

// ❌ Errado
node.qty.toString()
```

---

## Como Adicionar Novo Formato de Exportação

### Exemplo: Adicionar exportação para JSON

#### 1. Criar função em `exportUtils.ts`

```typescript
// src/modules/engenharia/estrutura/utils/exportUtils.ts

export const exportToJSON = (
  flatNodes: FlatNode[],
  filename: string = 'estrutura.json'
): void => {
  // 1. Preparar dados
  const data = flatNodes
    .filter(node => node.level > 0)
    .map(node => ({
      nivel: node.level,
      codigo: node.code,
      descricao: node.name,
      quantidade: node.qty,
      unidadeMedida: node.unidadeMedida || '',
      parentId: node.parentId,
      hasChildren: node.hasChildren,
    }));

  // 2. Converter para JSON formatado
  const jsonContent = JSON.stringify(data, null, 2);

  // 3. Criar Blob e salvar
  const blob = new Blob([jsonContent], { type: 'application/json' });
  saveAs(blob, filename);
};
```

#### 2. Adicionar botão ao `ExportToolbar.tsx`

```typescript
// src/modules/engenharia/estrutura/components/ExportToolbar.tsx

import { FileTextOutlined, FileExcelOutlined, FilePdfOutlined, PrinterOutlined, CodeOutlined } from '@ant-design/icons';

interface ExportToolbarProps {
  // ... props existentes
  onExportJSON?: () => void;
  jsonEnabled?: boolean;
}

const ExportToolbar: React.FC<ExportToolbarProps> = ({
  // ... props existentes
  onExportJSON,
  jsonEnabled = true,
}) => {
  return (
    <Space size="small">
      {/* ... botões existentes */}

      <Tooltip title={jsonEnabled ? 'Exportar para JSON' : 'Exportação JSON indisponível'}>
        <Button
          icon={<CodeOutlined />}
          size={size}
          disabled={!jsonEnabled}
          onClick={onExportJSON}
        >
          JSON
        </Button>
      </Tooltip>
    </Space>
  );
};
```

#### 3. Implementar handler no componente

```typescript
// src/modules/engenharia/estrutura/components/TabelaItensVirtualized.tsx

import { exportToCSV, exportToExcel, exportTableToPDF, printTable, exportToJSON } from '../utils/exportUtils';

const TabelaItensVirtualized: React.FC<TabelaItensVirtualizedProps> = ({ ... }) => {
  // ... código existente

  const handleExportJSON = useCallback(() => {
    try {
      exportToJSON(flat, 'estrutura.json');
      message.success('JSON exportado com sucesso!');
    } catch (error) {
      message.error('Erro ao exportar JSON');
      console.error('JSON export error:', error);
    }
  }, [flat]);

  return (
    <div>
      <ExportToolbar
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
        onExportJSON={handleExportJSON}
        jsonEnabled={true}
      />
      {/* ... resto do componente */}
    </div>
  );
};
```

#### 4. Adicionar testes

```typescript
// src/modules/engenharia/estrutura/utils/__tests__/exportUtils.test.ts

import { exportToJSON } from '../exportUtils';

describe('exportToJSON', () => {
  it('should export flat nodes to JSON format', () => {
    const mockNodes = [
      { id: '1', level: 0, code: 'ROOT', name: 'Root', qty: 1 },
      { id: '2', level: 1, code: 'ITEM-001', name: 'Item 1', qty: 10, parentId: '1' },
    ];

    const mockSaveAs = jest.fn();
    global.saveAs = mockSaveAs;

    exportToJSON(mockNodes, 'test.json');

    expect(mockSaveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'test.json'
    );
  });
});
```

---

## Checklist para Novo Formato

- [ ] Criar função em `exportUtils.ts`
- [ ] Adicionar tipo ao TypeScript (se necessário)
- [ ] Adicionar prop ao `ExportToolbar`
- [ ] Adicionar botão ao `ExportToolbar`
- [ ] Implementar handler em cada visualização
- [ ] Atualizar convenção de nomes
- [ ] Adicionar testes unitários
- [ ] Atualizar esta documentação
- [ ] Testar em diferentes navegadores
- [ ] Validar acessibilidade

---

## Considerações de Performance

### 1. Estruturas Grandes

Para estruturas com muitos níveis ou itens:

```typescript
// Considere adicionar loading state
const [isExporting, setIsExporting] = useState(false);

const handleExportExcel = useCallback(async () => {
  setIsExporting(true);
  try {
    // Use setTimeout para não bloquear UI
    setTimeout(() => {
      exportToExcel(flat, 'estrutura.xlsx');
      message.success('Excel exportado com sucesso!');
      setIsExporting(false);
    }, 100);
  } catch (error) {
    setIsExporting(false);
    message.error('Erro ao exportar Excel');
  }
}, [flat]);
```

### 2. Conversão SVG para Canvas

A conversão SVG→Canvas é intensiva. Para gráficos grandes:

```typescript
// Considere adicionar indicador de progresso
message.loading('Gerando PDF...', 0);

try {
  await exportChartToPDF(echartsInstance, 'grafico.pdf');
  message.destroy();
  message.success('PDF exportado com sucesso!');
} catch (error) {
  message.destroy();
  message.error('Erro ao exportar PDF');
}
```

### 3. Memória

Para datasets muito grandes, considere exportação em lotes:

```typescript
const BATCH_SIZE = 1000;

export const exportLargeDataToExcel = (
  flatNodes: FlatNode[],
  filename: string = 'estrutura.xlsx'
): void => {
  const batches = [];
  for (let i = 0; i < flatNodes.length; i += BATCH_SIZE) {
    batches.push(flatNodes.slice(i, i + BATCH_SIZE));
  }

  // Processar batches...
};
```

---

## Referências

### Documentação Oficial

- [jsPDF](https://github.com/parallax/jsPDF)
- [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [SheetJS (xlsx)](https://docs.sheetjs.com/)
- [file-saver](https://github.com/eligrey/FileSaver.js/)

### Exemplos Relacionados

- `/src/modules/engenharia/estrutura/components/TabelaItensVirtualized.tsx` - Implementação completa para tabelas
- `/src/modules/engenharia/estrutura/components/Sankey.tsx` - Implementação para gráficos

---

## Changelog

### v1.0.0 - 2025-10-22
- Implementação inicial do sistema de exportação
- Suporte a CSV, Excel, PDF (tabela e gráfico) e impressão
- Solução do bug "PNG signature" com conversão SVG→Canvas→PNG
- Componente `ExportToolbar` reutilizável
- Documentação completa

---

## Contribuindo

Para adicionar novos formatos ou melhorias:

1. Siga o padrão arquitetural existente
2. Adicione função em `exportUtils.ts`
3. Atualize `ExportToolbar` se necessário
4. Implemente handlers em componentes
5. Adicione testes
6. Atualize esta documentação
7. Envie PR com descrição detalhada

---

**Documentação mantida por:** Equipe de Engenharia
**Última atualização:** 2025-10-22
**Versão:** 1.0.0
