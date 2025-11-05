/**
 * Tópico: Exportação Avançada - Detalhes Técnicos
 */

import React from 'react';
import { Typography, Alert, Table, Tag } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const exportacaoAvancada: HelpTopicContent = {
  key: 'exportacaoAvancada',
  title: 'Exportação Avançada',
  content: (
    <div>
      <Paragraph>
        Esta seção fornece informações técnicas detalhadas sobre o sistema de exportação, úteis para
        usuários avançados e troubleshooting.
      </Paragraph>

      <Title level={4}>Arquitetura do Sistema de Exportação</Title>
      <Paragraph>
        O sistema utiliza o componente reutilizável <Text code>ExportToolbar</Text> que se adapta
        automaticamente ao tipo de conteúdo (tabular ou gráfico) habilitando apenas os formatos
        compatíveis.
      </Paragraph>

      <Title level={4}>Diferenças Técnicas entre Tipos de Exportação</Title>
      <Table
        dataSource={[
          {
            key: '1',
            formato: 'CSV',
            biblioteca: 'FileSaver.js',
            tipo: 'Tabular',
            caracteristicas: 'UTF-8 BOM, escape de vírgulas e aspas, formato RFC 4180',
          },
          {
            key: '2',
            formato: 'Excel',
            biblioteca: 'XLSX (SheetJS)',
            tipo: 'Tabular',
            caracteristicas: 'Largura automática de colunas, cabeçalhos formatados',
          },
          {
            key: '3',
            formato: 'PDF (Tabela)',
            biblioteca: 'jsPDF + autoTable',
            tipo: 'Tabular',
            caracteristicas: 'Modo retrato, fonte 8pt, paginação automática',
          },
          {
            key: '4',
            formato: 'PDF (Gráfico)',
            biblioteca: 'jsPDF + Canvas',
            tipo: 'Gráfico',
            caracteristicas: 'Modo paisagem, imagem PNG, resolução 2x',
          },
          {
            key: '5',
            formato: 'Imprimir (Tabela)',
            biblioteca: 'Window.print()',
            tipo: 'Tabular',
            caracteristicas: 'HTML estilizado, nova janela, fechamento automático',
          },
          {
            key: '6',
            formato: 'Imprimir (Gráfico)',
            biblioteca: 'Window.print()',
            tipo: 'Gráfico',
            caracteristicas: 'Imagem PNG, nova janela, responsivo',
          },
        ]}
        columns={[
          { title: 'Formato', dataIndex: 'formato', key: 'formato', width: 120 },
          { title: 'Biblioteca', dataIndex: 'biblioteca', key: 'biblioteca', width: 150 },
          { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 80 },
          { title: 'Características', dataIndex: 'caracteristicas', key: 'caracteristicas' },
        ]}
        pagination={false}
        size="small"
        style={{ marginBottom: 24 }}
      />

      <Title level={4}>Formato de Nomenclatura de Arquivos</Title>
      <Paragraph>O sistema gera nomes de arquivo automaticamente usando o padrão:</Paragraph>
      <Paragraph>
        <Text code>[baseName]_[timestamp].[extension]</Text>
      </Paragraph>
      <ul>
        <li>
          <Text strong>baseName:</Text> Nome descritivo da visualização (ex: "estrutura", "grafico")
        </li>
        <li>
          <Text strong>timestamp:</Text> Data e hora no formato YYYYMMDD_HHMMSS
        </li>
        <li>
          <Text strong>extension:</Text> Extensão do arquivo (csv, xlsx, pdf)
        </li>
      </ul>
      <Paragraph>Exemplo de implementação:</Paragraph>
      <Paragraph>
        <Text code>
          const timestamp = new
          Date().toISOString().slice(0,19).replace(/[-:]/g,'').replace('T','_');
        </Text>
      </Paragraph>

      <Title level={4}>Comportamento dos Botões</Title>
      <Alert
        message="Lógica de Habilitação/Desabilitação"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8, marginTop: 8 }}>
              Os botões são habilitados/desabilitados com base em props booleanas:
            </Paragraph>
            <ul style={{ marginBottom: 0 }}>
              <li>
                <Text code>csvEnabled</Text>: true para visualizações tabulares
              </li>
              <li>
                <Text code>excelEnabled</Text>: true para visualizações tabulares
              </li>
              <li>
                <Text code>pdfEnabled</Text>: sempre true (adapta-se ao tipo)
              </li>
              <li>
                <Text code>printEnabled</Text>: sempre true (adapta-se ao tipo)
              </li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Exportação de Gráficos - Detalhes Técnicos</Title>
      <Paragraph>Para exportar gráficos (ECharts), o sistema utiliza duas abordagens:</Paragraph>
      <ol>
        <li>
          <Text strong>Renderização Canvas:</Text> Se o gráfico usa renderer canvas, converte
          diretamente para imagem PNG usando <Text code>canvas.toDataURL('image/png')</Text>
        </li>
        <li>
          <Text strong>Renderização SVG:</Text> Se o gráfico usa renderer SVG, serializa o SVG e
          converte para canvas temporário com resolução 2x para melhor qualidade
        </li>
      </ol>
      <Paragraph>
        A resolução é dobrada (<Text code>width * 2, height * 2</Text>) para garantir qualidade em
        impressão.
      </Paragraph>

      <Title level={4}>Codificação e Compatibilidade</Title>
      <ul>
        <li>
          <Text strong>CSV:</Text> UTF-8 com BOM (<Text code>'\ufeff'</Text>) para garantir
          compatibilidade com Excel no Windows
        </li>
        <li>
          <Text strong>Excel:</Text> Formato XLSX nativo, compatível com Excel 2007+
        </li>
        <li>
          <Text strong>PDF:</Text> Formato PDF 1.3, compatível com todos os leitores
        </li>
        <li>
          <Text strong>Caracteres especiais:</Text> CSV escapa vírgulas, aspas e quebras de linha
          automaticamente
        </li>
      </ul>

      <Title level={4}>Limitações Conhecidas</Title>
      <Alert
        message="Limitações do Sistema"
        type="warning"
        showIcon
        description={
          <ul style={{ marginBottom: 0 }}>
            <li>Pop-ups devem estar habilitados para função de impressão funcionar</li>
            <li>
              PDFs de tabelas grandes podem ser divididos em múltiplas páginas automaticamente
            </li>
            <li>Gráficos muito grandes podem ter resolução reduzida para caber no PDF</li>
            <li>Navegadores mais antigos podem não suportar todas as funcionalidades</li>
            <li>Exportação SVG para PDF requer navegador moderno com suporte a Canvas API</li>
          </ul>
        }
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Troubleshooting</Title>

      <Title level={5}>Problema: Arquivo não baixa</Title>
      <ul>
        <li>Verifique se há bloqueio de downloads no navegador</li>
        <li>Verifique se há espaço em disco disponível</li>
        <li>Tente com outro formato de exportação</li>
        <li>Limpe o cache do navegador</li>
      </ul>

      <Title level={5}>Problema: Caracteres estranhos no CSV</Title>
      <ul>
        <li>Certifique-se de abrir o CSV com Excel (não Bloco de Notas)</li>
        <li>No Excel, use "Dados &gt; De Texto/CSV" e selecione UTF-8</li>
        <li>Alternativamente, use a exportação para Excel (XLSX)</li>
      </ul>

      <Title level={5}>Problema: Janela de impressão não abre</Title>
      <ul>
        <li>Habilite pop-ups para este site nas configurações do navegador</li>
        <li>Desabilite extensões de bloqueio de pop-ups temporariamente</li>
        <li>Use a exportação PDF como alternativa</li>
      </ul>

      <Title level={5}>Problema: Gráfico aparece em branco no PDF</Title>
      <ul>
        <li>Aguarde o gráfico carregar completamente antes de exportar</li>
        <li>Aumente o zoom da página e tente novamente</li>
        <li>Use a função Imprimir e salve como PDF pelo navegador</li>
        <li>Verifique se há erros no console do navegador (F12)</li>
      </ul>

      <Title level={5}>Problema: Tabela cortada no PDF</Title>
      <ul>
        <li>A biblioteca autoTable pagina automaticamente tabelas grandes</li>
        <li>Use exportação para Excel se preferir em uma única página</li>
        <li>Reduza o número de colunas visíveis antes de exportar</li>
      </ul>

      <Title level={4}>Compatibilidade de Navegadores</Title>
      <Table
        dataSource={[
          { key: '1', browser: 'Chrome/Edge', csv: '✓', excel: '✓', pdf: '✓', print: '✓' },
          { key: '2', browser: 'Firefox', csv: '✓', excel: '✓', pdf: '✓', print: '✓' },
          { key: '3', browser: 'Safari', csv: '✓', excel: '✓', pdf: '✓', print: '⚠' },
          { key: '4', browser: 'Opera', csv: '✓', excel: '✓', pdf: '✓', print: '✓' },
          { key: '5', browser: 'IE11', csv: '✗', excel: '✗', pdf: '✗', print: '✗' },
        ]}
        columns={[
          { title: 'Navegador', dataIndex: 'browser', key: 'browser' },
          { title: 'CSV', dataIndex: 'csv', key: 'csv', align: 'center' },
          { title: 'Excel', dataIndex: 'excel', key: 'excel', align: 'center' },
          { title: 'PDF', dataIndex: 'pdf', key: 'pdf', align: 'center' },
          { title: 'Imprimir', dataIndex: 'print', key: 'print', align: 'center' },
        ]}
        pagination={false}
        size="small"
        footer={() => (
          <div>
            <Tag color="success">✓ Suportado</Tag>
            <Tag color="warning">⚠ Suporte parcial</Tag>
            <Tag color="error">✗ Não suportado</Tag>
          </div>
        )}
      />

      <Title level={4} style={{ marginTop: 24 }}>
        Otimizações de Performance
      </Title>
      <ul>
        <li>Exportação de grandes datasets é processada de forma assíncrona</li>
        <li>Canvas de gráficos é reutilizado quando possível</li>
        <li>Arquivos são gerados no lado do cliente (sem requisição ao servidor)</li>
        <li>Liberação automática de memória após exportação (URL.revokeObjectURL)</li>
        <li>Compressão automática de imagens PNG em gráficos</li>
      </ul>

      <Title level={4}>Para Desenvolvedores</Title>
      <Paragraph>
        O componente <Text code>ExportToolbar</Text> é reutilizável e pode ser integrado em qualquer
        módulo. As funções de exportação estão em <Text code>exportUtils.ts</Text> e aceitam dados
        tipados.
      </Paragraph>
      <Paragraph>Exemplo de uso:</Paragraph>
      <Paragraph>
        <Text code style={{ whiteSpace: 'pre-wrap' }}>
          {`<ExportToolbar
  onExportCSV={() => exportToCSV(data, 'meus-dados.csv')}
  onExportExcel={() => exportToExcel(data, 'meus-dados.xlsx')}
  onExportPDF={() => exportTableToPDF(data, 'meus-dados.pdf')}
  onPrint={() => printTable(data)}
  csvEnabled={viewMode === 'table'}
  excelEnabled={viewMode === 'table'}
/>`}
        </Text>
      </Paragraph>
    </div>
  ),
  keywords: [
    'exportação',
    'avançado',
    'técnico',
    'troubleshooting',
    'problema',
    'erro',
    'compatibilidade',
    'navegador',
    'desenvolvedor',
    'api',
  ],
};
