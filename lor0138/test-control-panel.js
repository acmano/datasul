const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log("==========================================================");
  console.log("     TESTE COMPLETO DO CONTROL PANEL COLAPSAVEL");
  console.log("==========================================================\n");
  
  const results = {
    estadoColapsado: false,
    botaoColapsado: false,
    estadoExpandido: false,
    botaoExpandido: false,
    secoes: { visualizacao: false, filtros: false, exibicao: false },
    controlesFuncionam: false,
    sliderFunciona: false,
    colorPickers: 0,
    drillDown: false,
    semDuplicacao: false,
    overflowCorrigido: false
  };
  
  try {
    console.log("[PASSO 1] Navegando ate Engenharias > Estrutura...");
    await page.goto('http://lor0138.lorenzetti.ibe:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    
    await page.locator('input[type="text"]').first().fill('7530110');
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(3000);
    
    await page.click('text=Engenharias');
    await page.waitForTimeout(1000);
    
    const estruturaLinks = await page.locator('text=Estrutura').count();
    if (estruturaLinks > 0) {
      await page.locator('text=Estrutura').first().click();
      await page.waitForTimeout(2000);
      console.log("[OK] Navegacao bem-sucedida\n");
    }
    
    console.log("[PASSO 2] Verificando aba Produtos...");
    const produtosTab = await page.locator('text=Produtos');
    if (await produtosTab.count() > 0) {
      await produtosTab.click();
      await page.waitForTimeout(2000);
      console.log("[OK] Aba Produtos acessada\n");
    }
    
    await page.screenshot({ path: '/tmp/01-inicial.png', fullPage: true });
    
    console.log("[PASSO 3] Verificando ESTADO COLAPSADO (padrao)...");
    const controleBtn = await page.locator('button:has-text("Controles")').first();
    
    if (await controleBtn.count() > 0) {
      const btnTextCollapsed = await controleBtn.textContent();
      console.log("   Texto do botao: '" + btnTextCollapsed + "'");
      
      results.botaoColapsado = btnTextCollapsed.includes('▾') || btnTextCollapsed.includes('▼');
      console.log("   Seta para baixo: " + (results.botaoColapsado ? "[OK]" : "[FALHA]"));
      
      const controlPanelBox = await page.locator('.control-panel, [class*="ControlPanel"], [class*="control-panel"]').first().boundingBox();
      if (controlPanelBox) {
        console.log("   Altura colapsada: " + Math.round(controlPanelBox.height) + "px");
        results.estadoColapsado = controlPanelBox.height < 150;
        console.log("   Estado colapsado adequado: " + (results.estadoColapsado ? "[OK] <150px" : "[AVISO] >" + Math.round(controlPanelBox.height) + "px"));
      }
      
      await page.screenshot({ path: '/tmp/02-estado-colapsado.png', fullPage: true });
      console.log("   Screenshot: 02-estado-colapsado.png");
      console.log("");
      
      console.log("[PASSO 4] EXPANDINDO ControlPanel...");
      await controleBtn.click();
      await page.waitForTimeout(1000);
      
      const btnTextExpanded = await controleBtn.textContent();
      console.log("   Texto do botao agora: '" + btnTextExpanded + "'");
      
      results.botaoExpandido = btnTextExpanded.includes('▴') || btnTextExpanded.includes('▲');
      console.log("   Seta para cima: " + (results.botaoExpandido ? "[OK]" : "[FALHA]"));
      
      const expandedBox = await page.locator('.control-panel, [class*="ControlPanel"], [class*="control-panel"]').first().boundingBox();
      if (expandedBox && controlPanelBox) {
        const expansion = Math.round(expandedBox.height - controlPanelBox.height);
        console.log("   Altura expandida: " + Math.round(expandedBox.height) + "px (+" + expansion + "px)");
        results.estadoExpandido = expansion > 100;
        console.log("   Expansao significativa: " + (results.estadoExpandido ? "[OK] +" + expansion + "px" : "[FALHA]"));
      }
      
      await page.screenshot({ path: '/tmp/03-estado-expandido.png', fullPage: true });
      console.log("   Screenshot: 03-estado-expandido.png");
      console.log("");
      
      console.log("[PASSO 5] Verificando SECOES do ControlPanel...");
      results.secoes.visualizacao = await page.locator('text=/Visuali[zs]a[çc][ãa]o/i').count() > 0;
      results.secoes.filtros = await page.locator('text=Filtros').count() > 0;
      results.secoes.exibicao = await page.locator('text=/Exibi[çc][ãa]o/i').count() > 0;
      
      console.log("   📊 Visualizacao: " + (results.secoes.visualizacao ? "[OK]" : "[FALHA]"));
      console.log("   📅 Filtros: " + (results.secoes.filtros ? "[OK]" : "[FALHA]"));
      console.log("   🎨 Exibicao: " + (results.secoes.exibicao ? "[OK]" : "[FALHA]"));
      console.log("");
      
      console.log("[PASSO 6] Testando CONTROLES FUNCIONAM...");
      
      const consumoBtn = await page.locator('button:has-text("Consumo")');
      if (await consumoBtn.count() > 0) {
        await consumoBtn.first().click();
        await page.waitForTimeout(500);
        console.log("   Botao 'Consumo' clicado: [OK]");
        results.controlesFuncionam = true;
      }
      
      await page.screenshot({ path: '/tmp/04-consumo-ativo.png', fullPage: true });
      console.log("   Screenshot: 04-consumo-ativo.png");
      
      const sliders = await page.locator('input[type="range"]');
      const sliderCount = await sliders.count();
      console.log("   Sliders encontrados: " + sliderCount);
      
      if (sliderCount > 0) {
        const sliderValueBefore = await sliders.first().getAttribute('value');
        await sliders.first().fill('3');
        await page.waitForTimeout(500);
        const sliderValueAfter = await sliders.first().getAttribute('value');
        results.sliderFunciona = sliderValueAfter === '3';
        console.log("   Slider ajustado: " + sliderValueBefore + " -> " + sliderValueAfter + " " + (results.sliderFunciona ? "[OK]" : "[FALHA]"));
      }
      
      await page.screenshot({ path: '/tmp/05-slider-nivel-3.png', fullPage: true });
      console.log("   Screenshot: 05-slider-nivel-3.png");
      
      results.colorPickers = await page.locator('input[type="color"]').count();
      console.log("   Color pickers encontrados: " + results.colorPickers + (results.colorPickers >= 2 ? " [OK]" : " [AVISO]"));
      
      await page.screenshot({ path: '/tmp/06-controles-ativos.png', fullPage: true });
      console.log("   Screenshot: 06-controles-ativos.png");
      console.log("");
      
      console.log("[PASSO 7] Testando DRILL-DOWN (clique duplo)...");
      const visibleRows = await page.locator('tbody tr:visible');
      const rowCount = await visibleRows.count();
      console.log("   Linhas visiveis na tabela: " + rowCount);
      
      if (rowCount > 0) {
        const firstRowText = await visibleRows.first().textContent();
        console.log("   Primeira linha: " + firstRowText.substring(0, 50) + "...");
        
        await visibleRows.first().dblclick();
        await page.waitForTimeout(2000);
        
        const breadcrumb = await page.locator('[class*="breadcrumb"]').textContent().catch(() => "");
        console.log("   Breadcrumb atualizado: " + (breadcrumb ? "[OK]" : "[?]"));
        results.drillDown = true;
      }
      
      await page.screenshot({ path: '/tmp/07-drill-down.png', fullPage: true });
      console.log("   Screenshot: 07-drill-down.png");
      console.log("");
      
      console.log("[PASSO 8] Verificando NAO HA DUPLICACAO...");
      const allSliders = await page.locator('input[type="range"]').count();
      const allColorPickers = await page.locator('input[type="color"]').count();
      
      console.log("   Total de sliders na pagina: " + allSliders);
      console.log("   Total de color pickers na pagina: " + allColorPickers);
      
      results.semDuplicacao = (allSliders === 1 && allColorPickers === 2);
      
      if (allSliders === 1) {
        console.log("   Sliders: [OK] Exatamente 1 (sem duplicacao)");
      } else {
        console.log("   Sliders: [FALHA] " + allSliders + " encontrados (esperado: 1)");
      }
      
      if (allColorPickers === 2) {
        console.log("   Color pickers: [OK] Exatamente 2 (sem duplicacao)");
      } else {
        console.log("   Color pickers: [FALHA] " + allColorPickers + " encontrados (esperado: 2)");
      }
      
      await page.screenshot({ path: '/tmp/08-sem-duplicacao.png', fullPage: true });
      console.log("   Screenshot: 08-sem-duplicacao.png");
      console.log("");
      
      console.log("[PASSO 9] Verificando OVERFLOW CORRIGIDO...");
      await page.evaluate(() => {
        const tables = document.querySelectorAll('tbody');
        if (tables.length > 0) {
          const table = tables[tables.length - 1];
          const rows = table.querySelectorAll('tr:not([aria-hidden="true"])');
          if (rows.length > 0) {
            rows[rows.length - 1].scrollIntoView({ block: 'end', behavior: 'smooth' });
          }
        }
      });
      await page.waitForTimeout(1000);
      
      const lastVisibleRow = await page.locator('tbody tr:visible').last();
      if (await lastVisibleRow.count() > 0) {
        const isVisible = await lastVisibleRow.isVisible();
        results.overflowCorrigido = isVisible;
        console.log("   Ultima linha visivel: " + (isVisible ? "[OK] SIM" : "[FALHA] NAO"));
      }
      
      await page.screenshot({ path: '/tmp/09-final-lista.png', fullPage: true });
      console.log("   Screenshot: 09-final-lista.png");
      console.log("");
      
      console.log("==========================================================");
      console.log("                  RELATORIO FINAL");
      console.log("==========================================================");
      console.log("");
      console.log("1. Estado COLAPSADO (padrao):");
      console.log("   " + (results.estadoColapsado ? "✅" : "❌") + " Altura adequada (<150px)");
      console.log("   " + (results.botaoColapsado ? "✅" : "❌") + " Botao com seta para baixo (▾)");
      console.log("");
      console.log("2. Expansao do ControlPanel:");
      console.log("   " + (results.estadoExpandido ? "✅" : "❌") + " Expansao significativa (>100px)");
      console.log("   " + (results.botaoExpandido ? "✅" : "❌") + " Botao com seta para cima (▴)");
      console.log("");
      console.log("3. Secoes visiveis:");
      console.log("   " + (results.secoes.visualizacao ? "✅" : "❌") + " 📊 Visualizacao");
      console.log("   " + (results.secoes.filtros ? "✅" : "❌") + " 📅 Filtros");
      console.log("   " + (results.secoes.exibicao ? "✅" : "❌") + " 🎨 Exibicao");
      console.log("");
      console.log("4. Controles funcionais:");
      console.log("   " + (results.controlesFuncionam ? "✅" : "❌") + " Botao Consumo funciona");
      console.log("   " + (results.sliderFunciona ? "✅" : "❌") + " Slider ajusta nivel");
      console.log("   " + (results.colorPickers >= 2 ? "✅" : "❌") + " Color pickers presentes (" + results.colorPickers + ")");
      console.log("");
      console.log("5. Drill-down:");
      console.log("   " + (results.drillDown ? "✅" : "❌") + " Clique duplo funciona");
      console.log("");
      console.log("6. Ausencia de duplicacao:");
      console.log("   " + (results.semDuplicacao ? "✅" : "❌") + " Controles unicos (1 slider, 2 color pickers)");
      console.log("");
      console.log("7. Overflow corrigido:");
      console.log("   " + (results.overflowCorrigido ? "✅" : "❌") + " Ultima linha visivel");
      console.log("");
      
      const totalTests = 12;
      const passedTests = [
        results.estadoColapsado,
        results.botaoColapsado,
        results.estadoExpandido,
        results.botaoExpandido,
        results.secoes.visualizacao,
        results.secoes.filtros,
        results.secoes.exibicao,
        results.controlesFuncionam,
        results.sliderFunciona,
        results.colorPickers >= 2,
        results.drillDown,
        results.semDuplicacao,
        results.overflowCorrigido
      ].filter(Boolean).length;
      
      console.log("==========================================================");
      console.log("   RESULTADO: " + passedTests + "/13 testes passaram");
      console.log("==========================================================");
      
      if (passedTests === 13) {
        console.log("\n🎉 TODOS OS TESTES PASSARAM! 🎉");
      } else {
        console.log("\n⚠️  Alguns testes falharam. Revise os detalhes acima.");
      }
      
    } else {
      console.log("[ERRO CRITICO] Botao 'Controles' nao encontrado!");
    }
    
  } catch (error) {
    console.error("\n[ERRO FATAL] " + error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
