import { itemInformacoesGeraisService } from '../informacoesGerais/services/itemInformacoesGerais.service';
import { dimensoesService } from '../dimensoes/services/dimensoes.service';
import { planejamentoService } from '../planejamento/services/planejamento.service';
import { manufaturaService } from '../manufatura/services/manufatura.service';
import { fiscalService } from '../fiscal/services/fiscal.service';
import { ItemSearchResultItem } from '../../search/types/search.types';

/**
 * Interface for complete item data including all tabs
 */
export interface CompleteItemData {
  item: ItemSearchResultItem;
  informacoesGerais: any | null;
  dimensoes: any | null;
  planejamento: any | null;
  manufatura: any | null;
  fiscal: any | null;
  suprimentos: any | null;
}

/**
 * Service for fetching complete item data for catalog export
 */
export class CatalogExportService {
  /**
   * Fetch complete data for a single item from all tabs
   * Uses Promise.allSettled to ensure partial success even if some APIs fail
   *
   * @param itemCodigo - The item code to fetch data for
   * @returns Complete item data from all tabs (null for failed requests)
   */
  static async fetchCompleteItemData(itemCodigo: string): Promise<Omit<CompleteItemData, 'item'>> {
    // Fetch all data in parallel using Promise.allSettled
    // This ensures that if one API fails, others can still succeed
    const results = await Promise.allSettled([
      itemInformacoesGeraisService.getByCode(itemCodigo),
      dimensoesService.getByCode(itemCodigo),
      planejamentoService.getByCode(itemCodigo),
      manufaturaService.getByCode(itemCodigo),
      fiscalService.getByCode(itemCodigo),
    ]);

    return {
      informacoesGerais: results[0].status === 'fulfilled' ? results[0].value : null,
      dimensoes: results[1].status === 'fulfilled' ? results[1].value : null,
      planejamento: results[2].status === 'fulfilled' ? results[2].value : null,
      manufatura: results[3].status === 'fulfilled' ? results[3].value : null,
      fiscal: results[4].status === 'fulfilled' ? results[4].value : null,
      suprimentos: null, // Not implemented yet
    };
  }

  /**
   * Fetch complete data for all items with progress callback
   * Processes items sequentially to avoid overwhelming the server
   *
   * @param items - Array of items to fetch data for
   * @param onProgress - Optional callback to track progress (current, total)
   * @returns Array of complete item data
   */
  static async fetchAllItemsData(
    items: ItemSearchResultItem[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CompleteItemData[]> {
    const total = items.length;
    const completeData: CompleteItemData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Notify progress
      if (onProgress) {
        onProgress(i + 1, total);
      }

      try {
        const data = await this.fetchCompleteItemData(item.itemCodigo);
        completeData.push({
          item,
          ...data,
        });
      } catch (error) {
        console.error(`Error fetching data for item ${item.itemCodigo}:`, error);
        // Add item with null data to maintain list integrity
        completeData.push({
          item,
          informacoesGerais: null,
          dimensoes: null,
          planejamento: null,
          manufatura: null,
          fiscal: null,
          suprimentos: null,
        });
      }
    }

    return completeData;
  }
}

// Export singleton instance for convenience
export const catalogExportService = CatalogExportService;
