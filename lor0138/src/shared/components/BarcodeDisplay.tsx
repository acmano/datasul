import React, { useEffect, useRef, memo } from 'react';

interface BarcodeDisplayProps {
  value: string;
  format: 'EAN13' | 'ITF14';
}

/**
 * Componente para exibição de código de barras
 * Memoizado para evitar re-renders desnecessários
 */
const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({ value, format }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const loadJsBarcode = () => {
      if (scriptLoaded.current) {
        generateBarcode();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js';
      script.async = true;
      script.onload = () => {
        scriptLoaded.current = true;
        generateBarcode();
      };
      document.body.appendChild(script);
    };

    const generateBarcode = () => {
      if (!canvasRef.current || !value || value === '-') {
        return;
      }

      try {
        // @ts-ignore
        if (typeof JsBarcode !== 'undefined') {
          // @ts-ignore
          JsBarcode(canvasRef.current, value, {
            format: format,
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 10,
          });
        }
      } catch (error) {
        console.error('Erro ao gerar código de barras:', error);
      }
    };

    loadJsBarcode();
  }, [value, format]);

  if (!value || value === '-') {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          border: '1px dashed #d9d9d9',
          borderRadius: 4,
        }}
      >
        <span style={{ color: '#999' }}>Não disponível</span>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
    </div>
  );
};

export default memo(BarcodeDisplay);
