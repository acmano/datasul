/**
 * Tópico: Caracteres Curinga (Wildcards)
 */

import React from 'react';
import { Typography, Table, Alert, Tag } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const caracteresCuringa: HelpTopicContent = {
  key: 'caracteres-curinga',
  title: 'Caracteres Curinga (Wildcards)',
  content: (
    <div>
      <Paragraph>
        Caracteres curinga são símbolos especiais que você pode usar para fazer buscas mais
        flexíveis. Eles funcionam como "coringas" que representam qualquer caractere ou conjunto de
        caracteres.
      </Paragraph>

      <Alert
        message="Importante"
        description="Wildcards NÃO são mais automáticos! Você deve digitá-los explicitamente nos campos Código e Descrição."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Quais Campos Aceitam Curingas?</Title>

      <Table
        dataSource={[
          {
            key: '1',
            campo: 'Código do Item',
            aceita: 'Sim',
            tipo: 'success',
            exemplo: '753%',
          },
          {
            key: '2',
            campo: 'Descrição',
            aceita: 'Sim',
            tipo: 'success',
            exemplo: '%VÁLVULA%',
          },
          {
            key: '3',
            campo: 'GTIN/Código de Barras',
            aceita: 'Não',
            tipo: 'error',
            exemplo: 'Apenas números',
          },
          {
            key: '4',
            campo: 'Família',
            aceita: 'Não',
            tipo: 'default',
            exemplo: 'Código exato',
          },
          {
            key: '5',
            campo: 'Família Comercial',
            aceita: 'Não',
            tipo: 'default',
            exemplo: 'Código exato',
          },
          {
            key: '6',
            campo: 'Grupo de Estoque',
            aceita: 'Não',
            tipo: 'default',
            exemplo: 'Código exato',
          },
        ]}
        columns={[
          {
            title: 'Campo',
            dataIndex: 'campo',
            key: 'campo',
          },
          {
            title: 'Aceita Curinga?',
            dataIndex: 'aceita',
            key: 'aceita',
            render: (text: string, record: any) => <Tag color={record.tipo}>{text}</Tag>,
          },
          {
            title: 'Exemplo',
            dataIndex: 'exemplo',
            key: 'exemplo',
            render: (text: string) => <Text code>{text}</Text>,
          },
        ]}
        pagination={false}
        size="small"
      />

      <Title level={4} style={{ marginTop: 24 }}>
        Caracteres Disponíveis
      </Title>

      <Paragraph>
        <Text strong>1. Percentual (%):</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Representa <Text mark>zero ou mais caracteres</Text> de qualquer tipo.
        <br />
        <br />
        Exemplo: <Text code>%PARAFUSO%</Text>
        <br />
        Encontra: "PARAFUSO SEXTAVADO", "CONJUNTO PARAFUSO", "KIT PARAFUSO E PORCA"
      </Paragraph>

      <Paragraph>
        <Text strong>2. Asterisco (*):</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Funciona <Text mark>exatamente igual ao %</Text>. O sistema converte automaticamente{' '}
        <Text code>*</Text> para <Text code>%</Text>.
        <br />
        <br />
        Exemplo: <Text code>*PARAFUSO*</Text>
        <br />
        Mesmo resultado que <Text code>%PARAFUSO%</Text>
      </Paragraph>

      <Alert
        message="Dica"
        description="Use o caractere que for mais fácil para você! Ambos funcionam da mesma forma."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />

      <Title level={4} style={{ marginTop: 24 }}>
        Padrões Comuns de Uso
      </Title>

      <Paragraph>
        <Text strong>1. "Contém" - Palavra em qualquer posição:</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Descrição: <Text code>%BRONZE%</Text>
        <br />
        Encontra: "VÁLVULA DE <Text mark>BRONZE</Text>", "TORNEIRA <Text mark>BRONZE</Text> CROMADO"
      </Paragraph>

      <Paragraph>
        <Text strong>2. "Começa com" - Prefixo conhecido:</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Código: <Text code>753%</Text>
        <br />
        Encontra: "<Text mark>753</Text>0110", "<Text mark>753</Text>2450", "<Text mark>753</Text>
        9999"
      </Paragraph>

      <Paragraph>
        <Text strong>3. "Termina com" - Sufixo conhecido:</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Código: <Text code>%001</Text>
        <br />
        Encontra: "ABC<Text mark>001</Text>", "XYZ<Text mark>001</Text>", "1234
        <Text mark>001</Text>"
      </Paragraph>

      <Paragraph>
        <Text strong>4. "Contém palavra específica":</Text>
      </Paragraph>
      <Paragraph style={{ paddingLeft: 20 }}>
        Descrição: <Text code>%PRETO%</Text>
        <br />
        Encontra: "BOTÃO <Text mark>PRETO</Text>", "PARAFUSO <Text mark>PRETO</Text> FOSCO"
      </Paragraph>

      <Title level={4} style={{ marginTop: 24 }}>
        ⚠️ IMPORTANTE: Sem Curinga = Busca EXATA
      </Title>

      <Alert
        message="Mudança em relação à versão anterior!"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              <Text delete>❌ ANTES (comportamento antigo):</Text>
              <br />
              Descrição: <Text code>PARAFUSO</Text> → Buscava <Text code>%PARAFUSO%</Text>{' '}
              (automático)
            </Paragraph>
            <Paragraph>
              <Text strong>✅ AGORA (comportamento correto):</Text>
              <br />
              Descrição: <Text code>PARAFUSO</Text> → Busca exata "PARAFUSO"
              <br />
              Descrição: <Text code>%PARAFUSO%</Text> → Busca contendo "PARAFUSO"
            </Paragraph>
          </div>
        }
        type="warning"
        showIcon
      />

      <Paragraph style={{ marginTop: 16 }}>
        <Text strong>Você precisa digitar os curingas explicitamente!</Text>
      </Paragraph>

      <Title level={4} style={{ marginTop: 24 }}>
        Exemplos Práticos
      </Title>

      <Table
        dataSource={[
          {
            key: '1',
            busca: '%VÁLV%',
            encontra: 'VALVULA, VALVULAS, VÁLVULA',
          },
          {
            key: '2',
            busca: '7530%',
            encontra: 'Todos códigos começando com 7530',
          },
          {
            key: '3',
            busca: '%BRONZE%',
            encontra: 'Qualquer item com BRONZE na descrição',
          },
          {
            key: '4',
            busca: 'PARAFUSO',
            encontra: 'Apenas itens com descrição exata "PARAFUSO"',
          },
        ]}
        columns={[
          {
            title: 'O que você digita',
            dataIndex: 'busca',
            key: 'busca',
            render: (text: string) => <Text code>{text}</Text>,
          },
          {
            title: 'O que é encontrado',
            dataIndex: 'encontra',
            key: 'encontra',
          },
        ]}
        pagination={false}
        size="small"
      />

      <Title level={4} style={{ marginTop: 24 }}>
        Dicas e Boas Práticas
      </Title>

      <Paragraph>
        <Text strong>✅ Faça:</Text>
      </Paragraph>
      <ul>
        <li>Use curingas quando não souber o valor completo</li>
        <li>Combine com outros filtros para refinar a busca</li>
        <li>
          Use <Text code>%palavra%</Text> para encontrar palavras em qualquer posição
        </li>
        <li>
          Prefira começar com caracteres conhecidos (<Text code>ABC%</Text> é mais rápido que{' '}
          <Text code>%ABC</Text>)
        </li>
      </ul>

      <Paragraph>
        <Text strong>❌ Evite:</Text>
      </Paragraph>
      <ul>
        <li>
          Buscas muito genéricas (ex: <Text code>%A%</Text>) - podem retornar muitos resultados
        </li>
        <li>Usar curingas em campos que não aceitam (GTIN, Família, etc.)</li>
        <li>Esquecer os curingas quando quiser busca flexível</li>
      </ul>

      <Title level={4} style={{ marginTop: 24 }}>
        Perguntas Frequentes
      </Title>

      <Paragraph>
        <Text strong>Q: Qual a diferença entre * e %?</Text>
        <br />
        <Text>R: Nenhuma! Os dois funcionam exatamente da mesma forma.</Text>
      </Paragraph>

      <Paragraph>
        <Text strong>Q: Posso usar curinga no GTIN?</Text>
        <br />
        <Text>R: Não. O campo GTIN aceita apenas números (13 ou 14 dígitos).</Text>
      </Paragraph>

      <Paragraph>
        <Text strong>Q: A busca diferencia maiúsculas de minúsculas?</Text>
        <br />
        <Text>R: Geralmente não. "PARAFUSO" e "parafuso" são tratados da mesma forma.</Text>
      </Paragraph>

      <Paragraph>
        <Text strong>Q: Não encontrei resultados. O que fazer?</Text>
        <br />
        <Text>
          R: Tente adicionar curingas: em vez de <Text code>VÁLVULA</Text>, use{' '}
          <Text code>%VÁLVULA%</Text> ou <Text code>%VALV%</Text>
        </Text>
      </Paragraph>
    </div>
  ),
  keywords: [
    'wildcards',
    'curingas',
    'curinga',
    'asterisco',
    'percentual',
    '%',
    '*',
    'busca',
    'pesquisa',
    'like',
  ],
};
