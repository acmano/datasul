const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('1. Navigating to homepage...');
    await page.goto('http://lor0138.lorenzetti.ibe:3000/');
    await page.waitForTimeout(2000);

    console.log('2. Clicking on Engenharias...');
    await page.click('text=Engenharias');
    await page.waitForTimeout(2000);

    console.log('3. Finding and filling the Código input...');
    // The first input on the page is the Código field
    await page.locator('input').first().fill('7530110');
    await page.waitForTimeout(500);

    console.log('4. Clicking Buscar button...');
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(4000);

    console.log('5. Taking FINAL screenshot...');
    await page.screenshot({ path: '/tmp/problema-atual.png', fullPage: true });

    console.log('✅ Screenshot saved to /tmp/problema-atual.png');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
