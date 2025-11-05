/**
 * Tópico: Capítulo 2 - Processos Avançados
 * Este é um exemplo de capítulo customizável
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph } = Typography;

export const capitulo2: HelpTopicContent = {
  key: 'capitulo-2',
  title: 'Capítulo 2 - Processos Avançados',
  content: (
    <div>
      <Paragraph type="secondary">
        Outro exemplo de capítulo customizável para documentar processos mais avançados ou
        específicos do seu negócio.
      </Paragraph>
      <Title level={4}>Sugestões de Conteúdo</Title>
      <ul>
        <li>Fluxos de trabalho complexos</li>
        <li>Integrações com outros sistemas</li>
        <li>Casos de uso específicos</li>
        <li>Boas práticas recomendadas</li>
      </ul>
    </div>
  ),
  keywords: ['capítulo', 'processos', 'avançado'],
};
