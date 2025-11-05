import { useState, useEffect } from 'react';
import { message } from 'antd';
import { familiaService, Familia } from '../services/familia.service';
import { familiaComercialService, FamiliaComercial } from '../services/familiaComercial.service';
import { grupoDeEstoqueService, GrupoDeEstoque } from '../services/grupoDeEstoque.service';
import { handleError } from '../utils/errorHandler';

/**
 * Hook customizado para carregar dados de combos
 */
export const useCombos = () => {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [familiasComerciais, setFamiliasComerciais] = useState<FamiliaComercial[]>([]);
  const [gruposDeEstoque, setGruposDeEstoque] = useState<GrupoDeEstoque[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  useEffect(() => {
    const loadCombos = async () => {
      try {
        setLoadingCombos(true);
        const [familiasData, familiasComerciaisData, gruposDeEstoqueData] = await Promise.all([
          familiaService.getAll(),
          familiaComercialService.getAll(),
          grupoDeEstoqueService.getAll(),
        ]);
        setFamilias(familiasData);
        setFamiliasComerciais(familiasComerciaisData);
        setGruposDeEstoque(gruposDeEstoqueData);
        message.success('Filtros carregados com sucesso!');
      } catch (error) {
        handleError(error, {
          context: 'useCombos.loadCombos',
          customMessage: 'Erro ao carregar filtros. Verifique a conexão com a API.',
        });
      } finally {
        setLoadingCombos(false);
      }
    };

    loadCombos();
  }, []);

  return {
    familias,
    familiasComerciais,
    gruposDeEstoque,
    loadingCombos,
  };
};
