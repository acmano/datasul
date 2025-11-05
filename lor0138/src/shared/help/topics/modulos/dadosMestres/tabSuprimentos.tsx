/**
 * Tópico: Aba Suprimentos
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabSuprimentos: HelpTopicContent = {
  key: 'tab-suprimentos',
  title: 'Aba: Suprimentos',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Suprimentos</Text> irá conter informações relacionadas a compras e
        fornecimento do item.
      </Paragraph>
      <Title level={4}>Informações (Em Desenvolvimento)</Title>
      <ul>
        <li>Fornecedores</li>
        <li>Condições de compra</li>
        <li>Prazos de entrega</li>
        <li>Lotes de compra</li>
      </ul>
      <Paragraph>
        Atalho: <Text keyboard>Alt+4</Text>
      </Paragraph>
      <Paragraph>
        <Text type="warning">Esta aba está em desenvolvimento.</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['suprimentos', 'compras', 'fornecedores'],
};
