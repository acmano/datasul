const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    await page.click('text=Engenharias');
    await page.waitForTimeout(2000);
    
    await page.locator('input').first().fill('7530110');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(4000);
    
    await page.screenshot({ 
      path: '/tmp/search-results.png', 
      fullPage: false 
    });
    
    const boxInfo = await page.evaluate(() => {
      const vh = window.innerHeight;
      const boxes = [];
      
      document.querySelectorAll('div').forEach(div => {
        const style = window.getComputedStyle(div);
        if (style.borderRadius && style.borderRadius !== '0px') {
          const rect = div.getBoundingClientRect();
          if (rect.height > 400) {
            boxes.push({
              h: Math.round(rect.height),
              top: Math.round(rect.top),
              bot: Math.round(rect.bottom),
              cut: rect.bottom > vh,
              over: Math.max(0, Math.round(rect.bottom - vh))
            });
          }
        }
      });
      
      return { vh, boxes };
    });
    
    console.log('Viewport:', boxInfo.vh);
    console.log('Large boxes:', JSON.stringify(boxInfo.boxes, null, 2));
    
    await page.screenshot({ 
      path: '/tmp/search-results-full.png', 
      fullPage: true 
    });
    
    console.log('Done');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
