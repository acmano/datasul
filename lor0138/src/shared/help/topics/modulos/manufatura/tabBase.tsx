/**
 * Tópico: Aba Base (Manufatura)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabBaseManufatura: HelpTopicContent = {
  key: 'tab-base-manufatura',
  title: 'Aba: Base (Manufatura)',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Base</Text> no módulo Manufatura contém todos os dados específicos do
        processo produtivo do item.
      </Paragraph>
      <Title level={4}>Informações de Manufatura</Title>
      <ul>
        <li>
          <Text strong>Roteiros de Produção:</Text> Sequência de operações para fabricar o item
        </li>
        <li>
          <Text strong>Centros de Trabalho:</Text> Máquinas e recursos utilizados na produção
        </li>
        <li>
          <Text strong>Tempos de Fabricação:</Text> Setup, processamento e espera
        </li>
        <li>
          <Text strong>Características do Processo:</Text> Parâmetros técnicos de fabricação
        </li>
        <li>
          <Text strong>Controles de Qualidade:</Text> Inspeções e testes durante a produção
        </li>
        <li>
          <Text strong>Ferramentas:</Text> Dispositivos e ferramental necessário
        </li>
      </ul>
      <Title level={4}>Uso das Informações</Title>
      <Paragraph>
        Estes dados são essenciais para o planejamento detalhado da produção, programação de
        máquinas, cálculo de capacidade e custos de fabricação.
      </Paragraph>
      <Paragraph>
        Atalho: <Text keyboard>Alt+2</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['manufatura', 'produção', 'fabricação', 'roteiro', 'centro de trabalho'],
};
