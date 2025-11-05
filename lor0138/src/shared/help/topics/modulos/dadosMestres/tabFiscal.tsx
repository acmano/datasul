/**
 * Tópico: Aba Fiscal
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabFiscal: HelpTopicContent = {
  key: 'tab-fiscal',
  title: 'Aba: Fiscal',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Fiscal</Text> apresenta informações fiscais e tributárias do item.
      </Paragraph>
      <Title level={4}>Informações Fiscais</Title>
      <ul>
        <li>Classificação fiscal (NCM)</li>
        <li>Tributações</li>
        <li>Situações tributárias</li>
        <li>Códigos de enquadramento</li>
        <li>Observações fiscais</li>
      </ul>
      <Paragraph>
        <Text type="warning" strong>
          ATENÇÃO: Este conteúdo foi movido para o módulo Fiscal (Ctrl+6).
        </Text>
      </Paragraph>
      <Paragraph>
        Este tópico permanece aqui apenas para referência histórica. Para acessar informações
        fiscais, utilize o módulo <Text strong>Fiscal</Text> através do atalho{' '}
        <Text keyboard>Ctrl+6</Text>.
      </Paragraph>
    </div>
  ),
  keywords: ['fiscal', 'tributação', 'ncm', 'impostos'],
};
