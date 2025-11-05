/**
 * Tópico: Aba Planejamento
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabPlanejamento: HelpTopicContent = {
  key: 'tab-planejamento',
  title: 'Aba: Planejamento',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Planejamento</Text> apresenta informações relevantes para o planejamento
        de produção e controle de materiais (MRP).
      </Paragraph>
      <Title level={4}>Informações Disponíveis</Title>
      <ul>
        <li>Parâmetros de MRP</li>
        <li>Lotes e quantidades</li>
        <li>Lead times</li>
        <li>Políticas de reposição</li>
        <li>Estoques de segurança</li>
      </ul>
      <Paragraph>
        <Text type="warning" strong>
          ATENÇÃO: Este conteúdo foi movido para o módulo PCP (Ctrl+3).
        </Text>
      </Paragraph>
      <Paragraph>
        Este tópico permanece aqui apenas para referência histórica. Para acessar informações de
        planejamento, utilize o módulo <Text strong>PCP</Text> através do atalho{' '}
        <Text keyboard>Ctrl+3</Text>.
      </Paragraph>
    </div>
  ),
  keywords: ['planejamento', 'mrp', 'lead time', 'estoque'],
};
