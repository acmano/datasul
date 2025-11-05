/**
 * Tópico: Módulo Manufatura
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const manufatura: HelpTopicContent = {
  key: 'manufatura',
  title: 'Módulo: Manufatura',
  content: (
    <div>
      <Paragraph>
        O módulo <Text strong>Manufatura</Text> contém todas as informações relacionadas ao processo
        produtivo e fabricação dos itens.
      </Paragraph>
      <Title level={4}>Abas Disponíveis</Title>
      <ul>
        <li>
          <Text strong>Resultado</Text> - Tabela com resultados da pesquisa
        </li>
        <li>
          <Text strong>Base</Text> - Dados do processo de manufatura
        </li>
      </ul>
      <Title level={4}>Informações Disponíveis</Title>
      <ul>
        <li>Roteiros de produção e operações</li>
        <li>Centros de trabalho utilizados</li>
        <li>Tempos de setup e fabricação</li>
        <li>Características do processo produtivo</li>
        <li>Controles de qualidade na produção</li>
        <li>Ferramentas e recursos necessários</li>
      </ul>
      <Paragraph>
        Use <Text keyboard>Ctrl+4</Text> para acessar este módulo rapidamente.
      </Paragraph>
    </div>
  ),
  keywords: ['manufatura', 'produção', 'fabricação', 'roteiro', 'módulo'],
};
