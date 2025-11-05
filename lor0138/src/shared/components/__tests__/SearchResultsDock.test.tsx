/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent } from '../../../test-utils/render';
import SearchResultsDock from '../SearchResultsDock';

const mockItems = [
  { itemCodigo: 'ITEM001' },
  { itemCodigo: 'ITEM002' },
  { itemCodigo: 'ITEM003' },
  { itemCodigo: 'ITEM004' },
  { itemCodigo: 'ITEM005' },
];

describe('SearchResultsDock', () => {
  const mockOnItemClick = jest.fn();

  beforeEach(() => {
    mockOnItemClick.mockClear();
  });

  describe('Visibility', () => {
    it('should not render when visible is false', () => {
      const { container } = render(
        <SearchResultsDock
          items={mockItems}
          selectedKey={null}
          onItemClick={mockOnItemClick}
          visible={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when items array is empty', () => {
      const { container } = render(
        <SearchResultsDock
          items={[]}
          selectedKey={null}
          onItemClick={mockOnItemClick}
          visible={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when visible is true and has items', () => {
      const { container } = render(
        <SearchResultsDock
          items={mockItems}
          selectedKey={null}
          onItemClick={mockOnItemClick}
          visible={true}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render by default (visible defaults to true)', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Item Markers', () => {
    it('should render correct number of markers', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      // Each item should have a marker (a div with specific styling)
      const markers = container.querySelectorAll('[style*="cursor: pointer"]');
      expect(markers).toHaveLength(5);
    });

    it('should handle single item', () => {
      const singleItem = [{ itemCodigo: 'SINGLE' }];

      const { container } = render(
        <SearchResultsDock items={singleItem} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');
      expect(markers).toHaveLength(1);
    });

    it('should handle many items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        itemCodigo: `ITEM${String(i + 1).padStart(3, '0')}`,
      }));

      const { container } = render(
        <SearchResultsDock items={manyItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');
      expect(markers).toHaveLength(20);
    });
  });

  describe('Item Selection', () => {
    it('should highlight selected item', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey="ITEM002" onItemClick={mockOnItemClick} />
      );

      // Selected item should have blue background (check for the blue color in style)
      const markers = container.querySelectorAll('[style*="cursor: pointer"]');
      const selectedMarker = Array.from(markers).find((marker) =>
        (marker as HTMLElement).style.backgroundColor.includes('rgb(24, 144, 255)')
      );

      expect(selectedMarker).toBeInTheDocument();
    });

    it('should not highlight any item when selectedKey is null', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      // No marker should have blue background
      const markers = container.querySelectorAll('[style*="cursor: pointer"]');
      const blueMarkers = Array.from(markers).filter((marker) =>
        (marker as HTMLElement).style.backgroundColor.includes('rgb(24, 144, 255)')
      );

      expect(blueMarkers).toHaveLength(0);
    });
  });

  describe('Click Interaction', () => {
    it('should call onItemClick when marker is clicked', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');
      fireEvent.click(markers[0]);

      expect(mockOnItemClick).toHaveBeenCalledWith('ITEM001');
    });

    it('should call onItemClick with correct item code', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');

      fireEvent.click(markers[2]); // Click third item
      expect(mockOnItemClick).toHaveBeenCalledWith('ITEM003');

      fireEvent.click(markers[4]); // Click fifth item
      expect(mockOnItemClick).toHaveBeenCalledWith('ITEM005');
    });

    it('should handle multiple clicks', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');

      fireEvent.click(markers[0]);
      fireEvent.click(markers[1]);
      fireEvent.click(markers[2]);

      expect(mockOnItemClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Mouse Hover Effects', () => {
    it('should handle mouse enter on marker', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');

      // Should not throw error
      expect(() => {
        fireEvent.mouseEnter(markers[0]);
      }).not.toThrow();
    });

    it('should handle mouse leave on marker', () => {
      const { container } = render(
        <SearchResultsDock items={mockItems} selectedKey={null} onItemClick={mockOnItemClick} />
      );

      const markers = container.querySelectorAll('[style*="cursor: pointer"]');

      // Should not throw error
      expect(() => {
        fireEvent.mouseEnter(markers[0]);
        fireEvent.mouseLeave(markers[0]);
      }).not.toThrow();
    });
  });
});
