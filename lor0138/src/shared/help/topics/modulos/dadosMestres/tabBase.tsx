/**
 * Tópico: Aba Base (Informações Gerais)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabBase: HelpTopicContent = {
  key: 'tab-base',
  title: 'Aba: Base (Informações Gerais)',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Base</Text> apresenta as informações gerais e principais do item
        selecionado.
      </Paragraph>
      <Title level={4}>Informações Exibidas</Title>
      <ul>
        <li>Dados básicos (código, descrição, unidade)</li>
        <li>Códigos de barras (GTIN/EAN)</li>
        <li>Classificações (família, família comercial, grupo de estoque)</li>
        <li>Status e tipo do item</li>
        <li>Características gerais</li>
      </ul>
      <Paragraph>
        Atalho: <Text keyboard>Alt+2</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['base', 'informações gerais', 'dados básicos'],
};
