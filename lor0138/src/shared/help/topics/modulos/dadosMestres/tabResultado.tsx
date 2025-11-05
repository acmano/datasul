/**
 * Tópico: Aba Resultado
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabResultado: HelpTopicContent = {
  key: 'tab-resultado',
  title: 'Aba: Resultado',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Resultado</Text> exibe a tabela com todos os itens encontrados na
        pesquisa.
      </Paragraph>
      <Title level={4}>Colunas Exibidas</Title>
      <ul>
        <li>
          <Text strong>Código:</Text> Código único do item
        </li>
        <li>
          <Text strong>Descrição:</Text> Nome/descrição do item
        </li>
        <li>
          <Text strong>Unidade:</Text> Unidade de medida padrão
        </li>
        <li>
          <Text strong>Família:</Text> Categoria principal
        </li>
        <li>
          <Text strong>Família Comercial:</Text> Categoria comercial
        </li>
        <li>
          <Text strong>Grupo Estoque:</Text> Agrupamento de estoque
        </li>
      </ul>
      <Title level={4}>Interação</Title>
      <ul>
        <li>Clique em uma linha para selecioná-la e visualizar detalhes nas outras abas</li>
        <li>
          Use as setas <Text keyboard>↑</Text> e <Text keyboard>↓</Text> para navegar
        </li>
        <li>A linha selecionada fica destacada em azul</li>
      </ul>
      <Paragraph>
        Atalho: <Text keyboard>Alt+1</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['resultado', 'tabela', 'pesquisa'],
};
