# 1. Copiar o orquestrador correto
cp backup_20251012_173638/item/dadosCadastrais/informacoesGerais/components/Main.tsx \
   src/modules/item/dadosCadastrais/components/Main.tsx

# 2. Atualizar imports para nova estrutura
cd src/modules/item/dadosCadastrais/components/

# Remover import de Resultado (não faz parte de dadosCadastrais)
sed -i "/import Resultado from/d" Main.tsx

# Atualizar imports das abas
sed -i "s|from './tabs/Base'|from '../informacoesGerais/components/Main'|g" Main.tsx
sed -i "s|from './tabs/Dimensoes'|from '../dimensoes/components/Main'|g" Main.tsx
sed -i "s|from './tabs/Planejamento'|from '../planejamento/components/Main'|g" Main.tsx
sed -i "s|from './tabs/Manufatura'|from '../manufatura/components/Main'|g" Main.tsx
sed -i "s|from './tabs/Fiscal'|from '../fiscal/components/Main'|g" Main.tsx
sed -i "s|from './tabs/Suprimentos'|from '../suprimentos/components/Main'|g" Main.tsx

# Atualizar imports de search e shared
sed -i "s|from '../../../search/|from '../../search/|g" Main.tsx
sed -i "s|from '../../../../../shared/|from '../../../../shared/|g" Main.tsx

# Renomear componente Base para InformacoesGerais
sed -i "s|import Base from|import InformacoesGerais from|g" Main.tsx
sed -i "s|<Base |<InformacoesGerais |g" Main.tsx

cd ~/projetos/datasul/lor0138