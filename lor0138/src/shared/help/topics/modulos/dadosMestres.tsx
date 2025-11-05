/**
 * Tópico: Módulo Dados Mestres
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const dadosMestres: HelpTopicContent = {
  key: 'dados-mestres',
  title: 'Módulo: Dados Mestres',
  content: (
    <div>
      <Paragraph>
        O módulo <Text strong>Dados Mestres</Text> é o principal módulo do sistema, permitindo
        consultar e visualizar as informações cadastrais básicas e dimensionais dos itens.
      </Paragraph>
      <Title level={4}>Abas Disponíveis</Title>
      <ul>
        <li>
          <Text strong>Resultado</Text> - Tabela com resultados da pesquisa
        </li>
        <li>
          <Text strong>Base</Text> - Informações gerais do item (código, descrição, família, etc.)
        </li>
        <li>
          <Text strong>Dimensões</Text> - Medidas físicas (peso, dimensões de peça, item, produto,
          embalagem e palete)
        </li>
        <li>
          <Text strong>Suprimentos</Text> - Informações de compras e fornecedores
        </li>
      </ul>
      <Title level={4}>Funcionalidades</Title>
      <ul>
        <li>Pesquisa avançada de itens por múltiplos critérios</li>
        <li>Visualização detalhada em 4 abas especializadas</li>
        <li>Exportação de dados em múltiplos formatos</li>
        <li>Navegação rápida por teclado</li>
      </ul>
      <Paragraph>
        Use <Text keyboard>Ctrl+1</Text> para acessar este módulo rapidamente.
      </Paragraph>
      <Paragraph>
        <Text type="secondary">
          Nota: Informações de Planejamento/MRP, Manufatura e Fiscal foram movidas para seus
          respectivos módulos especializados (PCP, Manufatura e Fiscal).
        </Text>
      </Paragraph>
    </div>
  ),
  keywords: ['dados mestres', 'módulo', 'itens'],
};
