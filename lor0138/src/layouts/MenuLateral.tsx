// src/layouts/MenuLateral.tsx

import React, { useEffect, useState } from 'react';
import { Menu } from 'antd';
import {
  DatabaseOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  CalculatorOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

interface MenuLateralProps {
  selectedKey: string;
  onSelect: (key: string) => void;
  theme: 'light' | 'dark';
}

// Mapeamento de imagens por opção do menu
const menuImages: Record<string, string> = {
  '1': '/images/menu/dados-mestres.png',
  '2': '/images/menu/engenharias.png',
  '3': '/images/menu/pcp.png',
  '4': '/images/menu/manufatura.png',
  '5': '/images/menu/suprimentos.png',
  '6': '/images/menu/fiscal.png',
  '0': '/images/menu/ajuda.png',
};

const MenuLateral: React.FC<MenuLateralProps> = ({ selectedKey, onSelect, theme }) => {
  const [focusedKey, setFocusedKey] = useState(selectedKey);

  const menuItems = [
    {
      key: '1',
      icon: <DatabaseOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          Dados Mestres
          <span className="shortcut-hint">Ctrl+1</span>
        </span>
      ),
    },
    {
      key: '2',
      icon: <ApartmentOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          Engenharias
          <span className="shortcut-hint">Ctrl+2</span>
        </span>
      ),
    },
    {
      key: '3',
      icon: <ClockCircleOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          PCP
          <span className="shortcut-hint">Ctrl+3</span>
        </span>
      ),
    },
    {
      key: '4',
      icon: <ToolOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          Manufatura
          <span className="shortcut-hint">Ctrl+4</span>
        </span>
      ),
    },
    {
      key: '5',
      icon: <ShoppingCartOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          Suprimentos
          <span className="shortcut-hint">Ctrl+5</span>
        </span>
      ),
    },
    {
      key: '6',
      icon: <CalculatorOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          Fiscal
          <span className="shortcut-hint">Ctrl+6</span>
        </span>
      ),
    },
    {
      key: '0',
      icon: <QuestionCircleOutlined />,
      label: (
        <span className="menu-item-with-shortcut">
          Ajuda
          <span className="shortcut-hint">Ctrl+0</span>
        </span>
      ),
    },
  ];

  // Sincronizar focusedKey com selectedKey
  useEffect(() => {
    setFocusedKey(selectedKey);
  }, [selectedKey]);

  // Listener para Enter ativar item focado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInMenu = activeElement?.closest('.ant-menu');

      if (!isInMenu) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(focusedKey);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentNum = parseInt(focusedKey);
        const nextKey = currentNum < 9 ? (currentNum + 1).toString() : '1';
        setFocusedKey(nextKey);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentNum = parseInt(focusedKey);
        const prevKey = currentNum > 1 ? (currentNum - 1).toString() : '9';
        setFocusedKey(prevKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedKey, onSelect]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme === 'dark' ? '#001529' : '#fff',
      }}
    >
      <style>{`
        .menu-item-with-shortcut {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .shortcut-hint {
          font-size: 11px;
          opacity: 0;
          transition: opacity 0.2s;
          margin-left: 8px;
        }

        .ant-menu-item:hover .shortcut-hint,
        .ant-menu-item-selected .shortcut-hint {
          opacity: 0.6;
        }

        .menu-image-area {
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'};
          background: ${theme === 'dark' ? '#141414' : '#fafafa'};
          padding: 16px;
          transition: all 0.3s ease;
        }

        .menu-image-area img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        /* Garantir que todo o menu respeite o tema durante scroll */
        .ant-layout-sider {
          background: ${theme === 'dark' ? '#001529' : '#fff'} !important;
        }

        .ant-menu-inline {
          background: ${theme === 'dark' ? '#001529' : '#fff'} !important;
        }

        .ant-menu-inline .ant-menu-item {
          margin: 0 !important;
        }
      `}</style>

      {/* Área da imagem dinâmica */}
      <div className="menu-image-area" style={{ height: '200px', flexShrink: 0 }}>
        <img
          src={menuImages[selectedKey] || menuImages['1']}
          alt={`Imagem ${selectedKey}`}
          onError={(e) => {
            // Fallback caso a imagem não carregue
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Menu de navegação */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          setFocusedKey(key);
          onSelect(key);
        }}
        items={menuItems}
        style={{
          flex: 1,
          borderRight: 0,
          overflow: 'auto',
          background: theme === 'dark' ? '#001529' : '#fff',
        }}
        theme={theme}
      />
    </div>
  );
};

export default MenuLateral;
