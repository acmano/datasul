/**
 * Tópico: Pesquisa de Itens
 */

import React from 'react';
import { Typography, Alert } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const pesquisa: HelpTopicContent = {
  key: 'pesquisa',
  title: 'Pesquisa de Itens',
  content: (
    <div>
      <Paragraph>
        A tela de pesquisa permite localizar itens através de múltiplos critérios de busca. Você
        pode combinar diferentes filtros para encontrar exatamente o que precisa.
      </Paragraph>

      <Title level={4}>Campos de Filtro Disponíveis</Title>

      <ul>
        <li>
          <Text strong>Código:</Text> Código do item{' '}
          <Text type="success">(aceita caracteres curinga * ou %)</Text>
        </li>
        <li>
          <Text strong>Descrição:</Text> Descrição do item{' '}
          <Text type="success">(aceita caracteres curinga * ou %)</Text>
        </li>
        <li>
          <Text strong>GTIN/Código de Barras:</Text> Código de barras EAN13 ou EAN14{' '}
          <Text type="warning">(apenas números, sem curingas)</Text>
        </li>
        <li>
          <Text strong>Família:</Text> Categoria principal do item{' '}
          <Text type="secondary">(busca exata)</Text>
        </li>
        <li>
          <Text strong>Família Comercial:</Text> Categoria comercial{' '}
          <Text type="secondary">(busca exata)</Text>
        </li>
        <li>
          <Text strong>Grupo de Estoque:</Text> Agrupamento para controle de estoque{' '}
          <Text type="secondary">(busca exata)</Text>
        </li>
      </ul>

      <Alert
        message="Critérios Dinâmicos"
        description="Você NÃO precisa preencher todos os campos! Preencha apenas os que você conhece. Os campos informados serão combinados com 'E' (AND) - todos devem ser satisfeitos."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Como Pesquisar</Title>
      <Paragraph>
        <Text strong>Passo a passo:</Text>
      </Paragraph>
      <ol>
        <li>
          Preencha <Text strong>pelo menos UM</Text> campo de filtro
        </li>
        <li>
          Clique no botão <Text keyboard>Buscar</Text> ou pressione <Text keyboard>Enter</Text>
        </li>
        <li>Os resultados aparecem na tabela abaixo</li>
        <li>Clique em uma linha para visualizar detalhes completos nas abas</li>
      </ol>

      <Title level={4}>Tipos de Busca</Title>

      <Paragraph>
        <Text strong>1. Busca Exata (sem caracteres curinga):</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        • Código: <Text code>7530110</Text> → Encontra APENAS o item "7530110"
        <br />• Descrição: <Text code>PARAFUSO</Text> → Encontra itens com descrição exatamente
        "PARAFUSO"
      </Paragraph>

      <Paragraph>
        <Text strong>2. Busca com Curingas (wildcards):</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        • Código: <Text code>753%</Text> → Encontra todos os códigos que começam com "753"
        <br />• Descrição: <Text code>%VÁLVULA%</Text> → Encontra qualquer item que contenha
        "VÁLVULA"
        <br />
        <Text type="secondary">Veja mais detalhes em "Caracteres Curinga" no menu de ajuda</Text>
      </Paragraph>

      <Paragraph>
        <Text strong>3. Busca por GTIN (Código de Barras):</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        • GTIN: <Text code>7896451824813</Text> → Busca o item com esse código de barras
        <br />• <Text type="warning">Atenção:</Text> Apenas números, sem hífens ou espaços
        <br />
        <Text type="secondary">Veja mais detalhes em "Busca por GTIN" no menu de ajuda</Text>
      </Paragraph>

      <Title level={4}>Combinando Múltiplos Filtros</Title>
      <Paragraph>
        Quando você informa mais de um filtro, <Text strong>TODOS</Text> devem ser satisfeitos
        simultaneamente (operação AND):
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        <Text strong>Exemplo:</Text>
        <br />• Família: <Text code>450000</Text>
        <br />• Descrição: <Text code>%BRONZE%</Text>
        <br />
        <br />
        <Text type="secondary">
          → Resultado: Itens que são da família 450000 <Text strong>E</Text> contêm "BRONZE" na
          descrição
        </Text>
      </Paragraph>

      <Title level={4}>Dicas Importantes</Title>
      <ul>
        <li>
          Use o botão <Text strong>Limpar</Text> para resetar todos os filtros
        </li>
        <li>
          <Text mark>Pelo menos um filtro deve ser preenchido</Text> para realizar a busca
        </li>
        <li>
          Para busca flexível em código/descrição, use <Text code>%</Text> ou <Text code>*</Text>
        </li>
        <li>Quanto mais específico você for (mais filtros), mais rápida será a busca</li>
        <li>
          Se não encontrar resultados, tente usar curingas: <Text code>%palavra%</Text>
        </li>
        <li>A busca retorna no máximo 100 resultados - refine os filtros se necessário</li>
      </ul>

      <Alert
        message="Mudança Importante"
        description="Wildcards não são mais automáticos! Se você digitar 'PARAFUSO' sem %, a busca será exata. Para busca parcial, digite explicitamente %PARAFUSO%"
        type="warning"
        showIcon
      />
    </div>
  ),
  keywords: [
    'pesquisa',
    'busca',
    'filtros',
    'código',
    'descrição',
    'gtin',
    'wildcard',
    'curinga',
    'familia',
  ],
};
