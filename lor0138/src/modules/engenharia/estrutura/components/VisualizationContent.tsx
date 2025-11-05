// src/modules/engenharia/estrutura/components/VisualizationContent.tsx

import React from 'react';
import { Skeleton } from 'antd';
import TabelaItensVirtualized from './TabelaItensVirtualized';
import Sankey from './Sankey';
import Arvore from './Arvore';
import Treemap from './Treemap';
import Grafo from './Grafo';
import ToolbarControls from './ToolbarControls';
import { TreeNode } from '../types/estrutura.types';
import { HSL } from '../utils/colorUtils';
import { VisualizationType } from '../types/estrutura.types';

interface VisualizationContentProps {
  activeVisualizacao: VisualizationType;
  loadingEstrutura: boolean;
  tree: TreeNode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemDrillDown: (itemCodigo: string, itemDescricao?: string) => void;
  getLevelHsl: (level: number) => HSL;
  getLevelCss: (level: number) => string;
  getLevelText: (level: number) => string;
  showQty: boolean;
  onShowQtyChange: (checked: boolean) => void;
  baseHex: string;
  onBaseHexChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  maxExpandLevel?: number;
  onMaxExpandLevelChange?: (level: number) => void;
  theme: 'light' | 'dark';
  isOndeUsado?: boolean; // Inverte fluxo para Onde Usado
}

/**
 * Área de conteúdo das visualizações
 */
const VisualizationContent: React.FC<VisualizationContentProps> = ({
  activeVisualizacao,
  loadingEstrutura,
  tree,
  selectedId,
  onSelect,
  onItemDrillDown,
  getLevelHsl,
  getLevelCss,
  getLevelText,
  showQty,
  onShowQtyChange,
  baseHex,
  onBaseHexChange,
  isOndeUsado = false,
  bgColor,
  onBgColorChange,
  maxExpandLevel,
  onMaxExpandLevelChange,
  theme,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar com controles - apenas para visualizações que não sejam tabela, sankey, arvore, treemap nem grafo */}
      {activeVisualizacao !== 'tabela' &&
        activeVisualizacao !== 'sankey' &&
        activeVisualizacao !== 'arvore' &&
        activeVisualizacao !== 'treemap' &&
        activeVisualizacao !== 'grafo' && (
          <ToolbarControls
            showQty={showQty}
            onShowQtyChange={onShowQtyChange}
            baseHex={baseHex}
            onBaseHexChange={onBaseHexChange}
            bgColor={bgColor}
            onBgColorChange={onBgColorChange}
            theme={theme}
          />
        )}

      {/* Visualizações */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Skeleton durante o primeiro carregamento */}
        {loadingEstrutura && !tree ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 24 }} />
            <Skeleton.Input active style={{ width: '100%', marginBottom: 16 }} />
            <Skeleton.Input active style={{ width: '100%', marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <>
            {activeVisualizacao === 'tabela' && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: '100%',
                  overflow: 'hidden',
                  backgroundColor: bgColor,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <TabelaItensVirtualized
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onItemDrillDown={onItemDrillDown}
                  getLevelHsl={getLevelHsl}
                  showQty={showQty}
                  maxExpandLevel={maxExpandLevel}
                  onMaxExpandLevelChange={onMaxExpandLevelChange}
                  isOndeUsado={isOndeUsado}
                />
              </div>
            )}
            {activeVisualizacao === 'sankey' && (
              <div style={{ flex: 1, minHeight: 0, backgroundColor: bgColor }}>
                <Sankey
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onItemDrillDown={onItemDrillDown}
                  getLevelCss={getLevelCss}
                  getLevelText={getLevelText}
                  showQty={showQty}
                  onShowQtyChange={onShowQtyChange}
                  baseHex={baseHex}
                  onBaseHexChange={onBaseHexChange}
                  bgColor={bgColor}
                  onBgColorChange={onBgColorChange}
                  reverse={isOndeUsado}
                />
              </div>
            )}
            {activeVisualizacao === 'arvore' && (
              <div style={{ flex: 1, minHeight: 0, backgroundColor: bgColor }}>
                <Arvore
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onItemDrillDown={onItemDrillDown}
                  getLevelCss={getLevelCss}
                  showQty={showQty}
                  onShowQtyChange={onShowQtyChange}
                  baseHex={baseHex}
                  onBaseHexChange={onBaseHexChange}
                  bgColor={bgColor}
                  reverse={isOndeUsado}
                  onBgColorChange={onBgColorChange}
                />
              </div>
            )}
            {activeVisualizacao === 'treemap' && (
              <div style={{ flex: 1, minHeight: 0, backgroundColor: bgColor }}>
                <Treemap
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onItemDrillDown={onItemDrillDown}
                  getLevelCss={getLevelCss}
                  showQty={showQty}
                  onShowQtyChange={onShowQtyChange}
                  baseHex={baseHex}
                  onBaseHexChange={onBaseHexChange}
                  bgColor={bgColor}
                  onBgColorChange={onBgColorChange}
                  isOndeUsado={isOndeUsado}
                />
              </div>
            )}
            {activeVisualizacao === 'grafo' && (
              <div style={{ flex: 1, minHeight: 0, backgroundColor: bgColor }}>
                <Grafo
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onItemDrillDown={onItemDrillDown}
                  getLevelCss={getLevelCss}
                  showQty={showQty}
                  onShowQtyChange={onShowQtyChange}
                  bgColor={bgColor}
                  isOndeUsado={isOndeUsado}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VisualizationContent;
