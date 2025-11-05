const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    await page.click('text=Engenharias');
    await page.waitForTimeout(2000);
    await page.locator('input').first().fill('7530110');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(4000);
    
    console.log('Clicking Estrutura tab...');
    await page.click('text=Estrutura');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: '/tmp/estrutura-view.png', 
      fullPage: false 
    });
    
    const analysis = await page.evaluate(() => {
      const vh = window.innerHeight;
      const boxes = [];
      
      document.querySelectorAll('div').forEach(div => {
        const style = window.getComputedStyle(div);
        const br = style.borderRadius;
        if (br && br !== '0px' && br !== 'none') {
          const rect = div.getBoundingClientRect();
          const hasContent = div.querySelector('table, ul, .ant-list, .ant-table') !== null;
          
          if (rect.height > 300 || hasContent) {
            boxes.push({
              height: Math.round(rect.height),
              top: Math.round(rect.top),
              bottom: Math.round(rect.bottom),
              borderRadius: br,
              isCutOff: rect.bottom > vh,
              pixelsOver: Math.max(0, Math.round(rect.bottom - vh)),
              hasContent: hasContent,
              class: div.className.substring(0, 50)
            });
          }
        }
      });
      
      return { 
        viewportHeight: vh, 
        boxes: boxes,
        scrollHeight: document.documentElement.scrollHeight
      };
    });
    
    console.log('\n=== ESTRUTURA VIEW ANALYSIS ===');
    console.log('Viewport Height:', analysis.viewportHeight);
    console.log('Scroll Height:', analysis.scrollHeight);
    console.log('Number of rounded boxes:', analysis.boxes.length);
    
    analysis.boxes.forEach((box, idx) => {
      console.log('\nBox', idx + 1);
      console.log('  Height:', box.height);
      console.log('  Position:', box.top, '-', box.bottom);
      console.log('  Border Radius:', box.borderRadius);
      console.log('  Cut Off:', box.isCutOff ? 'YES (' + box.pixelsOver + 'px over)' : 'NO');
      console.log('  Has Content:', box.hasContent);
      console.log('  Class:', box.class);
    });
    
    await page.screenshot({ 
      path: '/tmp/estrutura-view-full.png', 
      fullPage: true 
    });
    
    console.log('\nScreenshots saved');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
