/**
 * Tópico: Exportação de Dados
 */

import React from 'react';
import { Typography, Alert } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const exportacao: HelpTopicContent = {
  key: 'exportacao',
  title: 'Exportação de Dados',
  content: (
    <div>
      <Paragraph>
        Cada aba possui uma barra de ferramentas de exportação que permite salvar os dados em
        diferentes formatos, adaptados ao tipo de conteúdo exibido (tabela ou gráfico).
      </Paragraph>

      <Title level={4}>Formatos Disponíveis</Title>
      <ul>
        <li>
          <Text strong>CSV:</Text> Arquivo texto separado por vírgulas, ideal para importação em
          Excel ou outros sistemas. Disponível apenas para dados tabulares.
        </li>
        <li>
          <Text strong>Excel (XLSX):</Text> Planilha Microsoft Excel com formatação automática de
          colunas e cabeçalhos. Disponível apenas para dados tabulares.
        </li>
        <li>
          <Text strong>PDF:</Text> Documento portátil para impressão e compartilhamento. Disponível
          para tabelas (formato tabular) e gráficos (como imagem).
        </li>
        <li>
          <Text strong>Imprimir:</Text> Abre diálogo de impressão do navegador com formatação
          otimizada. Disponível para tabelas e gráficos.
        </li>
      </ul>

      <Title level={4}>Exportação de Tabelas vs Gráficos</Title>
      <Paragraph>
        O sistema detecta automaticamente o tipo de visualização e habilita apenas os formatos
        compatíveis:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Visualização em Tabela:</Text> Todos os formatos estão disponíveis (CSV,
          Excel, PDF, Imprimir)
        </li>
        <li>
          <Text strong>Visualização em Gráfico:</Text> Apenas PDF e Imprimir estão disponíveis
          (exportação como imagem)
        </li>
      </ul>
      <Alert
        message="Botões Desabilitados"
        description="Quando um botão está desabilitado (acinzentado), passe o mouse sobre ele para ver a mensagem explicativa do motivo."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Como Exportar</Title>
      <Paragraph>
        1. Selecione um item na pesquisa
        <br />
        2. Navegue até a aba desejada
        <br />
        3. Escolha o tipo de visualização (Tabela ou Gráfico, quando disponível)
        <br />
        4. Clique no botão do formato desejado na barra de ferramentas
        <br />
        5. O arquivo será baixado automaticamente ou abrirá a janela de impressão
      </Paragraph>

      <Title level={4}>Nomenclatura de Arquivos</Title>
      <Paragraph>Os arquivos exportados são nomeados automaticamente seguindo o padrão:</Paragraph>
      <Paragraph>
        <Text code>[nome-da-visualizacao]_[YYYYMMDD_HHMMSS].[extensão]</Text>
      </Paragraph>
      <Paragraph>
        Exemplo: <Text code>estrutura_20250122_143025.xlsx</Text>
      </Paragraph>

      <Title level={4}>Observações Importantes</Title>
      <ul>
        <li>Os botões de exportação ficam desabilitados quando não há dados para exportar</li>
        <li>Cada aba exporta apenas os dados da visualização atual</li>
        <li>Dados tabulares incluem todas as colunas visíveis na tabela</li>
        <li>Gráficos são exportados em alta resolução (PNG para imagem, PDF em modo paisagem)</li>
        <li>A formatação do CSV usa codificação UTF-8 com BOM para compatibilidade com Excel</li>
        <li>Para impressão, certifique-se de que pop-ups estão habilitados no navegador</li>
      </ul>

      <Title level={4}>Dicas</Title>
      <ul>
        <li>Use CSV para análises rápidas e importação em outros sistemas</li>
        <li>Use Excel quando precisar de formatação e colunas com largura ajustada</li>
        <li>Use PDF para documentação, apresentações e arquivamento</li>
        <li>Use Imprimir para gerar PDFs customizados através do navegador</li>
      </ul>
    </div>
  ),
  keywords: ['exportação', 'csv', 'excel', 'pdf', 'imprimir', 'download', 'salvar', 'arquivo'],
};
