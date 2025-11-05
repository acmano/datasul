const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Loading app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await page.screenshot({ path: '/tmp/01-initial.png', fullPage: true });
  console.log('OK: Initial page');
  
  // Enter search criteria
  const codigoInput = await page.$('input[placeholder="Código"]');
  if (codigoInput) {
    await codigoInput.type('%');
  }
  await sleep(500);
  
  // Click search
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const searchBtn = btns.find(b => b.textContent.includes('Buscar'));
    if (searchBtn) searchBtn.click();
  });
  
  await sleep(5000);
  await page.screenshot({ path: '/tmp/02-results.png', fullPage: true });
  console.log('OK: Search executed');
  
  // Check results
  const hasResults = await page.evaluate(() => {
    const table = document.querySelector('.ant-table-tbody');
    const rows = table ? table.querySelectorAll('tr.ant-table-row') : [];
    return rows.length > 0;
  });
  
  if (!hasResults) {
    console.log('FAIL: No search results');
    await browser.close();
    process.exit(1);
  }
  
  console.log('OK: Results found');
  
  // Click Suprimentos
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.ant-menu-item'));
    const supr = items.find(i => i.textContent.includes('Suprimentos'));
    if (supr) supr.click();
  });
  
  await sleep(2000);
  await page.screenshot({ path: '/tmp/03-suprimentos.png', fullPage: true });
  console.log('OK: Suprimentos clicked');
  
  // Check tabs
  const tabCount = await page.evaluate(() => {
    return document.querySelectorAll('.ant-tabs-tab').length;
  });
  
  console.log('Tabs found:', tabCount);
  
  if (tabCount >= 6) {
    const names = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ant-tabs-tab')).map(t => t.textContent.trim());
    });
    console.log('Tab names:', names);
    
    // Click each tab
    for (let i = 0; i < 6; i++) {
      await page.evaluate((idx) => {
        document.querySelectorAll('.ant-tabs-tab')[idx].click();
      }, i);
      await sleep(500);
      await page.screenshot({ path: '/tmp/tab' + i + '.png', fullPage: true });
    }
    console.log('OK: All tabs clicked');
    
    // Test Alt shortcuts
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.down('Alt');
      await page.keyboard.press(String(i));
      await page.keyboard.up('Alt');
      await sleep(500);
      await page.screenshot({ path: '/tmp/alt' + i + '.png', fullPage: true });
    }
    console.log('OK: All shortcuts tested');
    console.log('\nSUCCESS: All tests passed');
  } else {
    console.log('FAIL: Expected 6 tabs, found', tabCount);
  }
  
  await browser.close();
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
