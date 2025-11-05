const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('1. Navigating and searching...');
    await page.goto('http://lor0138.lorenzetti.ibe:3000/');
    await page.waitForTimeout(2000);
    await page.click('text=Engenharias');
    await page.waitForTimeout(2000);
    await page.locator('input').first().fill('7530110');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(4000);

    console.log('2. Clicking on Estrutura tab...');
    await page.click('text=Estrutura');
    await page.waitForTimeout(1000);

    console.log('3. Taking screenshot with viewport size...');
    await page.screenshot({ path: '/tmp/problema-viewport.png', fullPage: false });

    console.log('4. Scrolling down to see more...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    console.log('5. Taking screenshot after scroll...');
    await page.screenshot({ path: '/tmp/problema-scrolled.png', fullPage: false });

    console.log('6. Taking full page screenshot...');
    await page.screenshot({ path: '/tmp/problema-fullpage.png', fullPage: true });

    console.log('✅ All screenshots saved!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
