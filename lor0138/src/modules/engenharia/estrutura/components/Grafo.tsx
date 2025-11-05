// src/modules/engenharia/estrutura/components/Grafo.tsx

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Slider,
  InputNumber,
  Switch,
  Segmented,
  Drawer,
  Card,
  Descriptions,
  Input,
  Collapse,
  message,
} from 'antd';
import { TreeNode, Operacao } from '../types/estrutura.types';
import { buildGraphData } from '../utils/chartBuilders';
import { useTheme } from '../../../../shared/contexts/ThemeContext';

const { Search } = Input;

interface GrafoProps {
  tree: TreeNode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemDrillDown?: (itemCodigo: string, itemDescricao?: string) => void;
  getLevelCss: (level: number) => string;
  showQty: boolean;
  onShowQtyChange: (checked: boolean) => void;
  bgColor: string;
  isOndeUsado?: boolean;
}

// Helper functions for safe localStorage access
const getSavedNumber = (key: string, defaultValue: number, min?: number, max?: number): number => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = parseFloat(saved);
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

const Grafo: React.FC<GrafoProps> = ({
  tree,
  selectedId,
  onSelect,
  onItemDrillDown,
  getLevelCss,
  showQty,
  onShowQtyChange,
  bgColor,
  isOndeUsado: _isOndeUsado = false, // Preparado para uso futuro
}) => {
  const { theme } = useTheme();
  const [zoomLevel, setZoomLevel] = useState<number>(() =>
    getSavedNumber('grafo_zoomLevel', 100, 50, 200)
  );
  const [layout, setLayout] = useState<'force' | 'circular'>(() => {
    const saved = getSavedString('grafo_layout', 'force');
    if (saved === 'force' || saved === 'circular') {
      return saved;
    } else {
      return 'force';
    }
  });
  const [maxDepth, setMaxDepth] = useState<number>(() =>
    getSavedNumber('grafo_maxDepth', 99, 1, 99)
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [repulsion, setRepulsion] = useState<number>(() =>
    getSavedNumber('grafo_repulsion', 50, 10, 200)
  );
  const [edgeLength, setEdgeLength] = useState<number>(() =>
    getSavedNumber('grafo_edgeLength', 150, 50, 400)
  );
  const [gravity, setGravity] = useState<number>(() => getSavedNumber('grafo_gravity', 0.1, 0, 1));
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
    saveValue('grafo_zoomLevel', zoomLevel);
  }, [zoomLevel]);

  // Persist layout to localStorage
  useEffect(() => {
    saveValue('grafo_layout', layout);
  }, [layout]);

  // Persist max depth to localStorage
  useEffect(() => {
    saveValue('grafo_maxDepth', maxDepth);
  }, [maxDepth]);

  // Persist repulsion to localStorage
  useEffect(() => {
    saveValue('grafo_repulsion', repulsion);
  }, [repulsion]);

  // Persist edge length to localStorage
  useEffect(() => {
    saveValue('grafo_edgeLength', edgeLength);
  }, [edgeLength]);

  // Persist gravity to localStorage
  useEffect(() => {
    saveValue('grafo_gravity', gravity);
  }, [gravity]);

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

  const graphData = useMemo(
    () =>
      tree ? buildGraphData(tree, getLevelCss, selectedId, showQty) : { nodes: [], links: [] },
    [tree, getLevelCss, selectedId, showQty]
  );

  // Calculate max level in data
  const maxLevelInData = useMemo(() => {
    if (graphData.nodes.length === 0) {
      return 1;
    }
    return Math.max(
      ...graphData.nodes.map((n) => {
        const matches = n.id.match(/>/g);
        return matches ? matches.length : 0;
      })
    );
  }, [graphData.nodes]);

  // Filter nodes/links by depth
  const filteredData = useMemo(() => {
    const nodes = graphData.nodes.filter((n) => {
      const level = (n.id.match(/>/g) || []).length;
      return level <= maxDepth;
    });
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graphData.links.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));
    return { nodes, links };
  }, [graphData, maxDepth]);

  // Enhance nodes with highlight
  const enhancedNodes = useMemo(() => {
    return filteredData.nodes.map((node) => {
      const level = (node.id.match(/>/g) || []).length;
      const isSel = selectedId === node.id;
      const isHighlighted = highlightedNode === node.id;

      return {
        ...node,
        itemStyle: {
          ...node.itemStyle,
          color: getLevelCss(level),
          borderColor: isHighlighted
            ? '#ff0000'
            : isSel
              ? '#4b9cff'
              : node.hasProcess
                ? '#333'
                : '#aaa',
          borderWidth: isHighlighted ? 4 : isSel ? 3 : node.hasProcess ? 2 : 1,
          shadowColor: isHighlighted ? '#ff0000' : 'transparent',
          shadowBlur: isHighlighted ? 10 : 0,
        },
      };
    });
  }, [filteredData.nodes, selectedId, highlightedNode, getLevelCss]);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            const source = params.data.source.split('>').pop();
            const target = params.data.target.split('>').pop();
            const value = params.data.value;
            return `<strong>${source}</strong> → <strong>${target}</strong><br/>Quantidade: ${value}`;
          }
          const d = params.data || {};
          const displayName = d.name || '';
          const qty = d.value;
          const hasProcess = d.hasProcess;
          const level = (d.id.match(/>/g) || []).length;

          // O name já vem formatado com estabelecimento do buildGraphData
          let tooltip = `<strong>${displayName}</strong><br/>Nível: ${level}`;
          if (showQty && qty !== undefined) {
            tooltip += `<br/>Quantidade: ${typeof qty === 'number' ? qty.toFixed(7) : qty}`;
          }
          if (hasProcess) {
            tooltip += `<br/><span style="color: #52c41a;">⚙️ Possui processo</span>`;
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
          type: 'graph',
          data: enhancedNodes,
          links: filteredData.links,
          layout: layout,
          roam: false,
          draggable: true,
          label: {
            show: true,
            color: colors.label,
          },
          force: {
            repulsion: repulsion,
            edgeLength: edgeLength,
            gravity: gravity,
            layoutAnimation: true,
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 9],
          lineStyle: {
            color: colors.lineStyle,
            curveness: 0.05,
            width: 1.2,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
              opacity: 1,
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          blur: {
            itemStyle: {
              opacity: 0.2,
            },
            lineStyle: {
              opacity: 0.1,
            },
          },
        },
      ],
    }),
    [
      enhancedNodes,
      filteredData.links,
      layout,
      repulsion,
      edgeLength,
      gravity,
      showQty,
      theme,
      colors,
    ]
  );

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        const id = params?.data?.id;
        if (id) {
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }

          clickTimeoutRef.current = setTimeout(() => {
            const node = filteredData.nodes.find((n) => n.id === id);
            if (node && node.hasProcess && node.process && node.process.length > 0) {
              setSelectedProcess({
                codigo: node.name,
                descricao: undefined,
                operations: node.process,
              });
              setDrawerVisible(true);
            }
            onSelect(id);
            clickTimeoutRef.current = null;
          }, 300);
        }
      },
      dblclick: (params: any) => {
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }

        if (onItemDrillDown) {
          const itemCodigo = params?.data?.name;
          if (itemCodigo) {
            onItemDrillDown(itemCodigo);
          }
        }
      },
    }),
    [filteredData.nodes, onSelect, onItemDrillDown]
  );

  // Handle search
  const handleSearch = (value: string) => {
    const found = filteredData.nodes.find((n) =>
      n.name.toLowerCase().includes(value.toLowerCase())
    );
    if (found) {
      setHighlightedNode(found.id);
      // Focus on chart
      if (chartRef.current) {
        const chart = chartRef.current.getEchartsInstance();
        chart.dispatchAction({
          type: 'highlight',
          seriesIndex: 0,
          dataIndex: filteredData.nodes.findIndex((n) => n.id === found.id),
        });
      }
    } else {
      setHighlightedNode(null);
    }
  };

  // Export handlers

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  if (!tree) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors.emptyText }}>
        Selecione um item na aba Resultado para visualizar sua estrutura
      </div>
    );
  }

  const chartHeight = (600 * zoomLevel) / 100;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Controls bar - Row 1 */}
      <div
        style={{
          padding: '8px 20px',
          backgroundColor: colors.controlBg,
          borderBottom: `1px solid ${colors.controlBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1 }}>
          {/* Show Qty */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Qtd:</span>
            <Switch checked={showQty} onChange={onShowQtyChange} size="small" />
          </div>

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: colors.controlBorder,
            }}
          />

          {/* Layout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Layout:</span>
            <Segmented
              options={[
                { label: 'Força', value: 'force' },
                { label: 'Circular', value: 'circular' },
              ]}
              value={layout}
              onChange={setLayout}
              size="small"
            />
          </div>

          {/* Depth Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Profundidade:</span>
            <Slider
              min={1}
              max={maxLevelInData}
              value={maxDepth}
              onChange={setMaxDepth}
              style={{ width: 120 }}
              marks={{ 1: '1', [maxLevelInData]: 'Todos' }}
            />
            <InputNumber
              min={1}
              max={maxLevelInData}
              value={maxDepth}
              onChange={(val) => setMaxDepth(val || maxLevelInData)}
              size="small"
              style={{ width: 60 }}
            />
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search
              placeholder="Buscar componente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
              size="small"
              allowClear
              onClear={() => setHighlightedNode(null)}
            />
          </div>

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: colors.controlBorder,
            }}
          />

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.text }}>Zoom:</span>
            <Slider
              min={50}
              max={200}
              value={zoomLevel}
              onChange={setZoomLevel}
              style={{ width: 100 }}
              marks={{ 50: '50%', 100: '100%', 200: '200%' }}
            />
            <InputNumber
              min={50}
              max={200}
              value={zoomLevel}
              onChange={(val) => setZoomLevel(val || 100)}
              size="small"
              style={{ width: 60 }}
              formatter={(value) => `${value}%`}
              parser={(value) => value?.replace('%', '') as any}
            />
          </div>
        </div>
      </div>

      {/* Controls bar - Row 2: Advanced Physics Controls */}
      <Collapse
        size="small"
        style={{
          backgroundColor: colors.controlBg,
          borderBottom: `1px solid ${colors.controlBorder}`,
        }}
        bordered={false}
        items={[
          {
            key: 'physics',
            label: '⚙️ Controles Avançados de Física',
            children: (
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  padding: '8px 0',
                }}
              >
                {/* Repulsion */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: colors.text }}>Repulsão:</span>
                  <Slider
                    min={10}
                    max={200}
                    value={repulsion}
                    onChange={setRepulsion}
                    style={{ width: 100 }}
                  />
                  <InputNumber
                    min={10}
                    max={200}
                    value={repulsion}
                    onChange={(v) => setRepulsion(v || 50)}
                    size="small"
                    style={{ width: 60 }}
                  />
                </div>

                {/* Edge Length */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: colors.text }}>Comprimento:</span>
                  <Slider
                    min={50}
                    max={400}
                    value={edgeLength}
                    onChange={setEdgeLength}
                    style={{ width: 100 }}
                  />
                  <InputNumber
                    min={50}
                    max={400}
                    value={edgeLength}
                    onChange={(v) => setEdgeLength(v || 150)}
                    size="small"
                    style={{ width: 60 }}
                  />
                </div>

                {/* Gravity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: colors.text }}>Gravidade:</span>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={gravity}
                    onChange={setGravity}
                    style={{ width: 100 }}
                  />
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.05}
                    value={gravity}
                    onChange={(v) => setGravity(v || 0.1)}
                    size="small"
                    style={{ width: 60 }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Chart Container with Natural Scroll */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: bgColor,
        }}
        onWheel={(e) => {
          e.currentTarget.scrollTop += e.deltaY;
        }}
      >
        <div style={{ height: chartHeight, minHeight: '100%', width: '100%' }}>
          <ReactECharts
            ref={chartRef}
            option={option}
            onEvents={onEvents}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      {/* Stats Panel */}
      <div
        style={{
          padding: '8px 20px',
          fontSize: 11,
          color: colors.emptyText,
          borderTop: `1px solid ${colors.controlBorder}`,
          backgroundColor: colors.controlBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          📊 {filteredData.nodes.length} nós • {filteredData.links.length} conexões • Layout:{' '}
          {layout}
          {maxDepth < maxLevelInData && ` • Mostrando até nível ${maxDepth}`}
        </div>
        <div style={{ fontSize: 10 }}>
          💡 Dica: Passe o mouse sobre os nós para ver dependências
        </div>
      </div>

      {/* Process Drawer */}
      <Drawer
        title={
          <div>
            <strong>Processo de Fabricação</strong>
            <div style={{ fontSize: 12, fontWeight: 'normal', color: colors.emptyText }}>
              Item: {selectedProcess?.codigo}
              {selectedProcess?.descricao && ` - ${selectedProcess.descricao}`}
            </div>
          </div>
        }
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedProcess?.operations.map((op, idx) => (
          <Card
            key={idx}
            size="small"
            title={`Operação ${op.codigo || idx + 1}`}
            style={{ marginBottom: 16 }}
          >
            <Descriptions size="small" column={1} bordered>
              {op.descricao && (
                <Descriptions.Item label="Descrição">{op.descricao}</Descriptions.Item>
              )}
              {op.estabelecimento && (
                <Descriptions.Item label="Estabelecimento">{op.estabelecimento}</Descriptions.Item>
              )}
              {op.centroCusto?.codigo && (
                <Descriptions.Item label="Centro de Custo">
                  {op.centroCusto.codigo}
                  {op.centroCusto.descricao && ` - ${op.centroCusto.descricao}`}
                </Descriptions.Item>
              )}
              {op.grupoMaquina?.codigo && (
                <Descriptions.Item label="Grupo de Máquina">
                  {op.grupoMaquina.codigo}
                  {op.grupoMaquina.descricao && ` - ${op.grupoMaquina.descricao}`}
                </Descriptions.Item>
              )}
              {op.tempos && (
                <>
                  {op.tempos.tempoHomemOriginal !== undefined && (
                    <Descriptions.Item label="Tempo Homem Original">
                      {op.tempos.tempoHomemOriginal}
                    </Descriptions.Item>
                  )}
                  {op.tempos.tempoMaquinaOriginal !== undefined && (
                    <Descriptions.Item label="Tempo Máquina Original">
                      {op.tempos.tempoMaquinaOriginal}
                    </Descriptions.Item>
                  )}
                  {op.tempos.horasHomemCalculadas !== undefined && (
                    <Descriptions.Item label="Horas Homem Calculadas">
                      {op.tempos.horasHomemCalculadas.toFixed(7)}
                    </Descriptions.Item>
                  )}
                  {op.tempos.horasMaquinaCalculadas !== undefined && (
                    <Descriptions.Item label="Horas Máquina Calculadas">
                      {op.tempos.horasMaquinaCalculadas.toFixed(7)}
                    </Descriptions.Item>
                  )}
                </>
              )}
              {op.recursos && (
                <>
                  {op.recursos.nrUnidades !== undefined && (
                    <Descriptions.Item label="Nr. Unidades">
                      {op.recursos.nrUnidades}
                    </Descriptions.Item>
                  )}
                  {op.recursos.numeroHomem !== undefined && (
                    <Descriptions.Item label="Nr. Homens">
                      {op.recursos.numeroHomem}
                    </Descriptions.Item>
                  )}
                  {op.recursos.unidadeMedida && (
                    <Descriptions.Item label="Unidade Medida">
                      {op.recursos.unidadeMedida}
                    </Descriptions.Item>
                  )}
                  {op.recursos.unidadeTempo && (
                    <Descriptions.Item label="Unidade Tempo">
                      {op.recursos.unidadeTempo}
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </Card>
        ))}
        {(!selectedProcess?.operations || selectedProcess.operations.length === 0) && (
          <div style={{ textAlign: 'center', color: colors.emptyText, padding: 24 }}>
            Nenhuma operação encontrada
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Grafo;
