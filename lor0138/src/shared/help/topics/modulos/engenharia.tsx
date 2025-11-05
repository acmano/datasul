/**
 * Tópico: Módulo Engenharia
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const engenharia: HelpTopicContent = {
  key: 'engenharia',
  title: 'Módulo: Engenharia',
  content: (
    <div>
      <Paragraph>
        O módulo <Text strong>Engenharia</Text> permite visualizar e gerenciar estruturas de
        produtos, listas técnicas e informações relacionadas à engenharia de produtos.
      </Paragraph>
      <Title level={4}>Funcionalidades</Title>
      <ul>
        <li>Visualização de estrutura de produtos (BOM - Bill of Materials)</li>
        <li>Navegação hierárquica por níveis de estrutura</li>
        <li>Consulta de componentes e suas quantidades</li>
        <li>Análise de onde-usado (Where-Used)</li>
        <li>Visualização de roteiros de fabricação</li>
      </ul>
      <Paragraph>
        Use <Text keyboard>Ctrl+2</Text> para acessar este módulo rapidamente.
      </Paragraph>
    </div>
  ),
  keywords: ['engenharia', 'módulo', 'estrutura', 'bom', 'produtos'],
};
