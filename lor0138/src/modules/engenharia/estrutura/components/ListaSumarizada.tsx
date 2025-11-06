// src/modules/engenharia/estrutura/components/ListaSumarizada.tsx

import React from 'react';
import TabelaItensVirtualized from './TabelaItensVirtualized';
import type { ComponenteSumarizado } from '../types/estrutura.types';
import { HSL } from '../utils/colorUtils';

interface Props {
  dados: ComponenteSumarizado[] | null;
  getLevelHsl: (level: number) => HSL;
  showQty: boolean;
  searchTerm?: string;
}

/**
 * Componente para exibir lista sumarizada de materiais
 * (modo de apresentação "lista" da estrutura de consumo)
 *
 * Usa TabelaItensVirtualized em modo flat para manter consistência visual
 */
const ListaSumarizada: React.FC<Props> = ({ dados, getLevelHsl, showQty, searchTerm = '' }) => {
  return (
    <TabelaItensVirtualized
      tree={null}
      selectedId={null}
      onSelect={() => {}}
      getLevelHsl={getLevelHsl}
      showQty={showQty}
      isFlatMode={true}
      flatData={dados || []}
      searchTerm={searchTerm}
    />
  );
};

export default ListaSumarizada;
