// src/modules/pcp/base/Main.tsx

import React from 'react';
import Planejamento from './planejamento/components/Main';

interface PCPBaseProps {
  selectedItem?: any;
  preloadedData?: any;
}

const PCPBase: React.FC<PCPBaseProps> = ({ selectedItem, preloadedData }) => {
  return <Planejamento selectedItem={selectedItem} preloadedData={preloadedData} />;
};

export default PCPBase;
