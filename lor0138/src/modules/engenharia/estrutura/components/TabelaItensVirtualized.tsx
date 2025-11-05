// src/modules/engenharia/estrutura/components/TabelaItensVirtualized.tsx

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { VariableSizeList } from 'react-window';
import { TreeNode, FlatNode } from '../types/estrutura.types';
import { TreeNodeOndeUsado } from '../types/ondeUsado.types';
import { flattenTree, getAncestors } from '../utils/dataProcessing';
import { HSL, hslToCss, contrastTextForHsl } from '../utils/colorUtils';
import { useTheme } from '../../../../shared/contexts/ThemeContext';
import { formatarCodigoComEstab } from '../utils/formatters';

interface TabelaItensVirtualizedProps {
  tree: TreeNode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemDrillDown?: (itemCodigo: string, itemDescricao?: string) => void;
  getLevelHsl: (level: number) => HSL;
  showQty: boolean;
  maxExpandLevel?: number;
  onMaxExpandLevelChange?: (level: number) => void;
  isOndeUsado?: boolean;
}

// Constantes para cálculo de altura
const BASE_ROW_HEIGHT = 38;
const PROCESS_DETAIL_HEIGHT = 120; // Altura aproximada de uma operação expandida

const TabelaItensVirtualized: React.FC<TabelaItensVirtualizedProps> = ({
  tree,
  selectedId,
  onSelect,
  onItemDrillDown,
  getLevelHsl,
  showQty,
  maxExpandLevel: externalMaxExpandLevel,
  onMaxExpandLevelChange,
  isOndeUsado = false,
}) => {
  const { theme } = useTheme();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedProcessIds, setExpandedProcessIds] = useState<Set<string>>(new Set());
  const [rootId, setRootId] = useState<string | null>(null);
  const [maxExpandLevel, setMaxExpandLevel] = useState<number>(1);
  const listRef = useRef<VariableSizeList>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(600); // fallback

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
    const levels = flat.filter((n) => n.level > 0).map((n) => n.level);
    return levels.length > 0 ? Math.max(...levels) : 1;
  }, [flat]);

  // Inicializar rootId
  useEffect(() => {
    if (!flat.length) {
      return;
    }
    const root = flat.find((n) => n.level === 0);
    setRootId(root?.id ?? null);
  }, [flat]);

  // Expandir automaticamente quando rootId e maxLevel estiverem prontos
  useEffect(() => {
    if (!rootId || !flat.length || maxLevel === 0) {
      return;
    }
    setMaxExpandLevel(maxLevel);
    expandToLevel(maxLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootId, maxLevel]);

  // Sincronizar com prop externa quando ela mudar
  useEffect(() => {
    if (externalMaxExpandLevel !== undefined && externalMaxExpandLevel !== maxExpandLevel) {
      setMaxExpandLevel(externalMaxExpandLevel);
      expandToLevel(externalMaxExpandLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMaxExpandLevel]);

  // Calcular altura do container dinamicamente (baseado no tamanho real do container pai)
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Usar clientHeight do container pai para pegar a altura disponível
        const height = containerRef.current.clientHeight;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    // Atualizar após montagem
    updateHeight();

    // Observar mudanças de tamanho do container
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Linhas visíveis da tabela (NÃO MOSTRA O NÍVEL 0)
  const visibleRows = useMemo(() => {
    if (!flat.length || !rootId) {
      return [];
    }
    const rows: FlatNode[] = [];
    const childrenMap = new Map<string | undefined, FlatNode[]>();

    flat.forEach((n) => {
      const arr = childrenMap.get(n.parentId) ?? [];
      arr.push(n);
      childrenMap.set(n.parentId, arr);
    });

    const walk = (parentId: string | undefined) => {
      const kids = (childrenMap.get(parentId) ?? []).sort((a, b) => a.code.localeCompare(b.code));
      for (const k of kids) {
        rows.push(k);
        if (k.hasChildren && expandedIds.has(k.id)) {
          walk(k.id);
        }
      }
    };

    walk(rootId);
    return rows;
  }, [flat, expandedIds, rootId]);

  // Export handlers

  // Handlers
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleProcessExpand = useCallback((id: string) => {
    setExpandedProcessIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandToLevel = (targetLevel: number) => {
    if (!flat.length || !rootId) {
      return;
    }

    const toExpand = new Set<string>();
    flat.forEach((node) => {
      if (node.level >= 0 && node.level < targetLevel && node.hasChildren) {
        toExpand.add(node.id);
      }
    });

    setExpandedIds(toExpand);
    setMaxExpandLevel(targetLevel);

    // Notificar o componente pai
    if (onMaxExpandLevelChange) {
      onMaxExpandLevelChange(targetLevel);
    }
  };

  const ensureRowVisible = useCallback(
    (id: string) => {
      const ancestors = getAncestors(id);
      const next = new Set(expandedIds);
      ancestors.forEach((a) => next.add(a));
      setExpandedIds(next);

      // Scroll para a linha após expandir ancestrais
      setTimeout(() => {
        const index = visibleRows.findIndex((r) => r.id === id);
        if (index >= 0 && listRef.current) {
          listRef.current.scrollToItem(index, 'center');
        }
      }, 100);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [expandedIds, visibleRows]
  );

  const selectById = useCallback(
    (id: string, skipScroll = false) => {
      onSelect(id);
      if (!skipScroll) {
        ensureRowVisible(id);
      }
    },
    [onSelect, ensureRowVisible]
  );

  // Calcular altura de cada linha
  const getItemSize = useCallback(
    (index: number): number => {
      const row = visibleRows[index];
      if (!row) {
        return BASE_ROW_HEIGHT;
      }

      // Altura base da linha
      let height = BASE_ROW_HEIGHT;

      // Se o processo está expandido, adiciona altura das operações
      if (expandedProcessIds.has(row.id) && row.hasProcess && row.process.length > 0) {
        height += row.process.length * PROCESS_DETAIL_HEIGHT;
      }

      return height;
    },
    [visibleRows, expandedProcessIds]
  );

  // Resetar cache de tamanhos quando expandedProcessIds mudar
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expandedProcessIds]);

  // Componente Row
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const r = visibleRows[index];
      const { h, s, l } = getLevelHsl(r.level);
      const rowColor = hslToCss(h, s, l);
      const textColor = contrastTextForHsl(h, s, l);
      const levelStripe = rowColor;
      const isProcessExpanded = expandedProcessIds.has(r.id);

      return (
        <div style={style}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              <tr
                onClick={() => selectById(r.id, true)}
                onDoubleClick={(e) => {
                  if (onItemDrillDown) {
                    // Destaque visual temporário
                    e.currentTarget.style.outline = '3px solid #1890ff';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.transition = 'all 0.15s ease-in-out';

                    setTimeout(() => {
                      e.currentTarget.style.outline = '';
                      e.currentTarget.style.transform = '';
                    }, 300);

                    onItemDrillDown(r.code, r.name);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  background: rowColor,
                  color: textColor,
                  outline: selectedId === r.id ? '2px solid rgba(75,156,255,0.7)' : 'none',
                  outlineOffset: -2,
                }}
              >
                <td
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '6px 10px',
                    borderLeft: `6px solid ${levelStripe}`,
                    width: '80px',
                  }}
                >
                  {r.level}
                </td>

                <td
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '6px 10px',
                    width: '250px',
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
                </td>

                <td style={{ borderBottom: `1px solid ${colors.border}`, padding: '6px 10px' }}>
                  {r.name}
                </td>

                <td
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '6px 10px',
                    textAlign: 'right',
                    width: '120px',
                  }}
                >
                  {showQty
                    ? typeof r.qtyAcumulada === 'number'
                      ? r.qtyAcumulada.toFixed(7)
                      : (r.qtyAcumulada ?? (typeof r.qty === 'number' ? r.qty.toFixed(7) : r.qty))
                    : ''}
                </td>

                <td
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '6px 10px',
                    width: '80px',
                  }}
                >
                  {r.unidadeMedida || ''}
                </td>

                <td
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '6px 10px',
                    width: '150px',
                  }}
                >
                  {r.hasProcess ? (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 10,
                        background: isProcessExpanded ? '#f3c37a' : '#ffeacc',
                        border: '1px solid #f3c37a',
                        color: '#7a4e00',
                        cursor: 'pointer',
                        fontWeight: isProcessExpanded ? 600 : 400,
                      }}
                      title={isProcessExpanded ? 'Ocultar processo' : 'Ver processo'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProcessExpand(r.id);
                      }}
                    >
                      {isProcessExpanded ? '▾' : '▸'} Processo
                    </span>
                  ) : (
                    <span style={{ opacity: 0.4, color: textColor }}>—</span>
                  )}
                </td>
              </tr>

              {/* Linhas de processo expandido */}
              {isProcessExpanded && r.hasProcess && r.process.length > 0 && (
                <>
                  {r.process.map((op, idx) => (
                    <tr
                      key={`${r.id}-process-${idx}`}
                      style={{
                        background: '#fffbf0',
                        borderLeft: `4px solid #f3c37a`,
                      }}
                    >
                      <td
                        colSpan={6}
                        style={{
                          padding: '12px 20px 12px 40px',
                          borderBottom:
                            idx === r.process.length - 1
                              ? '2px solid #f0f0f0'
                              : '1px solid #f9f3e6',
                          fontSize: 12,
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
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      );
    },
    [
      visibleRows,
      getLevelHsl,
      selectedId,
      onItemDrillDown,
      colors.border,
      showQty,
      expandedIds,
      expandedProcessIds,
      selectById,
      toggleExpand,
      toggleProcessExpand,
    ]
  );

  if (!tree) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors.emptyText }}>
        Selecione um item na aba Resultado para visualizar sua estrutura
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header da Tabela */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderBottom: 'none',
          flexShrink: 0,
          borderRadius: '8px 8px 0 0',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th
                style={{
                  background: colors.headerBg,
                  borderBottom: '1px solid #ddd',
                  padding: '8px 10px',
                  textAlign: 'left',
                  color: colors.headerText,
                  width: '80px',
                }}
              >
                Nível
              </th>
              <th
                style={{
                  background: colors.headerBg,
                  borderBottom: '1px solid #ddd',
                  padding: '8px 10px',
                  textAlign: 'left',
                  color: colors.headerText,
                  width: '250px',
                }}
              >
                Código
              </th>
              <th
                style={{
                  background: colors.headerBg,
                  borderBottom: '1px solid #ddd',
                  padding: '8px 10px',
                  textAlign: 'left',
                  color: colors.headerText,
                }}
              >
                Descrição
              </th>
              <th
                style={{
                  background: colors.headerBg,
                  borderBottom: '1px solid #ddd',
                  padding: '8px 10px',
                  textAlign: 'left',
                  color: colors.headerText,
                  width: '120px',
                }}
              >
                Quantidade
              </th>
              <th
                style={{
                  background: colors.headerBg,
                  borderBottom: '1px solid #ddd',
                  padding: '8px 10px',
                  textAlign: 'left',
                  color: colors.headerText,
                  width: '80px',
                }}
              >
                UN
              </th>
              <th
                style={{
                  background: colors.headerBg,
                  borderBottom: '1px solid #ddd',
                  padding: '8px 10px',
                  textAlign: 'left',
                  color: colors.headerText,
                  width: '150px',
                }}
              >
                Processo
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Lista Virtualizada */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          border: `1px solid ${colors.border}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          minHeight: 0,
          maxHeight: '100%',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <VariableSizeList
          ref={listRef}
          height={containerHeight}
          itemCount={visibleRows.length}
          itemSize={getItemSize}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </VariableSizeList>
      </div>

      {/* Info de performance */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: colors.emptyText,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        🚀 Virtualizado: {visibleRows.length.toLocaleString()} itens (renderizando apenas os
        visíveis)
      </div>
    </div>
  );
};

export default TabelaItensVirtualized;
