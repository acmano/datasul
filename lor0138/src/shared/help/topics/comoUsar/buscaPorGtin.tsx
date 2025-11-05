/**
 * Tópico: Busca por GTIN (Código de Barras)
 */

import React from 'react';
import { Typography, Alert, Divider, Tag } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const buscaPorGtin: HelpTopicContent = {
  key: 'busca-por-gtin',
  title: 'Busca por GTIN (Código de Barras)',
  content: (
    <div>
      <Paragraph>
        O campo GTIN permite buscar itens pelo código de barras (EAN13 ou EAN14). Este campo possui
        comportamentos especiais que você precisa conhecer para usá-lo corretamente.
      </Paragraph>

      <Title level={4}>O que é GTIN?</Title>
      <Paragraph>
        GTIN (Global Trade Item Number) é um identificador único usado internacionalmente para
        produtos. Existem dois tipos principais:
      </Paragraph>
      <ul>
        <li>
          <Text strong>GTIN-13 (EAN-13):</Text> 13 dígitos - usado em produtos individuais (mais
          comum no Brasil)
        </li>
        <li>
          <Text strong>GTIN-14 (DUN-14):</Text> 14 dígitos - usado em caixas, paletes e embalagens
          múltiplas
        </li>
      </ul>

      <Divider />

      <Title level={4}>1️⃣ Busca em DOIS Campos Simultaneamente</Title>

      <Alert
        message="Comportamento Especial"
        description="Quando você busca por um GTIN, o sistema procura automaticamente nos campos gtin13 E gtin14 ao mesmo tempo!"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Paragraph>
        <Text strong>Exemplo:</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Você pesquisa: <Text code>7896451824813</Text>
        <br />
        <br />
        O sistema busca onde:
        <br />
        <Text code>gtin13 = '7896451824813'</Text> <Tag color="blue">OU</Tag>{' '}
        <Text code>gtin14 = '7896451824813'</Text>
      </Paragraph>

      <Paragraph>
        <Text type="success">
          → Resultado: Retorna itens que possuem esse código em <Text strong>qualquer</Text> um dos
          dois campos
        </Text>
      </Paragraph>

      <Divider />

      <Title level={4}>2️⃣ Retorna Apenas Itens com GTIN Cadastrado</Title>

      <Alert
        message="Atenção"
        description="Quando você informa um GTIN na busca, o sistema retorna APENAS itens que possuem GTIN cadastrado. Itens sem GTIN não aparecem nos resultados."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Paragraph>
        <Text strong>Como funciona:</Text>
      </Paragraph>

      <Paragraph style={{ paddingLeft: 20 }}>
        <Text strong>Com GTIN informado:</Text>
        <br />
        • Sistema usa filtro restritivo
        <br />
        • Retorna apenas itens que TÊM gtin13 ou gtin14 cadastrado
        <br />
        • Itens sem GTIN são automaticamente excluídos
        <br />
        <br />
        <Text strong>Sem GTIN informado:</Text>
        <br />
        • Sistema não filtra por GTIN
        <br />
        • Retorna todos os itens que atendem aos outros critérios
        <br />• Itens com ou sem GTIN aparecem normalmente
      </Paragraph>

      <Paragraph>
        <Text strong>Por que isso importa?</Text>
      </Paragraph>
      <ul>
        <li>Se você buscar por GTIN, só aparecem itens que têm código de barras cadastrado</li>
        <li>
          Se buscar apenas por família (sem GTIN), aparecem todos os itens da família, tenham ou não
          código de barras
        </li>
      </ul>

      <Divider />

      <Title level={4}>3️⃣ Formato do GTIN</Title>

      <Alert
        message="Apenas Números!"
        description="O campo GTIN aceita SOMENTE dígitos numéricos (13 ou 14 dígitos). Não use hífens, espaços, letras ou caracteres curinga."
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Paragraph>
        <Text strong>✅ Formato Correto:</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        • <Text code>7896451824813</Text> (13 dígitos)
        <br />• <Text code>12345678901234</Text> (14 dígitos)
      </Paragraph>

      <Paragraph>
        <Text strong>❌ Formato Incorreto:</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        •{' '}
        <Text code delete>
          7896-451-824-813
        </Text>{' '}
        (com hífens)
        <br />•{' '}
        <Text code delete>
          7896 451 824 813
        </Text>{' '}
        (com espaços)
        <br />•{' '}
        <Text code delete>
          %7896%
        </Text>{' '}
        (com wildcards)
        <br />•{' '}
        <Text code delete>
          ABC123
        </Text>{' '}
        (com letras)
      </Paragraph>

      <Divider />

      <Title level={4}>Exemplos de Uso</Title>

      <Paragraph>
        <Text strong>Exemplo 1: Busca apenas por GTIN</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        GTIN: <Text code>7896451824813</Text>
        <br />
        <br />
        <Text type="success">
          → Encontra o item que possui este código de barras (em gtin13 ou gtin14)
        </Text>
      </Paragraph>

      <Paragraph>
        <Text strong>Exemplo 2: GTIN + Família</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        GTIN: <Text code>7896451824813</Text>
        <br />
        Família: <Text code>450000</Text>
        <br />
        <br />
        <Text type="success">
          → Encontra itens com este GTIN <Text strong>E</Text> que sejam da família 450000
        </Text>
      </Paragraph>

      <Paragraph>
        <Text strong>Exemplo 3: Busca por família (sem GTIN)</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Família: <Text code>450000</Text>
        <br />
        <br />
        <Text type="success">
          → Retorna todos os itens da família 450000 (com ou sem GTIN cadastrado)
        </Text>
      </Paragraph>

      <Divider />

      <Title level={4}>Troubleshooting - Problemas Comuns</Title>

      <Paragraph>
        <Text strong>🔴 "Não encontrei resultados ao buscar por GTIN"</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        <Text strong>Possíveis causas:</Text>
        <br />
        1. O item não possui GTIN cadastrado no sistema
        <br />
        2. O GTIN está incorreto (confira os dígitos)
        <br />
        3. Você digitou hífens ou espaços (use apenas números)
        <br />
        <br />
        <Text strong>Solução:</Text>
        <br />
        • Tente buscar pelo código do item ao invés do GTIN
        <br />
        • Verifique se o GTIN está cadastrado consultando o item por outro critério
        <br />• Confirme que digitou apenas números
      </Paragraph>

      <Paragraph>
        <Text strong>🔴 "Erro de validação: GTIN inválido"</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        <Text strong>Causa:</Text>
        <br />
        O GTIN deve ter exatamente 13 ou 14 dígitos numéricos
        <br />
        <br />
        <Text strong>Solução:</Text>
        <br />
        • Remova hífens, espaços e outros caracteres
        <br />• Confirme que tem 13 ou 14 dígitos
      </Paragraph>

      <Paragraph>
        <Text strong>🔴 "Alguns itens da família não aparecem quando busco com GTIN"</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        <Text strong>Causa:</Text>
        <br />
        Quando você informa um GTIN, o sistema retorna apenas itens que possuem GTIN cadastrado
        <br />
        <br />
        <Text strong>Solução:</Text>
        <br />• Para ver todos os itens da família, não informe o GTIN
      </Paragraph>

      <Divider />

      <Title level={4}>Dicas Importantes</Title>

      <ul>
        <li>
          <Text strong>Use GTIN quando:</Text> Você tem o código de barras em mãos e quer encontrar
          o item específico rapidamente
        </li>
        <li>
          <Text strong>Não use GTIN quando:</Text> Você quer listar todos os itens de uma categoria
          (alguns podem não ter GTIN)
        </li>
        <li>
          O GTIN é a forma <Text mark>mais rápida e precisa</Text> de encontrar um item específico
        </li>
        <li>Se você não encontrar pelo GTIN, tente buscar pelo código ou descrição do item</li>
        <li>
          Nem todos os itens possuem GTIN cadastrado - especialmente itens mais antigos ou de uso
          interno
        </li>
      </ul>

      <Alert
        message="Lembrete"
        description="GTIN é usado principalmente para produtos de venda. Itens de matéria-prima ou componentes internos podem não ter código de barras cadastrado."
        type="info"
        showIcon
      />
    </div>
  ),
  keywords: [
    'gtin',
    'ean',
    'código de barras',
    'barcode',
    'ean13',
    'ean14',
    'dun',
    'gtin13',
    'gtin14',
    'busca',
    'pesquisa',
  ],
};
