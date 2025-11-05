/**
 * Tópico: Aba Base (PCP)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabBasePcp: HelpTopicContent = {
  key: 'tab-base-pcp',
  title: 'Aba: Base (PCP)',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Base</Text> no módulo PCP apresenta todas as informações de planejamento
        e controle de produção do item.
      </Paragraph>
      <Title level={4}>Informações de Planejamento</Title>
      <ul>
        <li>
          <Text strong>Parâmetros de MRP:</Text> Configurações para cálculo de necessidades de
          materiais
        </li>
        <li>
          <Text strong>Lotes:</Text> Quantidades mínimas, máximas e múltiplos de compra/produção
        </li>
        <li>
          <Text strong>Lead Times:</Text> Tempos de ressuprimento (compra ou produção)
        </li>
        <li>
          <Text strong>Políticas de Reposição:</Text> Métodos de reabastecimento (ponto de pedido,
          MRP, etc.)
        </li>
        <li>
          <Text strong>Estoques de Segurança:</Text> Níveis mínimos para proteção contra
          variabilidade
        </li>
        <li>
          <Text strong>Código de Baixa:</Text> Tipo de consumo do componente
        </li>
        <li>
          <Text strong>Phantom:</Text> Indicadores de itens fantasmas na estrutura
        </li>
      </ul>
      <Title level={4}>Uso das Informações</Title>
      <Paragraph>
        Estes dados são utilizados pelos sistemas de MRP (Material Requirements Planning) para
        calcular quando e quanto pedir ou produzir de cada item, garantindo que os materiais estejam
        disponíveis quando necessários, sem excesso de estoque.
      </Paragraph>
      <Paragraph>
        Atalho: <Text keyboard>Alt+2</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['planejamento', 'mrp', 'lead time', 'estoque', 'lote', 'pcp'],
};
