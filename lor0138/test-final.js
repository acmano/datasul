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
  
  try {
    console.log("[1] Navegando para Engenharias > Produtos...");
    await page.goto('http://lor0138.lorenzetti.ibe:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('input[type="text"]').first().fill('7530110');
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(3000);
    await page.click('text=Engenharias');
    await page.waitForTimeout(1000);
    await page.locator('text=Estrutura').first().click();
    await page.waitForTimeout(2000);
    await page.locator('text=Produtos').click();
    await page.waitForTimeout(2000);
    console.log("✅ Navegacao concluida\n");
    
    console.log("[2] ESTADO COLAPSADO (padrao)...");
    await page.screenshot({ path: '/tmp/test-01-colapsado.png', fullPage: true });
    
    const controleBtn = await page.locator('button:has-text("Controles")').first();
    const btnTextCollapsed = await controleBtn.textContent();
    console.log("Botao: '" + btnTextCollapsed.trim() + "'");
    
    const hasDownArrow = btnTextCollapsed.includes('▾');
    console.log((hasDownArrow ? "✅" : "❌") + " Seta para baixo no botao");
    
    console.log("Screenshot: test-01-colapsado.png\n");
    
    console.log("[3] EXPANDINDO ControlPanel...");
    await controleBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/test-02-expandido.png', fullPage: true });
    
    const btnTextExpanded = await controleBtn.textContent();
    console.log("Botao agora: '" + btnTextExpanded.trim() + "'");
    
    const hasUpArrow = btnTextExpanded.includes('▴');
    console.log((hasUpArrow ? "✅" : "❌") + " Seta para cima no botao");
    
    console.log("Screenshot: test-02-expandido.png\n");
    
    console.log("[4] Verificando secoes expandidas...");
    const visualizacao = await page.locator('text=/Visuali[zs]/i').count() > 0;
    const filtros = await page.locator('text=Filtros').count() > 0;
    const exibicao = await page.locator('text=/Exibi[çc]/i').count() > 0;
    
    console.log((visualizacao ? "✅" : "❌") + " Secao Visualizacao");
    console.log((filtros ? "✅" : "❌") + " Secao Filtros");
    console.log((exibicao ? "✅" : "❌") + " Secao Exibicao\n");
    
    console.log("[5] Testando controles...");
    const consumoBtn = await page.locator('button:has-text("Consumo")');
    if (await consumoBtn.count() > 0) {
      await consumoBtn.first().click();
      await page.waitForTimeout(500);
      console.log("✅ Botao Consumo clicado");
    } else {
      console.log("⚠️  Botao Consumo nao encontrado");
    }
    
    await page.screenshot({ path: '/tmp/test-03-consumo.png', fullPage: true });
    console.log("Screenshot: test-03-consumo.png\n");
    
    console.log("[6] Testando slider...");
    const sliders = await page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    console.log("Sliders encontrados: " + sliderCount);
    
    if (sliderCount > 0) {
      await sliders.first().fill('3');
      await page.waitForTimeout(500);
      console.log("✅ Slider ajustado para nivel 3");
    }
    
    await page.screenshot({ path: '/tmp/test-04-slider.png', fullPage: true });
    console.log("Screenshot: test-04-slider.png\n");
    
    console.log("[7] Verificando color pickers...");
    const colorPickers = await page.locator('input[type="color"]').count();
    console.log((colorPickers >= 2 ? "✅" : "❌") + " Color pickers: " + colorPickers + " (esperado: 2)");
    
    await page.screenshot({ path: '/tmp/test-05-controls.png', fullPage: true });
    console.log("Screenshot: test-05-controls.png\n");
    
    console.log("[8] Testando drill-down...");
    const visibleRows = await page.locator('tbody tr:visible');
    const rowCount = await visibleRows.count();
    console.log("Linhas visiveis: " + rowCount);
    
    if (rowCount > 0) {
      await visibleRows.first().dblclick();
      await page.waitForTimeout(2000);
      console.log("✅ Clique duplo executado");
    }
    
    await page.screenshot({ path: '/tmp/test-06-drilldown.png', fullPage: true });
    console.log("Screenshot: test-06-drilldown.png\n");
    
    console.log("[9] Verificando DUPLICACAO...");
    const allSliders = await page.locator('input[type="range"]').count();
    const allColorPickers = await page.locator('input[type="color"]').count();
    
    console.log((allSliders === 1 ? "✅" : "❌") + " Sliders totais: " + allSliders + " (esperado: 1)");
    console.log((allColorPickers === 2 ? "✅" : "❌") + " Color pickers totais: " + allColorPickers + " (esperado: 2)");
    
    await page.screenshot({ path: '/tmp/test-07-duplicacao.png', fullPage: true });
    console.log("Screenshot: test-07-duplicacao.png\n");
    
    console.log("[10] Verificando overflow...");
    await page.evaluate(() => {
      const tables = document.querySelectorAll('tbody');
      if (tables.length > 0) {
        const rows = tables[tables.length - 1].querySelectorAll('tr:not([aria-hidden="true"])');
        if (rows.length > 0) {
          rows[rows.length - 1].scrollIntoView({ block: 'end' });
        }
      }
    });
    await page.waitForTimeout(1000);
    
    const lastRow = await page.locator('tbody tr:visible').last();
    const isLastVisible = await lastRow.isVisible().catch(() => false);
    console.log((isLastVisible ? "✅" : "❌") + " Ultima linha visivel");
    
    await page.screenshot({ path: '/tmp/test-08-overflow.png', fullPage: true });
    console.log("Screenshot: test-08-overflow.png\n");
    
    console.log("==========================================================");
    console.log("                  RELATORIO FINAL");
    console.log("==========================================================\n");
    console.log((hasDownArrow ? "✅" : "❌") + " Estado colapsado com seta ▾");
    console.log((hasUpArrow ? "✅" : "❌") + " Estado expandido com seta ▴");
    console.log((visualizacao && filtros && exibicao ? "✅" : "❌") + " Todas as 3 secoes presentes");
    console.log((sliderCount > 0 ? "✅" : "❌") + " Slider funcional");
    console.log((colorPickers >= 2 ? "✅" : "❌") + " Color pickers presentes");
    console.log((rowCount > 0 ? "✅" : "❌") + " Drill-down funcional");
    console.log((allSliders === 1 && allColorPickers === 2 ? "✅" : "❌") + " Sem duplicacao de controles");
    console.log((isLastVisible ? "✅" : "❌") + " Overflow corrigido");
    
    const allPass = hasDownArrow && hasUpArrow && visualizacao && filtros && exibicao && 
                    sliderCount > 0 && colorPickers >= 2 && rowCount > 0 && 
                    allSliders === 1 && allColorPickers === 2 && isLastVisible;
    
    console.log("\n" + (allPass ? "🎉 TODOS OS TESTES PASSARAM!" : "⚠️  Alguns testes falharam"));
    console.log("==========================================================\n");
    
  } catch (error) {
    console.error("\n❌ ERRO: " + error.message);
    await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
