// src/modules/engenharia/estrutura/components/Arvore.tsx

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Slider, InputNumber, Switch, Segmented, Drawer, Card, Descriptions, message } from 'antd';
import { TreeNode, Operacao } from '../types/estrutura.types';
import { buildTreeData } from '../utils/chartBuilders';
import { useTheme } from '../../../../shared/contexts/ThemeContext';

interface ArvoreProps {
  tree: TreeNode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemDrillDown?: (itemCodigo: string, itemDescricao?: string) => void;
  getLevelCss: (level: number) => string;
  showQty: boolean;
  onShowQtyChange: (checked: boolean) => void;
  baseHex: string;
  onBaseHexChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  reverse?: boolean; // Inverte orientação para Onde Usado
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
        }
        if (max !== undefined && parsed > max) {
          return max;
        }
        return parsed;
      }
    }
  } catch (e) {
    // localStorage disabled
  }
  return defaultValue;
};

const getSavedString = (key: string, defaultValue: string): string => {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const saveValue = (key: string, value: string | number) => {
  try {
    localStorage.setItem(key, value.toString());
  } catch (e) {
    // localStorage disabled - silently fail
  }
};

const Arvore: React.FC<ArvoreProps> = ({
  tree,
  selectedId,
  onSelect,
  onItemDrillDown,
  getLevelCss,
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
    getSavedNumber('arvore_zoomLevel', 100, 50, 200)
  );
  const [nodeSpacing, setNodeSpacing] = useState<number>(() =>
    getSavedNumber('arvore_nodeSpacing', 30, 5, 60)
  );
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'radial'>(() => {
    const saved = getSavedString('arvore_orientation', 'vertical');
    if (saved === 'vertical' || saved === 'horizontal' || saved === 'radial') {
      return saved;
    }
    return 'vertical';
  });
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
    saveValue('arvore_zoomLevel', zoomLevel);
  }, [zoomLevel]);

  // Persist node spacing to localStorage
  useEffect(() => {
    saveValue('arvore_nodeSpacing', nodeSpacing);
  }, [nodeSpacing]);

  // Persist orientation to localStorage
  useEffect(() => {
    saveValue('arvore_orientation', orientation);
  }, [orientation]);

  // Cores baseadas no tema
  const colors = useMemo(
    () => ({
      emptyText: theme === 'dark' ? '#666' : '#999',
      controlBg: theme === 'dark' ? '#1f1f1f' : '#fafafa',
      controlBorder: theme === 'dark' ? '#303030' : '#d9d9d9',
      text: theme === 'dark' ? '#fff' : '#000',
      label: theme === 'dark' ? '#fff' : '#111',
      lineStyle: theme === 'dark' ? '#555' : '#bbb',
    }),
    [theme]
  );

  const treeData = useMemo(
    () => (tree ? buildTreeData(tree, getLevelCss, selectedId, showQty) : null),
    [tree, getLevelCss, selectedId, showQty]
  );

  // Calcular altura dinâmica baseada no número de nós
  const chartHeight = useMemo(() => {
    if (!treeData) {
      return 600;
    }

    // Contar nós recursivamente
    const countNodes = (node: any): number => {
      let count = 1;
      if (node.children && node.children.length > 0) {
        count += node.children.reduce((sum: number, child: any) => sum + countNodes(child), 0);
      }
      return count;
    };

    const nodeCount = countNodes(treeData);
    // Altura mínima: 600px, adiciona 30px por nó, máximo 3000px
    const baseHeight = 600;
    const heightPerNode = 30;
    const maxHeight = 3000;

    // Para radial, usar proporções mais quadradas
    const calculatedHeight =
      orientation === 'radial'
        ? Math.min(1200, maxHeight)
        : Math.min(baseHeight + nodeCount * heightPerNode, maxHeight);

    // Aplicar zoom
    return (calculatedHeight * zoomLevel) / 100;
  }, [treeData, zoomLevel, orientation]);

  const option = useMemo(
    () => ({
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const name = params.name || '';
          const data = params.data || {};
          const qty = data.qtyAcumulada !== undefined ? data.qtyAcumulada : data.qty;
          const hasProcess = data.hasProcess;
          // O name já vem formatado com estabelecimento do buildTreeData
          let tooltip = `<strong>${name}</strong>`;
          if (showQty && qty !== undefined) {
            const qtyFormatted = typeof qty === 'number' ? qty.toFixed(7) : qty;
            tooltip += `<br/>Quantidade: ${qtyFormatted}`;
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
          type: 'tree',
          data: treeData ? [treeData] : [],
          top: 40,
          left: 60,
          bottom: 40,
          right: 60,
          // Inverter orientação para Onde Usado
          orient:
            orientation === 'radial'
              ? 'radial'
              : orientation === 'horizontal'
                ? reverse
                  ? 'RL'
                  : 'LR' // Horizontal: LR (normal) ou RL (invertido)
                : reverse
                  ? 'BT'
                  : 'TB', // Vertical: TB (normal) ou BT (invertido)
          layout: orientation === 'radial' ? 'radial' : 'orthogonal',
          symbol: 'circle',
          symbolSize: orientation === 'radial' ? 8 : 12,
          nodeGap: orientation === 'radial' ? nodeSpacing * 1.5 : nodeSpacing,
          expandAndCollapse: orientation !== 'radial',
          initialTreeDepth: orientation === 'radial' ? -1 : 99,
          roam: false,
          edgeShape: 'curve',
          edgeForkPosition: orientation === 'radial' ? '50%' : undefined,
          label: {
            position:
              orientation === 'radial' ? 'top' : orientation === 'vertical' ? 'bottom' : 'right',
            verticalAlign:
              orientation === 'radial' ? 'middle' : orientation === 'vertical' ? 'top' : 'middle',
            align:
              orientation === 'radial' ? 'center' : orientation === 'vertical' ? 'center' : 'left',
            color: colors.label,
            fontSize: 12,
          },
          leaves: {
            label: {
              position:
                orientation === 'radial' ? 'top' : orientation === 'vertical' ? 'bottom' : 'right',
              align:
                orientation === 'radial'
                  ? 'center'
                  : orientation === 'vertical'
                    ? 'center'
                    : 'left',
              color: colors.label,
              fontSize: 12,
            },
          },
          lineStyle: {
            color: colors.lineStyle,
            width: 1.5,
            opacity: 0.6,
          },
          emphasis: {
            focus: 'adjacency',
            label: {
              color: colors.label,
              fontWeight: 'bold',
              fontSize: 13,
            },
            itemStyle: {
              opacity: 1,
            },
            lineStyle: {
              opacity: 0.9,
              width: 2,
            },
          },
        },
      ],
    }),
    [treeData, orientation, nodeSpacing, showQty, theme, colors, reverse]
  );

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setSelectedProcess(null), 300); // Clear after animation
  };

  const formatNumber = (val: any) => {
    return typeof val === 'number' ? val.toFixed(7) : val;
  };

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
        let id = params?.data?.idPath;
        if (!id) {
          const pathArr = (params?.treePathInfo ?? []).map((p: any) => p?.name).filter(Boolean);
          if (pathArr.length) {
            id = pathArr.join('>');
          }
        }
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
                codigo: params?.data?.code || params?.data?.name,
                descricao: params?.name || params?.data?.name,
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
        if (onItemDrillDown) {
          const itemCodigo = params?.data?.name;
          const itemDescricao = params?.name || itemCodigo;
          if (itemCodigo) {
            onItemDrillDown(itemCodigo, itemDescricao);
          }
        }
      },
    }),
    [onSelect, onItemDrillDown]
  );

  // Contar nós para estatísticas
  const nodeCount = useMemo(() => {
    if (!treeData) {
      return 0;
    }

    const countNodes = (node: any): number => {
      let count = 1;
      if (node.children && node.children.length > 0) {
        count += node.children.reduce((sum: number, child: any) => sum + countNodes(child), 0);
      }
      return count;
    };

    return countNodes(treeData);
  }, [treeData]);

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

          {/* Orientação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Orientação:</span>
            <Segmented
              options={[
                { label: '↕️ Vertical', value: 'vertical' },
                { label: '↔️ Horizontal', value: 'horizontal' },
                { label: '⭕ Radial', value: 'radial' },
              ]}
              value={orientation}
              onChange={setOrientation}
              size="small"
            />
          </div>

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
              onChange={(val) => setNodeSpacing(val || 30)}
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
          overflow: 'auto',
          padding: 20,
        }}
      >
        <div style={{ height: chartHeight, width: '100%', minWidth: 800 }}>
          <ReactECharts
            ref={chartRef}
            option={option}
            notMerge={true}
            onEvents={onEvents}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      {/* Stats footer */}
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
        📊 {nodeCount} nós
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

export default Arvore;
