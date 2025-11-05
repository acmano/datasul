/**
 * Tópico: Exportação em Catálogo
 */

import React from 'react';
import { Typography, Alert, Tag } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const exportacaoCatalogo: HelpTopicContent = {
  key: 'exportacaoCatalogo',
  title: 'Exportação em Catálogo',
  content: (
    <div>
      <Paragraph>
        A <Text strong>Exportação em Catálogo</Text> permite exportar informações completas de
        múltiplos itens simultaneamente, incluindo dados de todas as abas (Resultado, Dimensões,
        Planejamento, Manufatura, Fiscal e Suprimentos). Este recurso é ideal para criar relatórios
        consolidados, realizar análises em massa ou extrair um catálogo completo de produtos.
      </Paragraph>

      <Title level={4}>Modo de Exportação</Title>
      <Paragraph>
        Na aba <Text strong>Resultado</Text>, você encontrará um toggle que permite alternar entre
        dois modos de exportação:
      </Paragraph>
      <ul>
        <li>
          <Tag color="blue">Item Selecionado</Tag>
          <Text>
            : Exporta apenas os dados do item atualmente selecionado na tabela. Todos os formatos
            estão disponíveis (CSV, Excel, PDF, Imprimir).
          </Text>
        </li>
        <li>
          <Tag color="green">Catálogo</Tag>
          <Text>
            : Exporta dados completos de todos os itens retornados na pesquisa. Apenas CSV e Excel
            estão disponíveis (PDF e Imprimir ficam desabilitados).
          </Text>
        </li>
      </ul>

      <Alert
        message="Modo Catálogo Ativado"
        description="Quando o modo Catálogo está ativo, o sistema processa automaticamente todos os itens da pesquisa, independente de qual item está selecionado na tabela."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Formatos de Catálogo</Title>
      <Paragraph>No modo Catálogo, você pode escolher entre três formatos:</Paragraph>
      <ul>
        <li>
          <Text strong>CSV:</Text> Exporta todos os dados em um único arquivo CSV com todas as
          informações consolidadas. Ideal para máxima compatibilidade e processamento em outros
          sistemas.
        </li>
        <li>
          <Text strong>Excel - Planilha Única:</Text> Cria um arquivo Excel com todas as abas
          combinadas em uma única planilha. Útil para análise rápida de todos os dados juntos.
        </li>
        <li>
          <Text strong>Excel - Múltiplas Abas:</Text> Cria um arquivo Excel com abas separadas para
          cada tipo de informação (Resultado, Dimensões, Planejamento, etc.). Recomendado para
          manter a organização dos dados por categoria.
        </li>
      </ul>

      <Title level={4}>Abas Incluídas</Title>
      <Paragraph>
        A exportação em catálogo inclui dados das seguintes abas quando disponíveis:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Resultado:</Text> Dados básicos do item (código, descrição, tipo, unidade,
          situação, etc.)
        </li>
        <li>
          <Text strong>Dimensões:</Text> Informações dimensionais (altura, largura, profundidade,
          peso, volume)
        </li>
        <li>
          <Text strong>Planejamento:</Text> Dados de planejamento e controle de estoque
        </li>
        <li>
          <Text strong>Manufatura:</Text> Informações de produção e manufatura
        </li>
        <li>
          <Text strong>Fiscal:</Text> Classificações fiscais e tributárias
        </li>
        <li>
          <Text strong>Suprimentos:</Text> Dados de compras e fornecimento (quando implementado)
        </li>
      </ul>

      <Title level={4}>Indicador de Progresso</Title>
      <Paragraph>
        Durante o processamento da exportação em catálogo, uma janela modal exibe o progresso em
        tempo real:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Mensagem principal:</Text> "Processando item N de M" indica quantos itens já
          foram processados
        </li>
        <li>
          <Text strong>Barra de progresso:</Text> Mostra visualmente o percentual concluído
        </li>
        <li>
          <Text strong>Não feche a página:</Text> Aguarde até que o processamento seja concluído
          para não perder os dados
        </li>
      </ul>

      <Alert
        message="Tempo de Processamento"
        description="O tempo de processamento varia conforme a quantidade de itens e a complexidade dos dados. Para centenas de itens, o processo pode levar alguns minutos."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Como Usar</Title>
      <Paragraph>
        1. <Text strong>Realize uma pesquisa de itens</Text> utilizando os filtros desejados na área
        de pesquisa
        <br />
        2. <Text strong>Na aba "Resultado"</Text>, localize o toggle de modo de exportação acima da
        barra de ferramentas
        <br />
        3. <Text strong>Ative o modo "Catálogo"</Text> clicando no toggle
        <br />
        4. <Text strong>Escolha o formato desejado</Text> (apenas para Excel):
        <br />
        &nbsp;&nbsp;&nbsp;• Para CSV, não há opções adicionais
        <br />
        &nbsp;&nbsp;&nbsp;• Para Excel, selecione "Planilha Única" ou "Múltiplas Abas"
        <br />
        5. <Text strong>Clique no botão CSV ou Excel</Text> na barra de ferramentas
        <br />
        6. <Text strong>Aguarde o processamento</Text> - uma janela modal mostrará o progresso
        <br />
        7. <Text strong>O arquivo será baixado automaticamente</Text> ao finalizar o processamento
      </Paragraph>

      <Title level={4}>Observações Importantes</Title>
      <ul>
        <li>
          No modo Catálogo, apenas os botões <Text strong>CSV</Text> e <Text strong>Excel</Text>{' '}
          ficam habilitados
        </li>
        <li>
          Os botões <Text strong>PDF</Text> e <Text strong>Imprimir</Text> são automaticamente
          desabilitados no modo Catálogo
        </li>
        <li>O indicador de progresso mostra qual item está sendo processado no momento</li>
        <li>Todos os itens retornados na pesquisa são incluídos, independente de paginação</li>
        <li>
          Não há limite de quantidade de itens, mas processamentos muito grandes podem demorar
        </li>
        <li>O sistema utiliza cache quando disponível para melhorar a performance</li>
        <li>Abas sem dados para um item específico não impedem a exportação dos demais dados</li>
        <li>
          A nomenclatura dos arquivos segue o padrão:{' '}
          <Text code>catalogo_[formato]_[YYYYMMDD_HHMMSS].[extensão]</Text>
        </li>
      </ul>

      <Title level={4}>Dicas</Title>
      <ul>
        <li>
          Use <Text strong>Planilha Única</Text> quando precisar fazer análises rápidas com todos os
          dados juntos no Excel
        </li>
        <li>
          Use <Text strong>Múltiplas Abas</Text> quando quiser manter os dados organizados por
          categoria (recomendado)
        </li>
        <li>
          Use <Text strong>CSV</Text> quando precisar da máxima compatibilidade com outros sistemas
          ou ferramentas de análise
        </li>
        <li>
          Refine sua pesquisa antes de exportar para incluir apenas os itens realmente necessários
        </li>
        <li>
          Para grandes volumes, considere fazer a exportação em horários de menor movimento do
          sistema
        </li>
        <li>Verifique o espaço em disco disponível antes de exportar catálogos muito grandes</li>
        <li>
          O modo Catálogo é especialmente útil para criação de bases de dados offline ou backups
        </li>
      </ul>

      <Alert
        message="Retorne ao Modo Item Selecionado"
        description="Após realizar a exportação em catálogo, lembre-se de desativar o modo Catálogo se desejar voltar a exportar apenas o item selecionado."
        type="info"
        showIcon
      />
    </div>
  ),
  keywords: [
    'catálogo',
    'exportação',
    'batch',
    'múltiplos itens',
    'todos itens',
    'planilha única',
    'múltiplas abas',
    'exportação em massa',
    'todos os resultados',
    'progresso',
    'processamento',
  ],
};
