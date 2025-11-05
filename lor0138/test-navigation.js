const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('1. Navigating to homepage...');
  await page.goto('http://lor0138.lorenzetti.ibe:3000/');
  await page.waitForTimeout(2000);

  console.log('2. Looking for Engenharias menu item...');
  // Click on Engenharias
  await page.click('text=Engenharias');
  await page.waitForTimeout(1000);

  console.log('3. Taking screenshot after clicking Engenharias...');
  await page.screenshot({ path: '/tmp/after-engenharias-click.png', fullPage: true });

  console.log('4. Looking for Estrutura submenu...');
  // Look for submenu items
  const estruturaVisible = await page.isVisible('text=Estrutura');
  console.log('Estrutura visible:', estruturaVisible);

  if (estruturaVisible) {
    await page.click('text=Estrutura');
    await page.waitForTimeout(2000);
  }

  console.log('5. Taking screenshot of current state...');
  await page.screenshot({ path: '/tmp/after-estrutura.png', fullPage: true });

  console.log('6. Searching for item 7530110...');
  // Find and fill the search input
  await page.fill('input[placeholder*="Código"], input[name="codigo"]', '7530110');
  await page.waitForTimeout(500);

  console.log('7. Clicking search button...');
  // Click the Buscar button
  await page.click('button:has-text("Buscar")');
  await page.waitForTimeout(3000);

  console.log('8. Taking final screenshot...');
  await page.screenshot({ path: '/tmp/problema-atual.png', fullPage: true });

  console.log('9. Getting page info...');
  const title = await page.title();
  const url = page.url();
  console.log('Page title:', title);
  console.log('Page URL:', url);

  await browser.close();
  console.log('Done!');
})();
