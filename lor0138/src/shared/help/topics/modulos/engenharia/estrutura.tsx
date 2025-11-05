/**
 * Tópico: Estrutura de Produtos (BOM)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const estrutura: HelpTopicContent = {
  key: 'estrutura',
  title: 'Estrutura de Produtos (BOM)',
  content: (
    <div>
      <Paragraph>
        O módulo de Estrutura de Produtos permite visualizar e explorar a composição hierárquica de
        itens manufaturados (Bill of Materials - BOM), mostrando todos os componentes necessários
        para produzir um produto acabado.
      </Paragraph>

      <Title level={4}>Visão Geral</Title>
      <Paragraph>
        A estrutura de produtos é exibida de forma hierárquica, onde cada nível representa a
        profundidade do componente na estrutura. O sistema oferece 5 tipos diferentes de
        visualização, cada uma adequada para diferentes necessidades de análise:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Tabela:</Text> Visualização tabular hierárquica com expansão por níveis
        </li>
        <li>
          <Text strong>Sankey:</Text> Diagrama de fluxo horizontal mostrando relações e quantidades
        </li>
        <li>
          <Text strong>Árvore:</Text> Representação em árvore com 3 orientações (vertical,
          horizontal, radial)
        </li>
        <li>
          <Text strong>Treemap:</Text> Visualização hierárquica em blocos proporcionais
        </li>
        <li>
          <Text strong>Grafo:</Text> Grafo de rede com layouts dinâmicos (força e circular)
        </li>
      </ul>

      <Title level={4}>Informações Disponíveis</Title>
      <Paragraph>Para cada componente da estrutura, o sistema exibe:</Paragraph>
      <ul>
        <li>Código e descrição do item</li>
        <li>Nível na estrutura (0 = produto final, 1+ = componentes)</li>
        <li>Quantidade necessária e unidade de medida</li>
        <li>Processo de fabricação (quando disponível)</li>
        <li>Operações do processo com tempos e recursos</li>
      </ul>

      <Title level={4}>Processo de Fabricação</Title>
      <Paragraph>
        Itens manufaturados são indicados com um badge "Processo". Ao clicar no item, um painel
        lateral exibe as operações do processo de fabricação, incluindo:
      </Paragraph>
      <ul>
        <li>Centro de custo e grupo de máquina</li>
        <li>Tempo homem e tempo máquina calculados</li>
        <li>Número de unidades e número de homens</li>
        <li>Unidades de medida e tempo</li>
      </ul>

      <Title level={4}>Como Usar</Title>
      <Paragraph>
        1. Pesquise um item na aba <Text strong>Pesquisar</Text>
        <br />
        2. Selecione o item na aba <Text strong>Resultado</Text>
        <br />
        3. Acesse a aba <Text strong>Estrutura</Text> para visualizar a BOM
        <br />
        4. Escolha o tipo de visualização mais adequado
        <br />
        5. Use os controles para ajustar cores, zoom e espaçamento
        <br />
        6. Clique em um componente para selecionar
        <br />
        7. Dê duplo clique para fazer drill-down (explorar o componente)
      </Paragraph>

      <Title level={4}>Dicas</Title>
      <ul>
        <li>
          Use a visualização <Text strong>Tabela</Text> para análise detalhada e exportação de dados
        </li>
        <li>
          Use <Text strong>Sankey</Text> para entender fluxos e quantidades
        </li>
        <li>
          Use <Text strong>Árvore</Text> ou <Text strong>Treemap</Text> para visão geral da
          hierarquia
        </li>
        <li>
          Use <Text strong>Grafo</Text> para análise de dependências complexas
        </li>
        <li>Ajuste as cores para melhor contraste visual entre níveis</li>
        <li>Todas as preferências são salvas automaticamente</li>
      </ul>
    </div>
  ),
  keywords: [
    'estrutura',
    'bom',
    'bill of materials',
    'engenharia',
    'componentes',
    'hierarquia',
    'manufatura',
    'processo',
  ],
};
