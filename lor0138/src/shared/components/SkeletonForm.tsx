/**
 * SkeletonForm - Componente para exibir skeleton enquanto dados carregam
 */

import React from 'react';
import { Skeleton, Row, Col } from 'antd';

interface SkeletonFormProps {
  rows?: number;
  columns?: number;
}

const SkeletonForm: React.FC<SkeletonFormProps> = ({ rows = 4, columns = 2 }) => {
  return (
    <div style={{ padding: 24 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Row gutter={[16, 16]} key={rowIndex} style={{ marginBottom: 24 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Col span={24 / columns} key={colIndex}>
              <Skeleton.Input active block style={{ marginBottom: 8 }} />
              <Skeleton.Input active block />
            </Col>
          ))}
        </Row>
      ))}
    </div>
  );
};

export default SkeletonForm;
