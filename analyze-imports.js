#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SRC_DIR = './src';
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Coletar todos arquivos .ts
function getAllTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Extrair imports de um arquivo
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Regex para capturar imports
  const importRegex = /import\s+(?:{[^}]*}|[^from]*)\s+from\s+['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Apenas imports relativos
    if (importPath.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(filePath), importPath);
      imports.push({
        raw: importPath,
        resolved: resolvedPath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }
  
  return imports;
}

// Analisar dependências
function analyzeDependencies() {
  console.log(`${COLORS.cyan}${COLORS.bright}=== Análise de Imports ===${COLORS.reset}\n`);
  
  const files = getAllTsFiles(SRC_DIR);
  const dependencies = new Map();
  
  console.log(`${COLORS.blue}Escaneando ${files.length} arquivos...${COLORS.reset}\n`);
  
  // Mapear todas as dependências
  for (const file of files) {
    const imports = extractImports(file);
    dependencies.set(file, imports);
  }
  
  return { files, dependencies };
}

// Identificar arquivos duplicados (mesmo nome em lugares diferentes)
function findDuplicateNames(files) {
  const nameMap = new Map();
  
  for (const file of files) {
    const basename = path.basename(file);
    if (!nameMap.has(basename)) {
      nameMap.set(basename, []);
    }
    nameMap.get(basename).push(file);
  }
  
  const duplicates = Array.from(nameMap.entries())
    .filter(([_, paths]) => paths.length > 1)
    .map(([name, paths]) => ({ name, paths }));
  
  return duplicates;
}

// Identificar candidatos para shared/
function findSharedCandidates(files, dependencies) {
  const candidates = new Map();
  
  for (const file of files) {
    // Pular se já está em shared/
    if (file.includes('/shared/')) continue;
    
    // Contar quantos arquivos diferentes importam este
    let importCount = 0;
    const importers = [];
    
    for (const [importer, imports] of dependencies.entries()) {
      if (importer === file) continue;
      
      const hasImport = imports.some(imp => {
        const resolved = imp.resolved.endsWith('.ts') ? imp.resolved : imp.resolved + '.ts';
        return resolved === file || resolved === file.replace('.ts', '');
      });
      
      if (hasImport) {
        importCount++;
        // Extrair módulo pai (item, familia, etc)
        const match = importer.match(/api\/lor0138\/([^/]+)/);
        if (match) importers.push(match[1]);
      }
    }
    
    if (importCount >= 2) {
      const uniqueModules = [...new Set(importers)];
      candidates.set(file, {
        count: importCount,
        modules: uniqueModules,
        isSharedCandidate: uniqueModules.length >= 2
      });
    }
  }
  
  return candidates;
}

// Relatório principal
function generateReport() {
  const { files, dependencies } = analyzeDependencies();
  
  // 1. Arquivos duplicados
  console.log(`${COLORS.yellow}${COLORS.bright}1. ARQUIVOS COM NOMES DUPLICADOS${COLORS.reset}`);
  console.log(`${COLORS.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
  
  const duplicates = findDuplicateNames(files);
  if (duplicates.length === 0) {
    console.log(`${COLORS.green}✓ Nenhum arquivo duplicado encontrado${COLORS.reset}\n`);
  } else {
    for (const { name, paths } of duplicates) {
      console.log(`${COLORS.bright}${name}${COLORS.reset} (${paths.length} ocorrências):`);
      paths.forEach(p => console.log(`  • ${p.replace(SRC_DIR, 'src')}`));
      console.log('');
    }
  }
  
  // 2. Candidatos para shared/
  console.log(`${COLORS.magenta}${COLORS.bright}2. CANDIDATOS PARA SHARED/${COLORS.reset}`);
  console.log(`${COLORS.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
  
  const candidates = findSharedCandidates(files, dependencies);
  const sharedCandidates = Array.from(candidates.entries())
    .filter(([_, info]) => info.isSharedCandidate)
    .sort((a, b) => b[1].count - a[1].count);
  
  if (sharedCandidates.length === 0) {
    console.log(`${COLORS.green}✓ Nenhum candidato encontrado (ou já está bem organizado)${COLORS.reset}\n`);
  } else {
    for (const [file, info] of sharedCandidates) {
      const relativePath = file.replace(SRC_DIR, 'src');
      const type = file.match(/\/(types|validators|mappers|utils)\//)?.[1] || 'outros';
      
      console.log(`${COLORS.bright}${path.basename(file)}${COLORS.reset}`);
      console.log(`  Caminho: ${relativePath}`);
      console.log(`  Tipo: ${COLORS.cyan}${type}${COLORS.reset}`);
      console.log(`  Usado por: ${COLORS.green}${info.count}${COLORS.reset} arquivos em ${COLORS.yellow}${info.modules.length}${COLORS.reset} módulos [${info.modules.join(', ')}]`);
      
      // Sugerir destino
      let suggestedPath = '';
      if (type === 'types') suggestedPath = `shared/types/lor0138/${path.basename(file)}`;
      else if (type === 'validators') suggestedPath = `shared/validators/lor0138/${path.basename(file)}`;
      else if (type === 'mappers') suggestedPath = `shared/mappers/lor0138/${path.basename(file)}`;
      else suggestedPath = `shared/utils/lor0138/${path.basename(file)}`;
      
      console.log(`  ${COLORS.blue}→ Sugestão: ${suggestedPath}${COLORS.reset}`);
      console.log('');
    }
  }
  
  // 3. Estatísticas gerais
  console.log(`${COLORS.cyan}${COLORS.bright}3. ESTATÍSTICAS${COLORS.reset}`);
  console.log(`${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
  
  const totalImports = Array.from(dependencies.values())
    .reduce((sum, imports) => sum + imports.length, 0);
  
  console.log(`Total de arquivos: ${COLORS.bright}${files.length}${COLORS.reset}`);
  console.log(`Total de imports relativos: ${COLORS.bright}${totalImports}${COLORS.reset}`);
  console.log(`Candidatos para shared/: ${COLORS.bright}${sharedCandidates.length}${COLORS.reset}`);
  console.log(`Arquivos com nomes duplicados: ${COLORS.bright}${duplicates.length}${COLORS.reset}`);
  
  console.log(`\n${COLORS.green}${COLORS.bright}✓ Análise concluída!${COLORS.reset}\n`);
}

// Executar
generateReport();
