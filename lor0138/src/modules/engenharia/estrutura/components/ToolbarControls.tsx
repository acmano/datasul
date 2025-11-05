// src/modules/engenharia/estrutura/components/ToolbarControls.tsx

import React from 'react';
import { Checkbox } from 'antd';

interface ToolbarControlsProps {
  showQty: boolean;
  onShowQtyChange: (checked: boolean) => void;
  baseHex: string;
  onBaseHexChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  theme: 'light' | 'dark';
}

/**
 * Barra de controles para visualizações (cores e opções)
 */
const ToolbarControls: React.FC<ToolbarControlsProps> = ({
  showQty,
  onShowQtyChange,
  baseHex,
  onBaseHexChange,
  bgColor,
  onBgColorChange,
  theme,
}) => {
  const borderColor = theme === 'dark' ? '#303030' : '#f0f0f0';
  const bgColorToolbar = theme === 'dark' ? '#141414' : '#fafafa';

  return (
    <div
      style={{
        padding: 12,
        borderBottom: `1px solid ${borderColor}`,
        background: bgColorToolbar,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Checkbox checked={showQty} onChange={(e) => onShowQtyChange(e.target.checked)}>
        Mostrar quantidades
      </Checkbox>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Cor base:</span>
        <input
          type="color"
          value={baseHex}
          onChange={(e) => onBaseHexChange(e.target.value)}
          style={{
            width: 28,
            height: 28,
            padding: 0,
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
          title="Escolher cor base do degradê"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Cor de fundo:</span>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => onBgColorChange(e.target.value)}
          style={{
            width: 28,
            height: 28,
            padding: 0,
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
          title="Escolher cor de fundo"
        />
      </div>
    </div>
  );
};

export default ToolbarControls;
