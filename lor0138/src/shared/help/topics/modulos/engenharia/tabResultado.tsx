/**
 * Tópico: Aba Resultado (Engenharia)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabResultadoEngenharia: HelpTopicContent = {
  key: 'tab-resultado-engenharia',
  title: 'Aba: Resultado',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Resultado</Text> exibe a lista de itens encontrados na pesquisa,
        permitindo selecionar qual item deseja visualizar em detalhes nas demais abas.
      </Paragraph>
      <Title level={4}>Funcionalidades</Title>
      <ul>
        <li>Lista completa de itens encontrados</li>
        <li>Ordenação por diferentes colunas</li>
        <li>Seleção de item para visualização detalhada</li>
        <li>Informações resumidas de cada item</li>
        <li>Navegação rápida entre itens</li>
      </ul>
      <Paragraph>
        Selecione um item da lista para visualizar sua estrutura de produtos e demais informações
        nas outras abas.
      </Paragraph>
      <Paragraph>
        Atalho: <Text keyboard>Alt+1</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['resultado', 'pesquisa', 'lista', 'itens', 'engenharia'],
};
