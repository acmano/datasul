// src/modules/engenharia/estrutura/components/ItemHeader.tsx

import React, { useState, useMemo } from 'react';
import {
  Button,
  Tooltip,
  Typography,
  Skeleton,
  DatePicker,
  Checkbox,
  Space,
  Radio,
  InputNumber,
  Drawer,
  Card,
  Descriptions,
  Empty,
} from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, ToolOutlined } from '@ant-design/icons';
import { ItemPrincipal, TipoEstrutura, ModoApresentacao, Operacao } from '../types/estrutura.types';
import dayjs, { Dayjs } from 'dayjs';
import { formatarCodigoComEstab } from '../utils/formatters';

const { Text } = Typography;

interface ItemHeaderProps {
  estruturaData: ItemPrincipal | null;
  menuSecundarioVisible: boolean;
  onToggleMenuSecundario: () => void;
  theme: 'light' | 'dark';
  isLoading?: boolean;
  dataReferencia: string;
  onDataReferenciaChange: (date: string) => void;
  mostrarHistorico: boolean;
  onMostrarHistoricoChange: (checked: boolean) => void;
  tipoEstrutura: TipoEstrutura;
  onTipoEstruturaChange: (tipo: TipoEstrutura) => void;
  quantidadeMultiplicador: number;
  onQuantidadeMultiplicadorChange: (quantidade: number) => void;
  modoApresentacao: ModoApresentacao;
  onModoApresentacaoChange: (modo: ModoApresentacao) => void;
}

/**
 * Cabeçalho com informações do item principal e toggle do menu
 */
