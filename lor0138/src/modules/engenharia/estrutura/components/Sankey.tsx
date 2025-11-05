// src/modules/engenharia/estrutura/components/Sankey.tsx

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Slider, InputNumber, Switch, Drawer, Card, Descriptions, message } from 'antd';
import { TreeNode, Operacao } from '../types/estrutura.types';
import { buildSankeyData } from '../utils/chartBuilders';
import { useTheme } from '../../../../shared/contexts/ThemeContext';

interface SankeyProps {
  tree: TreeNode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemDrillDown?: (itemCodigo: string, itemDescricao?: string) => void;
  getLevelCss: (level: number) => string;
  getLevelText: (level: number) => string;
  showQty: boolean;
  onShowQtyChange: (checked: boolean) => void;
  baseHex: string;
  onBaseHexChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  reverse?: boolean; // Inverte fluxo para Onde Usado
}

// Helper functions for safe localStorage access
const getSavedNumber = (key: string, defaultValue: number, min?: number, max?: number): number => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        if (min !== undefined && parsed < min) {
          return min;
        } else if (max !== undefined && parsed > max) {
          return max;
        } else {
          return parsed;
        }
      }
    }
  } catch (e) {
    // localStorage disabled
  }
  return defaultValue;
};

const saveValue = (key: string, value: string | number) => {
  try {
    localStorage.setItem(key, value.toString());
  } catch (e) {
    // localStorage disabled - silently fail
  }
};

