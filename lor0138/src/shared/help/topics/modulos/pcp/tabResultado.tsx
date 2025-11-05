/**
 * Tópico: Aba Resultado (PCP)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabResultadoPcp: HelpTopicContent = {
  key: 'tab-resultado-pcp',
  title: 'Aba: Resultado (PCP)',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Resultado</Text> no módulo PCP apresenta a tabela com os itens
        encontrados na pesquisa.
      </Paragraph>
      <Title level={4}>Funcionalidades</Title>
      <ul>
        <li>Visualização dos itens em formato de tabela</li>
        <li>Ordenação por qualquer coluna</li>
        <li>Seleção de item para visualizar detalhes</li>
        <li>Exportação dos resultados</li>
        <li>Navegação rápida por teclado</li>
      </ul>
      <Paragraph>
        Atalho: <Text keyboard>Alt+1</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['resultado', 'pesquisa', 'tabela', 'pcp'],
};
