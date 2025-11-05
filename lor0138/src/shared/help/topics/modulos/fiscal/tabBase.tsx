/**
 * Tópico: Aba Base (Fiscal)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabBaseFiscal: HelpTopicContent = {
  key: 'tab-base-fiscal',
  title: 'Aba: Base (Fiscal)',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Base</Text> no módulo Fiscal apresenta todas as informações fiscais e
        tributárias do item.
      </Paragraph>
      <Title level={4}>Informações Fiscais</Title>
      <ul>
        <li>
          <Text strong>Classificação Fiscal (NCM):</Text> Nomenclatura Comum do Mercosul - código de
          8 dígitos que identifica a natureza da mercadoria
        </li>
        <li>
          <Text strong>Tributações:</Text> Impostos aplicáveis (ICMS, IPI, PIS, COFINS) e suas
          alíquotas
        </li>
        <li>
          <Text strong>Situações Tributárias:</Text> CST/CSOSN que definem o tratamento fiscal em
          cada operação
        </li>
        <li>
          <Text strong>Códigos de Enquadramento:</Text> Códigos especiais para benefícios fiscais
        </li>
        <li>
          <Text strong>CEST:</Text> Código Especificador da Substituição Tributária
        </li>
        <li>
          <Text strong>Observações Fiscais:</Text> Informações complementares para documentos
          fiscais
        </li>
      </ul>
      <Title level={4}>Uso das Informações</Title>
      <Paragraph>
        Estas informações são fundamentais para o correto cálculo de impostos, emissão de notas
        fiscais e cumprimento das obrigações tributárias acessórias (SPED, EFD, etc.).
      </Paragraph>
      <Paragraph>
        Atalho: <Text keyboard>Alt+2</Text>
      </Paragraph>
    </div>
  ),
  keywords: ['fiscal', 'tributação', 'ncm', 'impostos', 'icms', 'ipi'],
};
