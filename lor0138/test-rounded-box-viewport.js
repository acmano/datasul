const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: '/tmp/rounded-box-initial.png', 
      fullPage: false 
    });
    
    console.log('Initial screenshot taken');
    
    const boxInfo = await page.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      const boxesWithBorder = [];
      
      allDivs.forEach(div => {
        const style = window.getComputedStyle(div);
        if (style.borderRadius && style.borderRadius !== '0px') {
          const rect = div.getBoundingClientRect();
          boxesWithBorder.push({
            borderRadius: style.borderRadius,
            border: style.border,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            isFullyVisible: rect.bottom <= window.innerHeight && rect.top >= 0,
            bottomCutoff: rect.bottom > window.innerHeight,
            className: div.className,
            overflow: style.overflow,
            overflowY: style.overflowY
          });
        }
      });
      
      return {
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        roundedBoxes: boxesWithBorder,
        totalBoxesFound: boxesWithBorder.length
      };
    });
    
    console.log('Box Analysis:', JSON.stringify(boxInfo, null, 2));
    
    await page.screenshot({ 
      path: '/tmp/rounded-box-fullpage.png', 
      fullPage: true 
    });
    
    console.log('Screenshots saved');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
