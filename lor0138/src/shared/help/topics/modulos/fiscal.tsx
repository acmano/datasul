/**
 * Tópico: Módulo Fiscal
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const fiscal: HelpTopicContent = {
  key: 'fiscal',
  title: 'Módulo: Fiscal',
  content: (
    <div>
      <Paragraph>
        O módulo <Text strong>Fiscal</Text> centraliza todas as informações fiscais e tributárias
        relacionadas aos itens.
      </Paragraph>
      <Title level={4}>Abas Disponíveis</Title>
      <ul>
        <li>
          <Text strong>Resultado</Text> - Tabela com resultados da pesquisa
        </li>
        <li>
          <Text strong>Base</Text> - Dados fiscais e tributários
        </li>
      </ul>
      <Title level={4}>Informações Disponíveis</Title>
      <ul>
        <li>Classificação fiscal (NCM - Nomenclatura Comum do Mercosul)</li>
        <li>Tributações aplicáveis (ICMS, IPI, PIS, COFINS)</li>
        <li>Situações tributárias por operação</li>
        <li>Códigos de enquadramento legal</li>
        <li>CEST (Código Especificador da Substituição Tributária)</li>
        <li>Observações fiscais e informações complementares</li>
      </ul>
      <Paragraph>
        Use <Text keyboard>Ctrl+6</Text> para acessar este módulo rapidamente.
      </Paragraph>
    </div>
  ),
  keywords: ['fiscal', 'tributação', 'ncm', 'impostos', 'módulo'],
};
