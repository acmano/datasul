/**
 * Tópico: Controles das Visualizações de Estrutura
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const controles: HelpTopicContent = {
  key: 'estrutura-controles',
  title: 'Controles das Visualizações de Estrutura',
  content: (
    <div>
      <Paragraph>
        Todas as visualizações de estrutura possuem controles integrados para personalização da
        exibição. Os controles variam conforme o tipo de visualização, mas alguns são comuns a
        todas.
      </Paragraph>

      <Title level={4}>Controles Comuns</Title>

      <Title level={5}>Mostrar Quantidade</Title>
      <Paragraph>
        <Text strong>Switch on/off</Text> que controla a exibição de quantidades nos componentes.
      </Paragraph>
      <ul>
        <li>Quando ligado: Mostra quantidade necessária de cada componente</li>
        <li>Quando desligado: Oculta quantidades para visualização mais limpa</li>
        <li>Útil para focar na estrutura hierárquica sem informações numéricas</li>
      </ul>

      <Title level={5}>Cor Base</Title>
      <Paragraph>
        <Text strong>Seletor de cor</Text> que define a cor inicial do degradê de níveis.
      </Paragraph>
      <ul>
        <li>Clique no quadrado colorido para abrir o seletor</li>
        <li>O sistema gera automaticamente cores para cada nível baseado nesta cor</li>
        <li>Níveis mais profundos recebem cores mais claras (degradê)</li>
        <li>Ajuste para melhor contraste com o tema (claro/escuro)</li>
      </ul>

      <Title level={5}>Cor de Fundo</Title>
      <Paragraph>
        <Text strong>Seletor de cor</Text> que define a cor de fundo da visualização.
      </Paragraph>
      <ul>
        <li>Útil para ajustar contraste conforme necessidade</li>
        <li>Facilita impressão ou captura de tela</li>
        <li>Independente do tema do sistema</li>
      </ul>

      <Title level={5}>Zoom</Title>
      <Paragraph>
        <Text strong>Slider + campo numérico</Text> (50% - 200%) para ajustar o tamanho da
        visualização.
      </Paragraph>
      <ul>
        <li>Arraste o slider ou digite o valor percentual</li>
        <li>Valores baixos (50-80%): Para estruturas muito grandes</li>
        <li>Valor padrão (100%): Tamanho original</li>
        <li>Valores altos (120-200%): Para melhor legibilidade</li>
        <li>Scroll aparece automaticamente quando necessário</li>
      </ul>

      <Title level={5}>Espaçamento</Title>
      <Paragraph>
        <Text strong>Slider + campo numérico</Text> para ajustar o espaço entre elementos.
      </Paragraph>
      <ul>
        <li>Valores menores: Visualização mais compacta</li>
        <li>Valores maiores: Mais espaço para legibilidade</li>
        <li>
          Range varia por tipo de visualização:
          <ul>
            <li>Sankey: 5-60px (espaçamento vertical entre nós)</li>
            <li>Árvore: 5-60px (espaçamento entre nós)</li>
            <li>Treemap: 0-10px (gap entre blocos)</li>
          </ul>
        </li>
      </ul>

      <Title level={4}>Controles Específicos por Visualização</Title>

      <Title level={5}>Tabela: Expandir até Nível</Title>
      <Paragraph>
        <Text strong>Slider com marcas</Text> que expande/colapsa automaticamente a árvore até o
        nível selecionado.
      </Paragraph>
      <ul>
        <li>Marcas indicam os níveis existentes na estrutura</li>
        <li>Útil para explorar a estrutura progressivamente</li>
        <li>Nível 1: Mostra apenas componentes diretos</li>
        <li>Níveis maiores: Mostra sub-componentes progressivamente</li>
      </ul>

      <Title level={5}>Árvore: Orientação</Title>
      <Paragraph>
        <Text strong>Segmented control</Text> com 3 opções: Vertical, Horizontal e Radial.
      </Paragraph>
      <ul>
        <li>Muda o layout da árvore instantaneamente</li>
        <li>Cada orientação é adequada para diferentes situações</li>
        <li>Orientação radial ideal para estruturas muito complexas</li>
      </ul>

      <Title level={5}>Grafo: Layout</Title>
      <Paragraph>
        <Text strong>Segmented control</Text> com 2 opções: Força e Circular.
      </Paragraph>
      <ul>
        <li>
          <Text strong>Força:</Text> Layout dinâmico baseado em simulação física
        </li>
        <li>
          <Text strong>Circular:</Text> Layout organizado em círculo
        </li>
      </ul>

      <Title level={5}>Grafo: Profundidade</Title>
      <Paragraph>
        <Text strong>Slider + campo numérico</Text> que filtra componentes por nível máximo.
      </Paragraph>
      <ul>
        <li>Reduz complexidade mostrando apenas níveis superiores</li>
        <li>Útil para análise progressiva de estruturas grandes</li>
        <li>Estatísticas atualizadas mostram quantos nós estão visíveis</li>
      </ul>

      <Title level={5}>Grafo: Buscar Componente</Title>
      <Paragraph>
        <Text strong>Campo de busca</Text> que localiza e destaca componentes específicos.
      </Paragraph>
      <ul>
        <li>Digite parte do código do componente</li>
        <li>Pressione Enter ou clique na lupa</li>
        <li>Componente encontrado é destacado em vermelho com sombra</li>
        <li>Use o X para limpar o destaque</li>
      </ul>

      <Title level={5}>Grafo: Controles Avançados de Física (Painel Expansível)</Title>
      <Paragraph>Controles para ajustar a simulação física do layout força:</Paragraph>
      <ul>
        <li>
          <Text strong>Repulsão (10-200):</Text> Força que afasta os nós uns dos outros. Valores
          maiores = mais espaço entre nós
        </li>
        <li>
          <Text strong>Comprimento (50-400):</Text> Comprimento ideal das conexões. Valores maiores
          = estrutura mais espalhada
        </li>
        <li>
          <Text strong>Gravidade (0-1):</Text> Força que puxa nós para o centro. Valores maiores =
          mais compacto
        </li>
      </ul>

      <Title level={4}>Persistência de Preferências</Title>
      <Paragraph>
        Todas as configurações são salvas automaticamente no navegador (localStorage):
      </Paragraph>
      <ul>
        <li>Nível de zoom</li>
        <li>Espaçamento</li>
        <li>Orientação (Árvore)</li>
        <li>Layout (Grafo)</li>
        <li>Profundidade (Grafo)</li>
        <li>Controles de física (Grafo)</li>
      </ul>
      <Paragraph>
        As preferências são restauradas automaticamente ao voltar para a mesma visualização.
      </Paragraph>

      <Title level={4}>Dicas</Title>
      <ul>
        <li>Ajuste o zoom antes de exportar para PDF para controlar o tamanho do documento</li>
        <li>Use cores de alto contraste para apresentações ou impressão</li>
        <li>Experimente diferentes combinações de controles para encontrar a visualização ideal</li>
        <li>No modo escuro, use cores base mais claras para melhor contraste</li>
        <li>Reduza o espaçamento para estruturas grandes e aumente para estruturas pequenas</li>
      </ul>
    </div>
  ),
  keywords: [
    'controles',
    'zoom',
    'espaçamento',
    'cor',
    'orientação',
    'layout',
    'filtro',
    'busca',
    'configuração',
  ],
};
