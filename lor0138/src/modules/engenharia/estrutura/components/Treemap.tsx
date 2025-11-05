// src/modules/engenharia/estrutura/components/Treemap.tsx

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Slider, InputNumber, Switch, Drawer, Card, Descriptions, message } from 'antd';
import { TreeNode, Operacao } from '../types/estrutura.types';
import { buildTreemapData } from '../utils/chartBuilders';
import { useTheme } from '../../../../shared/contexts/ThemeContext';

interface TreemapProps {
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
  isOndeUsado?: boolean;
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

const Treemap: React.FC<TreemapProps> = ({
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
  isOndeUsado = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const { theme } = useTheme();
  const [zoomLevel, setZoomLevel] = useState<number>(() =>
    getSavedNumber('treemap_zoomLevel', 100, 50, 200)
  );
  const [nodeSpacing, setNodeSpacing] = useState<number>(() =>
    getSavedNumber('treemap_nodeSpacing', 2, 0, 10)
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
    saveValue('treemap_zoomLevel', zoomLevel);
  }, [zoomLevel]);

  // Persist node spacing to localStorage
  useEffect(() => {
    saveValue('treemap_nodeSpacing', nodeSpacing);
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

  const treemapData = useMemo(
    () => (tree ? buildTreemapData(tree, getLevelCss, selectedId, showQty) : null),
    [tree, getLevelCss, selectedId, showQty]
  );

  // Calcular altura dinâmica baseada no zoom
  const chartHeight = useMemo(() => {
    const baseHeight = 800;
    const calculatedHeight = baseHeight;
    return (calculatedHeight * zoomLevel) / 100;
  }, [zoomLevel]);

  const option = useMemo(
    () => ({
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data || {};
          const name = data.name || params.name || '';
          const qty = data.qtyAcumulada !== undefined ? data.qtyAcumulada : data.qty;
          const hasProcess = data.hasProcess;
          // O name já vem formatado com estabelecimento do buildTreemapData
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
        textStyle: { color: theme === 'dark' ? '#fff' : '#000' },
      },
      series: [
        {
          type: 'treemap',
          data: treemapData ? [treemapData] : [],
          roam: false,
          nodeClick: 'link',
          breadcrumb: { show: false },
          levels: [
            { itemStyle: { borderWidth: 0, gapWidth: nodeSpacing } },
            { itemStyle: { gapWidth: nodeSpacing } },
            { itemStyle: { gapWidth: nodeSpacing } },
            { itemStyle: { gapWidth: nodeSpacing } },
          ],
          label: {
            show: true,
            formatter: (p: any) => {
              const d = p.data || {};
              const code = d.name || '';
              const qty = d.qtyAcumulada !== undefined ? d.qtyAcumulada : d.qty;
              if (showQty && qty !== undefined) {
                const qtyFormatted = typeof qty === 'number' ? qty.toFixed(2) : qty;
                return `${code}\n(${qtyFormatted})`;
              }
              return code;
            },
            color: theme === 'dark' ? '#fff' : '#000',
          },
          upperLabel: {
            show: true,
            height: 30,
            color: theme === 'dark' ? '#fff' : '#000',
          },
          emphasis: {
            itemStyle: { borderColor: '#ffaa00', borderWidth: 3 },
          },
        },
      ],
    }),
    [treemapData, showQty, theme, nodeSpacing]
  );

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setSelectedProcess(null), 300);
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
        const id = params?.data?.idPath;
        if (id) {
          onSelect(id);

          // Clear pending timeout
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }

          // Schedule drawer opening (can be cancelled by double-click)
          if (params?.data?.hasProcess && params?.data?.process) {
            clickTimeoutRef.current = setTimeout(() => {
              setSelectedProcess({
                codigo: params?.data?.name,
                descricao: params?.data?.name,
                operations: params?.data?.process,
              });
              setDrawerVisible(true);
              clickTimeoutRef.current = null;
            }, 300);
          }
        }
      },
      dblclick: (params: any) => {
        // Cancel pending click
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }

        // Drill-down
        if (onItemDrillDown) {
          const itemCodigo = params?.data?.name;
          const itemDescricao = params?.data?.name;
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
              min={0}
              max={10}
              value={nodeSpacing}
              onChange={setNodeSpacing}
              step={1}
              style={{ width: 100 }}
              tooltip={{ formatter: (value) => `${value}px` }}
            />
            <InputNumber
              min={0}
              max={10}
              value={nodeSpacing}
              onChange={(val) => setNodeSpacing(val || 2)}
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
        📊 Visualização Treemap
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

export default Treemap;
