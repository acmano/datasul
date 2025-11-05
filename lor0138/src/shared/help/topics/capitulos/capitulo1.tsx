/**
 * Tópico: Capítulo 1 - Conceitos Básicos
 * Este é um exemplo de capítulo customizável
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const capitulo1: HelpTopicContent = {
  key: 'capitulo-1',
  title: 'Capítulo 1 - Conceitos Básicos',
  content: (
    <div>
      <Paragraph>
        <Text type="secondary">
          Este é um exemplo de capítulo customizável. Aqui você pode escrever conteúdo específico
          sobre assuntos relacionados à sua aplicação.
        </Text>
      </Paragraph>
      <Title level={4}>Exemplo de Tópico</Title>
      <Paragraph>
        Substitua este conteúdo com informações relevantes para seus usuários, como conceitos de
        negócio, processos internos, políticas da empresa, etc.
      </Paragraph>
      <ul>
        <li>Tópico 1</li>
        <li>Tópico 2</li>
        <li>Tópico 3</li>
      </ul>
    </div>
  ),
  keywords: ['capítulo', 'exemplo'],
};
