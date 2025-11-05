// src/modules/engenharia/estrutura/components/TabelaItens.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Slider, Tag } from 'antd';
import { VariableSizeList as List } from 'react-window';
import { TreeNode, FlatNode } from '../types/estrutura.types';
import { flattenTree, getAncestors } from '../utils/dataProcessing';
import { HSL, hslToCss, contrastTextForHsl } from '../utils/colorUtils';
import { useTheme } from '../../../../shared/contexts/ThemeContext';
import { formatarCodigoComEstab } from '../utils/formatters';

// Tipos para as linhas virtualizadas
interface VirtualRow {
  type: 'item' | 'process';
  node: FlatNode;
  processIndex?: number;
}

interface TabelaItensProps {
  tree: TreeNode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemDrillDown?: (itemCodigo: string, itemDescricao?: string) => void;
  getLevelHsl: (level: number) => HSL;
  showQty: boolean;
  baseHex: string;
  onBaseHexChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
}

const TabelaItens: React.FC<TabelaItensProps> = ({
  tree,
  selectedId,
  onSelect,
  onItemDrillDown,
  getLevelHsl,
  showQty,
  baseHex,
  onBaseHexChange,
  bgColor,
  onBgColorChange,
}) => {
  const { theme } = useTheme();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedProcessIds, setExpandedProcessIds] = useState<Set<string>>(new Set());
  const [rootId, setRootId] = useState<string | null>(null);
  const [maxExpandLevel, setMaxExpandLevel] = useState<number>(1);
  const [listHeight, setListHeight] = useState<number>(600);
  const listRef = useRef<List>(null);
  const rowIndexMap = useRef<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Cores baseadas no tema
  const colors = useMemo(
    () => ({
      emptyText: theme === 'dark' ? '#666' : '#999',
      border: theme === 'dark' ? '#303030' : '#f0f0f0',
      headerBg: theme === 'dark' ? '#262626' : '#f2f2f2',
      headerText: theme === 'dark' ? '#fff' : '#111',
      inputBorder: theme === 'dark' ? '#434343' : '#ccc',
    }),
    [theme]
  );

  // Achatar árvore
  const flat = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);

  // Calcular nível máximo da estrutura (excluindo o nível 0)
  const maxLevel = useMemo(() => {
    if (!flat.length) {
      return 1;
    }
    // Filtra apenas níveis > 0 para não contar a raiz
    const levels = flat.filter((n) => n.level > 0).map((n) => n.level);
    return levels.length > 0 ? Math.max(...levels) : 1;
  }, [flat]);

  // Criar marcas para o slider
  const sliderMarks = useMemo(() => {
    const marks: Record<number, string> = {};
    for (let i = 1; i <= maxLevel; i++) {
      marks[i] = `${i}`;
    }
    return marks;
  }, [maxLevel]);

  // Inicializar rootId
  useEffect(() => {
    if (!flat.length) {
      return;
    }
    const root = flat.find((n) => n.level === 0);
    setRootId(root?.id ?? null);
  }, [flat]);

  // Expandir automaticamente quando rootId e maxLevel estiverem prontos
  // ✅ LAZY LOADING: Expande apenas 3 níveis inicialmente para melhor performance
  useEffect(() => {
    if (!rootId || !flat.length || maxLevel === 0) {
      return;
    }

    // Lazy Loading: carregar até 10 níveis inicialmente
    const initialExpandLevel = Math.min(10, maxLevel);

    setMaxExpandLevel(initialExpandLevel);
    expandToLevel(initialExpandLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootId, maxLevel]);

  // Calcular altura do container automaticamente
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const height = window.innerHeight - rect.top - 24; // 24px de margem
        setListHeight(Math.max(300, height)); // Mínimo 300px
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Linhas virtualizadas da tabela (NÃO MOSTRA O NÍVEL 0)
  // Inclui linhas de itens + linhas de processo expandidas
  const virtualRows = useMemo(() => {
    if (!flat.length || !rootId) {
      return [];
    }
    const rows: VirtualRow[] = [];
    const childrenMap = new Map<string | undefined, FlatNode[]>();

    flat.forEach((n) => {
      const arr = childrenMap.get(n.parentId) ?? [];
      arr.push(n);
      childrenMap.set(n.parentId, arr);
    });

    const walk = (parentId: string | undefined) => {
      const kids = (childrenMap.get(parentId) ?? []).sort((a, b) => a.code.localeCompare(b.code));
      for (const k of kids) {
        // Adiciona a linha do item
        rows.push({ type: 'item', node: k });

        // Se o processo estiver expandido, adiciona linhas de processo
        if (expandedProcessIds.has(k.id) && k.hasProcess && k.process.length > 0) {
          k.process.forEach((_, idx) => {
            rows.push({ type: 'process', node: k, processIndex: idx });
          });
        }

        // Recursão para filhos
        if (k.hasChildren && expandedIds.has(k.id)) {
          walk(k.id);
        }
      }
    };

    // Começa pelos filhos da raiz, não pela raiz
    walk(rootId);

    // Atualiza o mapa de índices para scrollToItem
    const newMap: Record<string, number> = {};
    rows.forEach((row, idx) => {
      if (row.type === 'item') {
        newMap[row.node.id] = idx;
      }
    });
    rowIndexMap.current = newMap;

    return rows;
  }, [flat, expandedIds, expandedProcessIds, rootId]);

  // Resetar cache de tamanhos quando as linhas mudam
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [virtualRows]);

  // Handlers
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const toggleProcessExpand = (id: string) => {
    const next = new Set(expandedProcessIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedProcessIds(next);
  };

  const expandToLevel = (targetLevel: number) => {
    if (!flat.length || !rootId) {
      return;
    }

    const toExpand = new Set<string>();
    flat.forEach((node) => {
      // ✅ Para mostrar ATÉ nível N, devemos expandir níveis 0 até N-1
      // Quando expandimos um nó, mostramos seus FILHOS
      // Exemplos:
      // - targetLevel = 1: expande nível 0 (raiz) → mostra nível 1
      // - targetLevel = 2: expande níveis 0 e 1 → mostra níveis 1 e 2
      // - targetLevel = 3: expande níveis 0, 1 e 2 → mostra níveis 1, 2 e 3
      if (node.level >= 0 && node.level < targetLevel && node.hasChildren) {
        toExpand.add(node.id);
      }
    });

    setExpandedIds(toExpand);
    setMaxExpandLevel(targetLevel);
  };

  const ensureRowVisible = (id: string) => {
    const ancestors = getAncestors(id);
    const next = new Set(expandedIds);
    ancestors.forEach((a) => next.add(a));
    setExpandedIds(next);
    setTimeout(() => {
      const rowIndex = rowIndexMap.current[id];
      if (rowIndex !== undefined && listRef.current) {
        listRef.current.scrollToItem(rowIndex, 'smart');
      }
    }, 100);
  };

  const selectById = (id: string) => {
    onSelect(id);
    ensureRowVisible(id);
  };

  // Função para calcular a altura de cada linha
  const getItemSize = (index: number): number => {
    const row = virtualRows[index];
    if (!row) {
      return 40;
    }

    if (row.type === 'item') {
      return 40; // Altura padrão de uma linha de item
    } else {
      return 120; // Altura de uma linha de processo expandida
    }
  };

  // Componente de linha virtualizada
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = virtualRows[index];
    if (!row) {
      return null;
    }

    if (row.type === 'process') {
      // Renderiza linha de processo
      const op = row.node.process[row.processIndex!];
      return (
        <div
          style={{
            ...style,
            background: '#fffbf0',
            borderLeft: '4px solid #f3c37a',
            fontSize: 12,
            padding: '12px 20px 12px 40px',
            borderBottom: '1px solid #f9f3e6',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#7a4e00' }}>
              Operação {op.codigo}: {op.descricao}
            </strong>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              color: '#666',
            }}
          >
            <div>
              <strong>Centro de Custo:</strong> {op.centroCusto?.codigo} -{' '}
              {op.centroCusto?.descricao}
            </div>
            <div>
              <strong>Grupo de Máquina:</strong> {op.grupoMaquina?.codigo} -{' '}
              {op.grupoMaquina?.descricao}
            </div>
            {op.tempos && (
              <>
                <div>
                  <strong>Tempo Homem:</strong>{' '}
                  {typeof op.tempos.horasHomemCalculadas === 'number'
                    ? op.tempos.horasHomemCalculadas.toFixed(7)
                    : op.tempos.horasHomemCalculadas}{' '}
                  h
                </div>
                <div>
                  <strong>Tempo Máquina:</strong>{' '}
                  {typeof op.tempos.horasMaquinaCalculadas === 'number'
                    ? op.tempos.horasMaquinaCalculadas.toFixed(7)
                    : op.tempos.horasMaquinaCalculadas}{' '}
                  h
                </div>
              </>
            )}
            {op.recursos && (
              <>
                <div>
                  <strong>Unidades:</strong>{' '}
                  {typeof op.recursos.nrUnidades === 'number'
                    ? op.recursos.nrUnidades.toFixed(7)
                    : op.recursos.nrUnidades}{' '}
                  {op.recursos.unidadeMedida}
                </div>
                <div>
                  <strong>Número de Homens:</strong>{' '}
                  {typeof op.recursos.numeroHomem === 'number'
                    ? op.recursos.numeroHomem.toFixed(7)
                    : op.recursos.numeroHomem}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Renderiza linha de item
    const r = row.node;
    const { h, s, l } = getLevelHsl(r.level);
    const rowColor = hslToCss(h, s, l);
    const textColor = contrastTextForHsl(h, s, l);
    const levelStripe = rowColor;

    return (
      <div
        style={{
          ...style,
          display: 'table',
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
        }}
      >
        <div
          onClick={() => selectById(r.id)}
          onDoubleClick={() => {
            if (onItemDrillDown) {
              onItemDrillDown(r.code, r.name);
            }
          }}
          style={{
            display: 'table-row',
            cursor: 'pointer',
            background: rowColor,
            color: textColor,
            outline: selectedId === r.id ? '2px solid rgba(75,156,255,0.7)' : 'none',
            outlineOffset: -2,
          }}
        >
          <div
            style={{
              display: 'table-cell',
              borderBottom: `1px solid ${colors.border}`,
              padding: '6px 10px',
              borderLeft: `6px solid ${levelStripe}`,
              width: '60px',
            }}
          >
            {r.level}
          </div>

          <div
            style={{
              display: 'table-cell',
              borderBottom: `1px solid ${colors.border}`,
              padding: '6px 10px',
              width: '200px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Barrinhas de nível */}
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {Array.from({ length: r.level + 1 }).map((_, i) => {
                  const barHsl = getLevelHsl(i);
                  return (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 12,
                        borderRadius: 2,
                        background: hslToCss(barHsl.h, barHsl.s, barHsl.l),
                      }}
                    />
                  );
                })}
              </div>

              {/* Toggle */}
              {r.hasChildren ? (
                <span
                  title={expandedIds.has(r.id) ? 'Colapsar' : 'Expandir'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(r.id);
                  }}
                  style={{
                    width: 14,
                    textAlign: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: textColor,
                  }}
                >
                  {expandedIds.has(r.id) ? '▾' : '▸'}
                </span>
              ) : (
                <span
                  style={{
                    width: 14,
                    textAlign: 'center',
                    opacity: 0.4,
                    color: textColor,
                  }}
                >
                  •
                </span>
              )}

              <span>{formatarCodigoComEstab(r.code, r.estabelecimento)}</span>
            </div>
          </div>

          <div
            style={{
              display: 'table-cell',
              borderBottom: `1px solid ${colors.border}`,
              padding: '6px 10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  opacity: r.isValid === false ? 0.5 : 1,
                  fontStyle: r.isValid === false ? 'italic' : 'normal',
                }}
              >
                {r.name}
              </span>
              {r.isValid === false && (
                <Tag color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                  Inativo
                </Tag>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'table-cell',
              borderBottom: `1px solid ${colors.border}`,
              padding: '6px 10px',
              textAlign: 'right',
              width: '120px',
            }}
          >
            {showQty
              ? (() => {
                  const qty = r.qtyAcumulada !== undefined ? r.qtyAcumulada : r.qty;
                  return typeof qty === 'number' ? qty.toFixed(7) : qty;
                })()
              : ''}
          </div>

          <div
            style={{
              display: 'table-cell',
              borderBottom: `1px solid ${colors.border}`,
              padding: '6px 10px',
              width: '60px',
            }}
          >
            {r.unidadeMedida || ''}
          </div>

          <div
            style={{
              display: 'table-cell',
              borderBottom: `1px solid ${colors.border}`,
              padding: '6px 10px',
              width: '120px',
            }}
          >
            {r.hasProcess ? (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 10,
                  background: expandedProcessIds.has(r.id) ? '#f3c37a' : '#ffeacc',
                  border: '1px solid #f3c37a',
                  color: '#7a4e00',
                  cursor: 'pointer',
                  fontWeight: expandedProcessIds.has(r.id) ? 600 : 400,
                }}
                title={expandedProcessIds.has(r.id) ? 'Ocultar processo' : 'Ver processo'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProcessExpand(r.id);
                }}
              >
                {expandedProcessIds.has(r.id) ? '▾' : '▸'} Processo
              </span>
            ) : (
              <span style={{ opacity: 0.4, color: textColor }}>—</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!tree) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors.emptyText }}>
        Selecione um item na aba Resultado para visualizar sua estrutura
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 12 }}>
      {/* Controles em uma única linha */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 300 }}>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 120 }}>Expandir até nível:</span>
          <Slider
            min={1}
            max={maxLevel}
            value={maxExpandLevel}
            onChange={(value) => expandToLevel(value)}
            marks={sliderMarks}
            step={1}
            style={{ flex: 1, maxWidth: 400 }}
            tooltip={{ formatter: (value) => `Nível ${value}` }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>Cor base:</span>
          <input
            type="color"
            value={baseHex}
            onChange={(e) => onBaseHexChange(e.target.value)}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
            title="Escolher cor base do degradê"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>Cor de fundo:</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => onBgColorChange(e.target.value)}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
            title="Escolher cor de fundo"
          />
        </div>
      </div>

      {/* Tabela Virtualizada */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header fixo da tabela */}
        <div
          style={{
            display: 'table',
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            fontSize: 13,
            border: `1px solid ${colors.border}`,
            borderBottom: 'none',
          }}
        >
          <div style={{ display: 'table-row' }}>
            <div
              style={{
                display: 'table-cell',
                background: colors.headerBg,
                borderBottom: '2px solid #ddd',
                padding: '8px 10px',
                textAlign: 'left',
                color: colors.headerText,
                fontWeight: 600,
                width: '60px',
              }}
            >
              Nível
            </div>
            <div
              style={{
                display: 'table-cell',
                background: colors.headerBg,
                borderBottom: '2px solid #ddd',
                padding: '8px 10px',
                textAlign: 'left',
                color: colors.headerText,
                fontWeight: 600,
                width: '200px',
              }}
            >
              Código
            </div>
            <div
              style={{
                display: 'table-cell',
                background: colors.headerBg,
                borderBottom: '2px solid #ddd',
                padding: '8px 10px',
                textAlign: 'left',
                color: colors.headerText,
                fontWeight: 600,
              }}
            >
              Descrição
            </div>
            <div
              style={{
                display: 'table-cell',
                background: colors.headerBg,
                borderBottom: '2px solid #ddd',
                padding: '8px 10px',
                textAlign: 'left',
                color: colors.headerText,
                fontWeight: 600,
                width: '120px',
              }}
            >
              Quantidade
            </div>
            <div
              style={{
                display: 'table-cell',
                background: colors.headerBg,
                borderBottom: '2px solid #ddd',
                padding: '8px 10px',
                textAlign: 'left',
                color: colors.headerText,
                fontWeight: 600,
                width: '60px',
              }}
            >
              UN
            </div>
            <div
              style={{
                display: 'table-cell',
                background: colors.headerBg,
                borderBottom: '2px solid #ddd',
                padding: '8px 10px',
                textAlign: 'left',
                color: colors.headerText,
                fontWeight: 600,
                width: '120px',
              }}
            >
              Processo
            </div>
          </div>
        </div>

        {/* Corpo virtualizado da tabela */}
        <div
          ref={containerRef}
          style={{ flex: 1, border: `1px solid ${colors.border}`, borderTop: 'none' }}
        >
          <List
            ref={listRef}
            height={listHeight}
            itemCount={virtualRows.length}
            itemSize={getItemSize}
            width="100%"
            style={{ fontSize: 13 }}
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
};

export default TabelaItens;
