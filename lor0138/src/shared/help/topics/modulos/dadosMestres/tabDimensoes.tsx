/**
 * Tópico: Aba Dimensões
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabDimensoes: HelpTopicContent = {
  key: 'tab-dimensoes',
  title: 'Aba: Dimensões',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Dimensões</Text> contém todas as medidas físicas do item em diferentes
        níveis.
      </Paragraph>
      <Title level={4}>Níveis de Dimensões</Title>
      <ul>
        <li>
          <Text strong>Peça:</Text> Dimensões da peça individual
        </li>
        <li>
          <Text strong>Item:</Text> Dimensões do item (pode ser igual à peça)
        </li>
        <li>
          <Text strong>Produto:</Text> Dimensões do produto acabado
        </li>
        <li>
          <Text strong>Embalagem:</Text> Dimensões da embalagem comercial
        </li>
        <li>
          <Text strong>Palete:</Text> Dimensões do palete para transporte
        </li>
      </ul>
      <Title level={4}>Medidas</Title>
      <Paragraph>
        Para cada nível são exibidos: altura, largura, profundidade, peso e volume.
      </Paragraph>
      <Paragraph>
        Atalho: <Text keyboard>Alt+3</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['dimensões', 'medidas', 'altura', 'peso', 'volume'],
};
