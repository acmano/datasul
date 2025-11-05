/**
 * SearchResultsDock - Dock de resultados de pesquisa com efeito macOS
 * Exibe marcadores para cada item encontrado com efeito de onda ao passar o mouse
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Tooltip } from 'antd';
import { useTheme } from '../contexts/ThemeContext';

interface SearchResultsDockProps {
  items: Array<{ itemCodigo: string }>;
  selectedKey: string | null;
  onItemClick: (itemCode: string) => void;
  visible?: boolean;
}

// Configurações do dock
const DOCK_CONFIG = {
  markerWidth: 8, // Largura base do marcador em px (retângulo vertical)
  markerHeight: 27, // Altura base do marcador em px (66% de 40px)
  maxScale: 2, // Escala máxima (2x)
  influence: 80, // Raio de influência do cursor em px
  spacing: 12, // Espaçamento FIXO entre marcadores em px
};

/**
 * Calcula a escala de um marcador baseado na distância do cursor
 */
function calculateScale(distance: number): number {
  const { maxScale, influence } = DOCK_CONFIG;

  if (distance > influence) {
    return 1;
  }

  // Função de falloff exponencial para efeito de onda suave
  const normalizedDistance = distance / influence;
  const scale = 1 + (maxScale - 1) * Math.pow(1 - normalizedDistance, 2);

  return scale;
}

const SearchResultsDock: React.FC<SearchResultsDockProps> = ({
  items,
  selectedKey,
  onItemClick,
  visible = true,
}) => {
  const { theme } = useTheme();
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Handler para movimento do mouse
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dockRef.current) {
      return;
    }

    const rect = dockRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setMouseX(x);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setHoveredIndex(null);
  }, []);

  // Calcular posições e escalas dos marcadores
  const markerData = useMemo(() => {
    const { markerWidth, spacing } = DOCK_CONFIG;
    const paddingLeft = 20; // Padding do container

    return items.map((item, index) => {
      let scale = 1;
      // Posição X com espaçamento FIXO (não afetado pela escala)
      const x = index * (markerWidth + spacing);

      if (mouseX !== null) {
        // Calcular centro do marcador (considerando o padding do container)
        const markerCenter = x + markerWidth / 2 + paddingLeft;
        const distance = Math.abs(mouseX - markerCenter);
        scale = calculateScale(distance);
      }

      return {
        item,
        index,
        scale,
        x,
        isSelected: item.itemCodigo === selectedKey,
      };
    });
  }, [items, mouseX, selectedKey]);

  // Calcular largura total do dock (espaçamento fixo)
  const dockWidth = useMemo(() => {
    const { markerWidth, spacing } = DOCK_CONFIG;

    if (items.length === 0) {
      return 0;
    }

    // Largura = (n itens × largura) + ((n-1) × espaçamento)
    return items.length * markerWidth + (items.length - 1) * spacing;
  }, [items.length]);

  if (!visible || items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          theme === 'dark'
            ? 'linear-gradient(to top, rgba(0, 12, 23, 0.95), rgba(0, 12, 23, 0.7), transparent)'
            : 'linear-gradient(to top, rgba(240, 242, 245, 0.95), rgba(240, 242, 245, 0.7), transparent)',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: dockWidth + 40,
          padding: '0 20px',
          pointerEvents: 'auto',
        }}
      >
        {markerData.map((data) => {
          const { item, index, scale, isSelected } = data;
          const { markerWidth, markerHeight, spacing } = DOCK_CONFIG;

          // Cores baseadas no tema e estado
          let backgroundColor: string;
          let borderColor: string;

          if (isSelected) {
            backgroundColor = theme === 'dark' ? '#1890ff' : '#1890ff';
            borderColor = theme === 'dark' ? '#40a9ff' : '#096dd9';
          } else {
            backgroundColor = theme === 'dark' ? '#434343' : '#d9d9d9';
            borderColor = theme === 'dark' ? '#595959' : '#bfbfbf';
          }

          return (
            <Tooltip
              key={item.itemCodigo}
              title={item.itemCodigo}
              placement="top"
              open={hoveredIndex === index}
            >
              <div
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onItemClick(item.itemCodigo)}
                style={{
                  width: markerWidth,
                  height: markerHeight,
                  borderRadius: 4,
                  backgroundColor,
                  border: `2px solid ${borderColor}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  transform: `scaleY(${scale})`,
                  transformOrigin: 'center bottom',
                  marginRight: index < items.length - 1 ? spacing : 0,
                  boxShadow: isSelected
                    ? '0 4px 8px rgba(24, 144, 255, 0.4)'
                    : '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResultsDock;
