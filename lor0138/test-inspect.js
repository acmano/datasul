const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate and search
    await page.goto('http://lor0138.lorenzetti.ibe:3000/');
    await page.waitForTimeout(2000);
    await page.click('text=Engenharias');
    await page.waitForTimeout(2000);
    await page.locator('input').first().fill('7530110');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(4000);
    await page.click('text=Estrutura');
    await page.waitForTimeout(1000);

    // Get information about the table/list container
    const containerInfo = await page.evaluate(() => {
      // Find the main content area with the table
      const table = document.querySelector('table');
      if (!table) return { error: 'Table not found' };
      
      const container = table.closest('div');
      const computedStyle = window.getComputedStyle(container);
      
      return {
        containerClass: container.className,
        height: computedStyle.height,
        maxHeight: computedStyle.maxHeight,
        overflow: computedStyle.overflow,
        overflowY: computedStyle.overflowY,
        borderRadius: computedStyle.borderRadius,
        tableRows: table.querySelectorAll('tbody tr').length,
        containerRect: container.getBoundingClientRect(),
        tableRect: table.getBoundingClientRect()
      };
    });

    console.log('Container Info:', JSON.stringify(containerInfo, null, 2));

    // Take a screenshot highlighting the problem areas
    await page.screenshot({ 
      path: '/tmp/problema-detalhado.png', 
      fullPage: false 
    });

    console.log('✅ Detailed inspection complete!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
