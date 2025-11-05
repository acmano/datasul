/**
 * Tópico: Módulo PCP
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const pcp: HelpTopicContent = {
  key: 'pcp',
  title: 'Módulo: PCP',
  content: (
    <div>
      <Paragraph>
        O módulo <Text strong>PCP (Planejamento e Controle de Produção)</Text> concentra todas as
        informações relacionadas ao planejamento de materiais e produção.
      </Paragraph>
      <Title level={4}>Abas Disponíveis</Title>
      <ul>
        <li>
          <Text strong>Resultado</Text> - Tabela com resultados da pesquisa
        </li>
        <li>
          <Text strong>Base</Text> - Dados de planejamento, MRP, lead times e políticas de reposição
        </li>
      </ul>
      <Title level={4}>Informações Disponíveis</Title>
      <ul>
        <li>Parâmetros de MRP (Material Requirements Planning)</li>
        <li>Lotes mínimos, máximos e múltiplos</li>
        <li>Lead times de compra e produção</li>
        <li>Políticas de reposição e ponto de pedido</li>
        <li>Estoques de segurança</li>
        <li>Código de baixa e tipo de phantom</li>
      </ul>
      <Paragraph>
        Use <Text keyboard>Ctrl+3</Text> para acessar este módulo rapidamente.
      </Paragraph>
    </div>
  ),
  keywords: ['pcp', 'planejamento', 'mrp', 'lead time', 'módulo'],
};
