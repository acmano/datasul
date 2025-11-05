// src/modules/engenharia/estrutura/components/MenuLateralEstrutura.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { Menu } from 'antd';
import {
  TableOutlined,
  PartitionOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';

interface MenuLateralEstruturaProps {
  selectedKey: string;
  onSelect: (key: string) => void;
  theme: 'light' | 'dark';
}

const MenuLateralEstrutura: React.FC<MenuLateralEstruturaProps> = ({
  selectedKey,
  onSelect,
  theme,
}) => {
  const [focusedKey, setFocusedKey] = useState(selectedKey);

  const menuItems = useMemo(
    () => [
      {
        key: 'tabela',
        icon: <TableOutlined />,
        label: (
          <span className="menu-item-with-shortcut">
            Estrutura
            <span className="shortcut-hint">Ctrl+Alt+1</span>
          </span>
        ),
      },
      {
        key: 'sankey',
        icon: <PartitionOutlined />,
        label: (
          <span className="menu-item-with-shortcut">
            Sankey
            <span className="shortcut-hint">Ctrl+Alt+2</span>
          </span>
        ),
      },
      {
        key: 'arvore',
        icon: <ApartmentOutlined />,
        label: (
          <span className="menu-item-with-shortcut">
            Árvore
            <span className="shortcut-hint">Ctrl+Alt+3</span>
          </span>
        ),
      },
      {
        key: 'treemap',
        icon: <AppstoreOutlined />,
        label: (
          <span className="menu-item-with-shortcut">
            Treemap
            <span className="shortcut-hint">Ctrl+Alt+4</span>
          </span>
        ),
      },
      {
        key: 'grafo',
        icon: <ShareAltOutlined />,
        label: (
          <span className="menu-item-with-shortcut">
            Grafo
            <span className="shortcut-hint">Ctrl+Alt+5</span>
          </span>
        ),
      },
    ],
    []
  );

  // Sincronizar focusedKey com selectedKey
  useEffect(() => {
    setFocusedKey(selectedKey);
  }, [selectedKey]);

  // Listener para Enter ativar item focado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInMenu = activeElement?.closest('.menu-lateral-estrutura');

      if (!isInMenu) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(focusedKey);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const keys = menuItems.map((item) => item.key);
        const currentIndex = keys.indexOf(focusedKey);
        const nextIndex = (currentIndex + 1) % keys.length;
        setFocusedKey(keys[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const keys = menuItems.map((item) => item.key);
        const currentIndex = keys.indexOf(focusedKey);
        const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
        setFocusedKey(keys[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedKey, onSelect, menuItems]);

  return (
    <div
      className="menu-lateral-estrutura"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme === 'dark' ? '#001529' : '#fff',
        borderRight: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
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
          font-size: 10px;
          opacity: 0;
          transition: opacity 0.2s;
          margin-left: 8px;
        }

        .ant-menu-item:hover .shortcut-hint,
        .ant-menu-item-selected .shortcut-hint {
          opacity: 0.6;
        }

        .menu-lateral-estrutura .ant-menu {
          border-right: none;
        }
      `}</style>

      {/* Título do menu */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          background: theme === 'dark' ? '#141414' : '#fafafa',
        }}
      >
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Visualizações</h4>
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
        }}
        theme={theme}
      />
    </div>
  );
};

export default MenuLateralEstrutura;
