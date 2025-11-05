/**
 * Tópico: Tipos de Visualização da Estrutura
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const visualizacoes: HelpTopicContent = {
  key: 'estrutura-visualizacoes',
  title: 'Tipos de Visualização da Estrutura',
  content: (
    <div>
      <Paragraph>
        O módulo de Estrutura oferece 5 tipos diferentes de visualização, cada uma com
        características específicas para diferentes necessidades de análise.
      </Paragraph>

      <Title level={4}>1. Tabela Hierárquica</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para análise detalhada, exportação de dados ou quando
        precisa ver informações tabulares.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>
          Visualização tabular com colunas: Nível, Código, Descrição, Quantidade, UN, Processo
        </li>
        <li>Expansão/colapso por níveis usando slider</li>
        <li>Indicador visual de níveis com barras coloridas</li>
        <li>Expansão inline de detalhes do processo de fabricação</li>
        <li>Virtualização para alta performance com milhares de itens</li>
        <li>Exportação para CSV, Excel, PDF e impressão</li>
      </ul>
      <Paragraph>
        <Text strong>Controles específicos:</Text> Slider para expandir/colapsar até determinado
        nível automaticamente.
      </Paragraph>

      <Title level={4}>2. Diagrama Sankey</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para visualizar fluxos e quantidades, entender como
        componentes fluem pela estrutura.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Diagrama de fluxo horizontal (esquerda para direita)</li>
        <li>Largura dos fluxos proporcional às quantidades</li>
        <li>Cores em degradê por nível hierárquico</li>
        <li>Exibição opcional de quantidades nos fluxos</li>
        <li>Altura dinâmica baseada no número de nós</li>
        <li>Scroll vertical para estruturas grandes</li>
      </ul>
      <Paragraph>
        <Text strong>Controles específicos:</Text> Ajuste de espaçamento vertical entre nós
        (5-60px).
      </Paragraph>

      <Title level={4}>3. Árvore</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para visão hierárquica clara e tradicional da estrutura de
        produtos.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Três orientações disponíveis: Vertical, Horizontal e Radial</li>
        <li>
          <Text strong>Vertical:</Text> Raiz no topo, expandindo para baixo (tradicional)
        </li>
        <li>
          <Text strong>Horizontal:</Text> Raiz à esquerda, expandindo para direita
        </li>
        <li>
          <Text strong>Radial:</Text> Raiz no centro, expandindo em círculo (ideal para estruturas
          complexas)
        </li>
        <li>Expansão/colapso de ramos (exceto no modo radial)</li>
        <li>Cores em degradê por nível</li>
      </ul>
      <Paragraph>
        <Text strong>Controles específicos:</Text> Seletor de orientação e ajuste de espaçamento
        entre nós.
      </Paragraph>

      <Title level={4}>4. Treemap</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para visualizar proporções e hierarquia em espaço compacto,
        ideal para estruturas com muitos componentes.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Visualização hierárquica em blocos retangulares aninhados</li>
        <li>Tamanho dos blocos pode refletir quantidades ou hierarquia</li>
        <li>Cores em degradê por nível hierárquico</li>
        <li>Labels com código e quantidade (quando habilitado)</li>
        <li>Navegação por clique nos blocos</li>
        <li>Breadcrumb automático mostrando o caminho</li>
      </ul>
      <Paragraph>
        <Text strong>Controles específicos:</Text> Ajuste de espaçamento entre blocos (0-10px).
      </Paragraph>

      <Title level={4}>5. Grafo de Rede</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para análise de dependências complexas, identificar
        relações cruzadas e gargalos.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Dois layouts disponíveis: Força (dinâmico) e Circular (organizado)</li>
        <li>
          <Text strong>Layout Força:</Text> Simulação física que organiza automaticamente os nós
        </li>
        <li>
          <Text strong>Layout Circular:</Text> Nós organizados em círculo para melhor legibilidade
        </li>
        <li>Filtro de profundidade para simplificar visualização</li>
        <li>Busca de componentes com highlight visual</li>
        <li>Nós arrastáveis para reorganização manual</li>
        <li>Destaque de adjacências ao passar o mouse</li>
      </ul>
      <Paragraph>
        <Text strong>Controles específicos:</Text> Slider de profundidade, busca de componentes e
        controles avançados de física (repulsão, comprimento, gravidade).
      </Paragraph>

      <Title level={4}>Escolhendo a Visualização Adequada</Title>
      <ul>
        <li>
          <Text strong>Análise Detalhada:</Text> Use Tabela
        </li>
        <li>
          <Text strong>Fluxo de Materiais:</Text> Use Sankey
        </li>
        <li>
          <Text strong>Visão Hierárquica Simples:</Text> Use Árvore
        </li>
        <li>
          <Text strong>Comparação de Proporções:</Text> Use Treemap
        </li>
        <li>
          <Text strong>Análise de Dependências:</Text> Use Grafo
        </li>
        <li>
          <Text strong>Apresentações:</Text> Use Árvore Radial ou Sankey
        </li>
      </ul>

      <Title level={4}>Dicas</Title>
      <ul>
        <li>Experimente diferentes visualizações para a mesma estrutura</li>
        <li>Ajuste cores para melhor contraste conforme o tema (claro/escuro)</li>
        <li>Use zoom e espaçamento para otimizar a legibilidade</li>
        <li>Todas as visualizações suportam drill-down com duplo clique</li>
        <li>Preferências de cada visualização são salvas separadamente</li>
      </ul>
    </div>
  ),
  keywords: [
    'visualização',
    'tabela',
    'sankey',
    'árvore',
    'treemap',
    'grafo',
    'diagrama',
    'fluxo',
    'hierarquia',
  ],
};