const ItemHeader: React.FC<ItemHeaderProps> = ({
  estruturaData,
  menuSecundarioVisible,
  onToggleMenuSecundario,
  theme,
  isLoading = false,
  dataReferencia,
  onDataReferenciaChange,
  mostrarHistorico,
  onMostrarHistoricoChange,
  tipoEstrutura,
  onTipoEstruturaChange,
  quantidadeMultiplicador,
  onQuantidadeMultiplicadorChange,
  modoApresentacao,
  onModoApresentacaoChange,
}) => {
  const borderColor = theme === 'dark' ? '#303030' : '#f0f0f0';
  const bgColor = theme === 'dark' ? '#141414' : '#fafafa';

  // Estado para controlar o Drawer de processo do item pai
  const [drawerProcessoPaiVisible, setDrawerProcessoPaiVisible] = useState(false);

  // Extrai operações do processo de fabricação do item pai
  const processoPai = useMemo(() => {
    if (!estruturaData?.processoFabricacao?.operacao) {
      return [];
    }
    // processoFabricacao é um objeto com propriedade operacao (array de operações)
    return estruturaData.processoFabricacao.operacao.filter(Boolean) as Operacao[];
  }, [estruturaData]);

  // Verifica se o item tem processo de fabricação
  const hasProcessoPai = processoPai.length > 0;

  // Função para formatar números com precisão controlada
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) {
      return '-';
    }
    return num.toFixed(7).replace(/\.?0+$/, '');
  };

  // ✅ REGRA SIMPLES: Se está loading, mostra skeleton. SEMPRE.
  // Só mostra dados se NÃO está loading E tem dados.
  const shouldShowSkeleton = isLoading || !estruturaData;

  if (shouldShowSkeleton) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${borderColor}`,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Tooltip
          title={
            menuSecundarioVisible
              ? 'Esconder menu de visualizações (Ctrl+Alt+0)'
              : 'Mostrar menu de visualizações (Ctrl+Alt+0)'
          }
        >
          <Button
            type="text"
            size="small"
            icon={menuSecundarioVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={onToggleMenuSecundario}
          />
        </Tooltip>
        <Skeleton.Input active style={{ width: 400, height: 22 }} />
      </div>
    );
  }

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      onDataReferenciaChange(date.format('YYYY-MM-DD'));
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${borderColor}`,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <Tooltip
        title={
          menuSecundarioVisible
            ? 'Esconder menu de visualizações (Ctrl+Alt+0)'
            : 'Mostrar menu de visualizações (Ctrl+Alt+0)'
        }
      >
        <Button
          type="text"
          size="small"
          icon={menuSecundarioVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={onToggleMenuSecundario}
        />
      </Tooltip>
      <Typography.Text strong style={{ fontSize: 16 }}>
        Item: {formatarCodigoComEstab(estruturaData.codigo, estruturaData.estabelecimento)} -{' '}
        {estruturaData.descricao}
      </Typography.Text>

      {/* Botão de Processo do Item Pai */}
      {hasProcessoPai && (
        <Tooltip title="Ver processo de fabricação do item pai">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<ToolOutlined />}
            onClick={() => setDrawerProcessoPaiVisible(true)}
            style={{ marginLeft: 8 }}
          >
            Processo
          </Button>
        </Tooltip>
      )}

      {/* Controles centrais */}
      <Space size="middle" wrap style={{ marginLeft: 16 }}>
        {/* Seletor Engenharia/Consumo */}
        <Space size="small">
          <Text style={{ fontSize: 13 }}>Tipo:</Text>
          <Radio.Group
            value={tipoEstrutura}
            onChange={(e) => onTipoEstruturaChange(e.target.value)}
            size="small"
          >
            <Radio.Button value="engenharia">Engenharia</Radio.Button>
            <Radio.Button value="consumo">Consumo</Radio.Button>
          </Radio.Group>
        </Space>

        {/* Campo quantidade (só visível em Consumo) */}
        {tipoEstrutura === 'consumo' && (
          <Space size="small">
            <Text style={{ fontSize: 13 }}>Quantidade:</Text>
            <InputNumber
              min={0.001}
              step={1}
              value={quantidadeMultiplicador}
              onChange={(val) => onQuantidadeMultiplicadorChange(val || 1)}
              precision={3}
              style={{ width: 120 }}
              size="small"
            />
          </Space>
        )}

        {/* Seletor Estrutura/Lista (só visível em Consumo) */}
        {tipoEstrutura === 'consumo' && (
          <Space size="small">
            <Text style={{ fontSize: 13 }}>Apresentação:</Text>
            <Radio.Group
              value={modoApresentacao}
              onChange={(e) => onModoApresentacaoChange(e.target.value)}
              size="small"
            >
              <Radio.Button value="estrutura">Estrutura</Radio.Button>
              <Radio.Button value="lista">Lista</Radio.Button>
            </Radio.Group>
          </Space>
        )}
      </Space>

      {/* Controles de data à direita */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Space size="small">
          <Typography.Text style={{ fontSize: 14 }}>Data de Referência:</Typography.Text>
          <DatePicker
            value={dayjs(dataReferencia)}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            size="small"
            allowClear={false}
          />
        </Space>
        <Tooltip title="Exibir componentes inativos na data de referência">
          <Checkbox
            checked={mostrarHistorico}
            onChange={(e) => onMostrarHistoricoChange(e.target.checked)}
          >
            Mostrar histórico completo
          </Checkbox>
        </Tooltip>
      </div>

      {/* Drawer de Processo do Item Pai */}
      <Drawer
        title={`Processo de Fabricação - ${estruturaData?.codigo}`}
        placement="right"
        width={500}
        onClose={() => setDrawerProcessoPaiVisible(false)}
        open={drawerProcessoPaiVisible}
        styles={{
          body: { padding: 16 },
        }}
      >
        {processoPai.length === 0 ? (
          <Empty description="Nenhum processo cadastrado para este item" />
        ) : (
          processoPai.map((op, idx) => (
            <Card
              key={idx}
              style={{ marginBottom: 16 }}
              title={`Operação ${op.codigo}: ${op.descricao || ''}`}
              size="small"
            >
              <Descriptions column={1} size="small">
                {op.centroCusto && (
                  <Descriptions.Item label="Centro de Custo">
                    {op.centroCusto?.codigo} - {op.centroCusto?.descricao}
                  </Descriptions.Item>
                )}
                {op.grupoMaquina && (
                  <Descriptions.Item label="Grupo de Máquina">
                    {op.grupoMaquina?.codigo} - {op.grupoMaquina?.descricao}
                  </Descriptions.Item>
                )}
                {op.tempos && (
                  <>
                    {op.tempos.horasHomemCalculadas !== undefined && (
                      <Descriptions.Item label="Tempo Homem">
                        {formatNumber(op.tempos.horasHomemCalculadas)} h
                      </Descriptions.Item>
                    )}
                    {op.tempos.horasMaquinaCalculadas !== undefined && (
                      <Descriptions.Item label="Tempo Máquina">
                        {formatNumber(op.tempos.horasMaquinaCalculadas)} h
                      </Descriptions.Item>
                    )}
                  </>
                )}
                {op.recursos && (
                  <>
                    {op.recursos.nrUnidades !== undefined && (
                      <Descriptions.Item label="Unidades">
                        {formatNumber(op.recursos.nrUnidades)} {op.recursos.unidadeMedida || ''}
                      </Descriptions.Item>
                    )}
                    {op.recursos.numeroHomem !== undefined && (
                      <Descriptions.Item label="Número de Homens">
                        {formatNumber(op.recursos.numeroHomem)}
                      </Descriptions.Item>
                    )}
                  </>
                )}
              </Descriptions>
            </Card>
          ))
        )}
      </Drawer>
    </div>
  );
};

export default ItemHeader;
