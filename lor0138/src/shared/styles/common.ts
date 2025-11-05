import React from 'react';
import { spacing } from '../theme/tokens';

/**
 * Estilos reutilizáveis comuns
 */

export const flexCenter: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const flexBetween: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const flexColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

export const flexStart: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
};

export const flexEnd: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
};

export const fullWidth: React.CSSProperties = {
  width: '100%',
};

export const fullHeight: React.CSSProperties = {
  height: '100%',
};

export const textCenter: React.CSSProperties = {
  textAlign: 'center',
};

export const textEllipsis: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const createPadding = (value: keyof typeof spacing): React.CSSProperties => ({
  padding: spacing[value],
});

export const createMargin = (value: keyof typeof spacing): React.CSSProperties => ({
  margin: spacing[value],
});

export const scrollable: React.CSSProperties = {
  overflowY: 'auto',
  overflowX: 'hidden',
};

export const card: React.CSSProperties = {
  borderRadius: 4,
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  padding: spacing.md,
  backgroundColor: '#fff',
};
