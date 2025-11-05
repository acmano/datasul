/**
 * HelpModal - Modal de Ajuda Sensível ao Contexto
 * Modal arrastável com índice lateral e conteúdo de ajuda
 */

import React, { useState, useEffect } from 'react';
import { Modal, Menu, Button, Typography, Divider, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { HelpModalProps } from '../types/help.types';
import { helpIndex, helpTopics, getTopicKeyByContext } from '../help';
import './HelpModal.css';

const { Title, Text } = Typography;

/**
 * Converte o índice hierárquico para o formato do Menu do Ant Design
 */
function convertToMenuItems(items: typeof helpIndex): MenuProps['items'] {
  return items.map((item) => {
    const menuItem: any = {
      key: item.key,
      icon: item.icon,
      label: item.title,
    };

    if (item.children) {
      menuItem.children = convertToMenuItems(item.children);
    }

    return menuItem;
  });
}

/**
 * Componente HelpModal
 * Modal arrastável com sistema de ajuda contextual
 */
export const HelpModal: React.FC<HelpModalProps> = ({
  visible,
  onClose,
  initialContext,
  initialTopicKey,
}) => {
  // Estado do tópico selecionado
  const [selectedTopicKey, setSelectedTopicKey] = useState<string>('sobre');

  // Estado para controlar quais submenus estão abertos
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  /**
   * Efeito: Define o tópico inicial baseado no contexto ou topicKey fornecido
   */
  useEffect(() => {
    if (visible) {
      let topicKey = 'sobre';

      // Se foi passado um tópico específico (menu "Ajuda"), usa ele
      if (initialTopicKey) {
        topicKey = initialTopicKey;
      }
      // Se foi passado um contexto (F1), determina o tópico pelo contexto
      else if (initialContext) {
        topicKey = getTopicKeyByContext(initialContext);
      }

      setSelectedTopicKey(topicKey);

      // Abre os submenus necessários para mostrar o item selecionado
      expandMenuToShowTopic(topicKey);
    }
  }, [visible, initialContext, initialTopicKey]);

  /**
   * Expande os submenus necessários para exibir um tópico específico
   */
  const expandMenuToShowTopic = (topicKey: string) => {
    const keysToOpen: string[] = [];

    // Busca recursiva para encontrar os pais do tópico
    const findParents = (
      items: typeof helpIndex,
      targetKey: string,
      parents: string[] = []
    ): boolean => {
      for (const item of items) {
        if (item.key === targetKey) {
          keysToOpen.push(...parents);
          return true;
        }

        if (item.children) {
          const found = findParents(item.children, targetKey, [...parents, item.key]);
          if (found) {
            return true;
          }
        }
      }
      return false;
    };

    findParents(helpIndex, topicKey);
    setOpenKeys(keysToOpen);
  };

  /**
   * Handler: Mudança de seleção no menu
   */
  const handleMenuSelect: MenuProps['onSelect'] = ({ key }) => {
    setSelectedTopicKey(key);
  };

  /**
   * Handler: Controle de submenus abertos/fechados
   */
  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys as string[]);
  };

  /**
   * Obtém o conteúdo do tópico atual
   */
  const currentTopic = helpTopics[selectedTopicKey];

  return (
    <Modal
      title={
        <Space>
          <span>Sistema de Ajuda - LOR0138</span>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
            (Pressione F1 para ajuda contextual)
          </Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button type="primary" icon={<CloseOutlined />} onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
      width="90%"
      style={{ top: 20 }}
      styles={{
        body: { height: 'calc(90vh - 110px)', padding: 0 },
      }}
      modalRender={(modal) => <div className="help-modal-draggable">{modal}</div>}
      maskClosable={false}
      keyboard={true} // Permite fechar com ESC
      destroyOnHidden={false}
      className="help-modal"
    >
      <div className="help-modal-content">
        {/* Menu Lateral - Índice */}
        <div className="help-modal-sidebar">
          <div className="help-modal-sidebar-header">
            <Title level={5} style={{ margin: 0 }}>
              Índice
            </Title>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div className="help-modal-menu-container">
            <Menu
              mode="inline"
              selectedKeys={[selectedTopicKey]}
              openKeys={openKeys}
              onSelect={handleMenuSelect}
              onOpenChange={handleOpenChange}
              items={convertToMenuItems(helpIndex)}
              style={{ border: 'none', height: '100%' }}
            />
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="help-modal-main">
          <div className="help-modal-topic-header">
            <Title level={3} style={{ margin: 0 }}>
              {currentTopic?.title || 'Tópico não encontrado'}
            </Title>
          </div>
          <Divider style={{ margin: '16px 0' }} />
          <div className="help-modal-topic-content">
            {currentTopic ? (
              <div className="help-topic-body">{currentTopic.content}</div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <Text type="secondary">Conteúdo não disponível para este tópico.</Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;
