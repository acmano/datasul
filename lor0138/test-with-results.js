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
    await page.waitForTimeout(2000);
    
    // Click on a menu item to potentially show a list
    console.log('Clicking on Engenharias menu...');
    await page.click('text=Engenharias');
    await page.waitForTimeout(2000);
    
    // Take screenshot after navigation
    await page.screenshot({ 
      path: '/tmp/rounded-box-with-list.png', 
      fullPage: false 
    });
    
    console.log('Screenshot with list taken');
    
    // Check for rounded box elements again
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
            isFullyVisible: rect.bottom <= window.innerHeight && rect.top >= 0,
            bottomCutoff: rect.bottom > window.innerHeight,
            className: div.className
          });
        }
      });
      
      return {
        viewportHeight: window.innerHeight,
        roundedBoxes: boxesWithBorder.filter(box => box.height > 500),
        allBoxesCount: boxesWithBorder.length
      };
    });
    
    console.log('\nLarge Box Analysis (height > 500px):');
    console.log(JSON.stringify(boxInfo, null, 2));
    
    // Take full page screenshot
    await page.screenshot({ 
      path: '/tmp/rounded-box-with-list-fullpage.png', 
      fullPage: true 
    });
    
    console.log('Full page screenshot taken');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
