/**
 * Tópico: Navegação por Abas
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const navegacaoTabs: HelpTopicContent = {
  key: 'navegacao-tabs',
  title: 'Navegação por Abas',
  content: (
    <div>
      <Paragraph>
        Após selecionar um item na pesquisa, os dados são organizados em abas temáticas para
        facilitar a visualização. As abas disponíveis variam de acordo com o módulo selecionado.
      </Paragraph>
      <Title level={4}>Dados Mestres</Title>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - <Text strong>Resultado:</Text> Tabela de resultados da
          pesquisa
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - <Text strong>Base:</Text> Informações gerais do item
        </li>
        <li>
          <Text keyboard>Alt+3</Text> - <Text strong>Dimensões:</Text> Medidas de peça, item,
          produto, embalagem e palete
        </li>
        <li>
          <Text keyboard>Alt+4</Text> - <Text strong>Suprimentos:</Text> Informações de compras
        </li>
      </ul>
      <Title level={4}>PCP</Title>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - <Text strong>Resultado:</Text> Tabela de resultados da
          pesquisa
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - <Text strong>Base:</Text> Dados de planejamento e MRP
        </li>
      </ul>
      <Title level={4}>Manufatura</Title>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - <Text strong>Resultado:</Text> Tabela de resultados da
          pesquisa
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - <Text strong>Base:</Text> Informações de produção
        </li>
      </ul>
      <Title level={4}>Fiscal</Title>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - <Text strong>Resultado:</Text> Tabela de resultados da
          pesquisa
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - <Text strong>Base:</Text> Dados fiscais e tributários
        </li>
      </ul>
      <Title level={4}>Engenharia</Title>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - <Text strong>Resultado:</Text> Tabela de resultados da
          pesquisa
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - <Text strong>Estrutura:</Text> Estrutura de produtos (BOM)
        </li>
        <li>
          <Text keyboard>Alt+3</Text> - <Text strong>Onde Usado:</Text> Lista de produtos que usam o
          item
        </li>
      </ul>
      <Title level={4}>Navegação</Title>
      <Paragraph>
        • Use os atalhos <Text keyboard>Alt+1</Text>, <Text keyboard>Alt+2</Text>, etc. para trocar
        rapidamente entre abas
        <br />
        • Ou clique diretamente no nome da aba desejada
        <br />• O sistema pré-carrega os dados de todas as abas para navegação instantânea
      </Paragraph>
    </div>
  ),
  keywords: ['abas', 'tabs', 'navegação', 'alt'],
};
