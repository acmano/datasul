/**
 * Tópico: Aba Manufatura
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabManufatura: HelpTopicContent = {
  key: 'tab-manufatura',
  title: 'Aba: Manufatura',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Manufatura</Text> contém dados específicos do processo produtivo do item.
      </Paragraph>
      <Title level={4}>Dados de Manufatura</Title>
      <ul>
        <li>Roteiros de produção</li>
        <li>Centros de trabalho</li>
        <li>Tempos de fabricação</li>
        <li>Características do processo</li>
        <li>Controles de qualidade</li>
      </ul>
      <Paragraph>
        <Text type="warning" strong>
          ATENÇÃO: Este conteúdo foi movido para o módulo Manufatura (Ctrl+4).
        </Text>
      </Paragraph>
      <Paragraph>
        Este tópico permanece aqui apenas para referência histórica. Para acessar informações de
        manufatura, utilize o módulo <Text strong>Manufatura</Text> através do atalho{' '}
        <Text keyboard>Ctrl+4</Text>.
      </Paragraph>
    </div>
  ),
  keywords: ['manufatura', 'produção', 'fabricação', 'roteiro'],
};
