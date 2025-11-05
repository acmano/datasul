/**
 * Tópico: Aba Estrutura de Produtos
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabEstrutura: HelpTopicContent = {
  key: 'tab-estrutura',
  title: 'Aba: Estrutura de Produtos',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Estrutura</Text> apresenta a composição hierárquica do produto
        selecionado, mostrando todos os componentes necessários para sua fabricação.
      </Paragraph>
      <Title level={4}>Informações Exibidas</Title>
      <ul>
        <li>Estrutura multinível de produtos (BOM)</li>
        <li>Componentes com suas quantidades</li>
        <li>Níveis hierárquicos da estrutura</li>
        <li>Referências e sequências</li>
        <li>Operações de fabricação</li>
        <li>Onde-usado (Where-Used)</li>
      </ul>
      <Title level={4}>Navegação</Title>
      <Paragraph>
        Use a árvore hierárquica para expandir e visualizar os níveis inferiores da estrutura.
        Clique em um componente para ver seus detalhes e sua própria estrutura.
      </Paragraph>
      <Paragraph>
        Atalho: <Text keyboard>Alt+8</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['estrutura', 'bom', 'componentes', 'hierarquia', 'produtos'],
};