const Sankey: React.FC<SankeyProps> = ({
  tree,
  selectedId,
  onSelect,
  onItemDrillDown,
  getLevelCss,
  getLevelText,
  showQty,
  onShowQtyChange,
  baseHex,
  onBaseHexChange,
  bgColor,
  onBgColorChange,
  reverse = false,
}) => {
  const { theme } = useTheme();
  const [zoomLevel, setZoomLevel] = useState<number>(() =>
    getSavedNumber('sankey_zoomLevel', 100, 50, 200)
  );
  const [nodeSpacing, setNodeSpacing] = useState<number>(() =>
    getSavedNumber('sankey_nodeSpacing', 20, 5, 60)
  );
  const [selectedProcess, setSelectedProcess] = useState<{
    codigo: string;
    descricao?: string;
    operations: Operacao[];
  } | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chartRef = useRef<any>(null);

  // Persist zoom level to localStorage
  useEffect(() => {
    saveValue('sankey_zoomLevel', zoomLevel);
  }, [zoomLevel]);

  // Persist node spacing to localStorage
  useEffect(() => {
    saveValue('sankey_nodeSpacing', nodeSpacing);
  }, [nodeSpacing]);

  // Cores baseadas no tema
  const colors = useMemo(
    () => ({
      emptyText: theme === 'dark' ? '#666' : '#999',
      controlBg: theme === 'dark' ? '#1f1f1f' : '#fafafa',
      controlBorder: theme === 'dark' ? '#303030' : '#d9d9d9',
      text: theme === 'dark' ? '#fff' : '#000',
    }),
    [theme]
  );

  const sankeyData = useMemo(
    () =>
      tree
        ? buildSankeyData(tree, getLevelCss, getLevelText, selectedId, showQty, reverse)
        : { nodes: [], links: [] },
    [tree, getLevelCss, getLevelText, selectedId, showQty, reverse]
  );

  // Calcular altura dinâmica baseada no número de nós (mais nós = mais altura)
  const chartHeight = useMemo(() => {
    const nodeCount = sankeyData.nodes.length;
    // Altura mínima: 600px, adiciona 40px por nó, máximo 3000px
    const baseHeight = 600;
    const heightPerNode = 40;
    const maxHeight = 3000;
    const calculatedHeight = Math.min(baseHeight + nodeCount * heightPerNode, maxHeight);

    // Aplicar zoom
    return (calculatedHeight * zoomLevel) / 100;
  }, [sankeyData.nodes.length, zoomLevel]);

  const option = useMemo(
    () => ({
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          if (p.dataType === 'edge') {
            const sourceCode = p.data.source?.split('>').pop() || p.data.source;
            const targetCode = p.data.target?.split('>').pop() || p.data.target;
            const value = typeof p.data.value === 'number' ? p.data.value.toFixed(7) : p.data.value;
            return `<strong>${sourceCode}</strong> → <strong>${targetCode}</strong><br/>Quantidade: ${value}`;
          }
          const d = p.data as any;
          const code = d?.code ?? '';
          const estab = d?.estabelecimento;
          // Formatar código com estabelecimento
          const displayCode = estab ? `${code} (${estab})` : code;
          const rawQty = d?.qtyAcumulada !== undefined ? d.qtyAcumulada : d?.qty;
          const qty = typeof rawQty === 'number' ? rawQty.toFixed(7) : rawQty;
          const hasProcess = d?.hasProcess;
          let tooltip = `<strong>${displayCode}</strong>`;
          if (showQty && qty) {
            tooltip += `<br/>Quantidade: ${qty}`;
          }
          if (hasProcess) {
            tooltip += `<br/><span style="color: #52c41a;">⚙️ Possui processo de fabricação</span>`;
            tooltip += `<br/><em style="font-size: 11px;">Clique para visualizar</em>`;
          }
          return tooltip;
        },
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#434343' : '#d9d9d9',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#000',
        },
      },
      series: [
        {
          type: 'sankey',
          data: sankeyData.nodes,
          links: sankeyData.links,
          orient: 'horizontal', // ✅ Horizontal (esquerda → direita)
          nodeAlign: 'justify',
          nodeWidth: 20, // Largura dos nós
          nodeGap: nodeSpacing, // Espaçamento vertical entre nós (controlável)
          draggable: false, // Desabilitar drag para melhor performance
          layoutIterations: 32, // Reduzido para melhor performance
          lineStyle: {
            color: 'source',
            curveness: 0.5,
            opacity: 0.4,
          },
          emphasis: {
            focus: 'adjacency',
            label: {
              color: theme === 'dark' ? '#fff' : '#111',
              fontWeight: 'bold',
            },
            itemStyle: {
              opacity: 1,
            },
            lineStyle: {
              opacity: 0.7,
            },
          },
          edgeLabel: showQty
            ? {
                show: true,
                formatter: (p: any) => {
                  const val = p.data?.value;
                  const formatted = typeof val === 'number' ? val.toFixed(2) : val;
                  return `${formatted}`;
                },
                color: theme === 'dark' ? '#fff' : '#111',
                fontSize: 11,
              }
            : { show: false },
          left: 60,
          right: 60,
          top: 40,
          bottom: 40,
          progressive: 0,
        },
      ],
    }),
    [sankeyData, showQty, theme, nodeSpacing]
  );

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setSelectedProcess(null), 300); // Clear after animation
  };

  const formatNumber = (val: any) => {
    return typeof val === 'number' ? val.toFixed(7) : val;
  };

  // Export handlers

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        const id = params?.data?.idPath ?? params?.data?.name;
        if (id) {
          onSelect(id);

          // Clear any pending click timeout
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }

          // If node has process, schedule drawer opening (can be cancelled by double-click)
          if (params?.data?.hasProcess && params?.data?.process) {
            clickTimeoutRef.current = setTimeout(() => {
              setSelectedProcess({
                codigo: params?.data?.code,
                descricao: params?.name || params?.data?.code,
                operations: params?.data?.process,
              });
              setDrawerVisible(true);
              clickTimeoutRef.current = null;
            }, 300); // 300ms delay
          }
        }
      },
      dblclick: (params: any) => {
        // Cancel pending click action (prevent drawer from opening)
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }

        // Execute drill-down
        if (onItemDrillDown && params?.dataType === 'node') {
          const itemCodigo = params?.data?.code;
          const itemDescricao = params?.name || itemCodigo;
          if (itemCodigo) {
            onItemDrillDown(itemCodigo, itemDescricao);
          }
        }
      },
    }),
    [onSelect, onItemDrillDown]
  );

  if (!tree) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors.emptyText }}>
        Selecione um item na aba Resultado para visualizar sua estrutura
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controles - Tudo em uma linha */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${colors.controlBorder}`,
          backgroundColor: colors.controlBg,
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* Mostrar Quantidade */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Mostrar Quantidade:</span>
            <Switch checked={showQty} onChange={onShowQtyChange} size="small" />
          </div>

          {/* Cor Base */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Cor base:</span>
            <input
              type="color"
              value={baseHex}
              onChange={(e) => onBaseHexChange(e.target.value)}
              style={{
                width: 32,
                height: 28,
                padding: 0,
                border: `1px solid ${colors.controlBorder}`,
                borderRadius: 4,
                cursor: 'pointer',
              }}
              title="Escolher cor base do degradê"
            />
          </div>

          {/* Cor de Fundo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Cor de fundo:</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => onBgColorChange(e.target.value)}
              style={{
                width: 32,
                height: 28,
                padding: 0,
                border: `1px solid ${colors.controlBorder}`,
                borderRadius: 4,
                cursor: 'pointer',
              }}
              title="Escolher cor de fundo"
            />
          </div>

          {/* Divisor vertical */}
          <div
            style={{
              width: 1,
              height: 24,
              backgroundColor: colors.controlBorder,
            }}
          />

          {/* Controle de Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Zoom:</span>
            <Slider
              min={50}
              max={200}
              value={zoomLevel}
              onChange={setZoomLevel}
              step={10}
              style={{ width: 120 }}
              tooltip={{ formatter: (value) => `${value}%` }}
            />
            <InputNumber
              min={50}
              max={200}
              value={zoomLevel}
              onChange={(val) => setZoomLevel(val || 100)}
              formatter={(value) => `${value}%`}
              parser={(value) => value?.replace('%', '') as unknown as number}
              style={{ width: 70 }}
              size="small"
            />
          </div>

          {/* Controle de Espaçamento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Espaçamento:</span>
            <Slider
              min={5}
              max={60}
              value={nodeSpacing}
              onChange={setNodeSpacing}
              step={5}
              style={{ width: 100 }}
              tooltip={{ formatter: (value) => `${value}px` }}
            />
            <InputNumber
              min={5}
              max={60}
              value={nodeSpacing}
              onChange={(val) => setNodeSpacing(val || 20)}
              formatter={(value) => `${value}px`}
              parser={(value) => value?.replace('px', '') as unknown as number}
              style={{ width: 70 }}
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Área de Visualização com Scroll */}
      <div
        style={{
          flex: 1,
          overflow: 'auto', // ✅ Scroll quando necessário
          padding: 20,
        }}
      >
        <div style={{ height: chartHeight, width: '100%', minWidth: 800 }}>
          <ReactECharts
            ref={chartRef}
            option={option}
            onEvents={onEvents}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'svg' }} // ✅ SVG para melhor qualidade em zoom
          />
        </div>
      </div>

      {/* Info de performance */}
      <div
        style={{
          padding: '8px 20px',
          fontSize: 11,
          color: colors.emptyText,
          textAlign: 'right',
          borderTop: `1px solid ${colors.controlBorder}`,
          backgroundColor: colors.controlBg,
        }}
      >
        📊 {sankeyData.nodes.length} nós, {sankeyData.links.length} conexões
        {chartHeight > 1500 && ' • Scroll vertical disponível'}
      </div>

      {/* Process Details Drawer */}
      <Drawer
        title={`Processo de Fabricação - ${selectedProcess?.codigo}`}
        placement="right"
        width={500}
        onClose={handleCloseDrawer}
        open={drawerVisible}
        styles={{
          body: { padding: 16 },
        }}
      >
        {selectedProcess?.operations.map((op, idx) => (
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
        ))}
      </Drawer>
    </div>
  );
};

export default Sankey;
