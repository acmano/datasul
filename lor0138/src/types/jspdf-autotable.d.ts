// Type declarations for jspdf-autotable
declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  export interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      overflow?: string;
      lineWidth?: number;
      lineColor?: number | number[];
      fillColor?: number | number[];
      textColor?: number | number[];
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    headStyles?: {
      fillColor?: number | number[];
      textColor?: number | number[];
      fontStyle?: string;
      halign?: 'left' | 'center' | 'right';
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number | 'auto' | 'wrap';
        halign?: 'left' | 'center' | 'right';
      };
    };
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    theme?: 'striped' | 'grid' | 'plain';
    didParseCell?: (data: any) => void;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
