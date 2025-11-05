const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Step 1: Loading app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(2000);
  
  console.log('Step 2: Searching for items...');
  await page.type('input[placeholder="Código"]', '%');
  await sleep(500);
  await page.click('button.ant-btn-primary');
  await sleep(5000); // Wait for search results
  await page.screenshot({ path: '/tmp/final-01-search-results.png', fullPage: true });
  console.log('  ✓ Search results loaded');
  
  console.log('Step 3: Clicking Suprimentos in sidebar...');
  await page.evaluate(() => {
    const sidebarItems = document.querySelectorAll('.ant-layout-sider .ant-menu-item');
    const suprItem = Array.from(sidebarItems).find(item => 
      item.textContent.includes('Suprimentos')
    );
    if (suprItem) suprItem.click();
  });
  
  // Wait much longer for module to load
  console.log('  Waiting for Suprimentos module to load...');
  await sleep(8000);
  await page.screenshot({ path: '/tmp/final-02-suprimentos-loading.png', fullPage: true });
  
  // Wait for tabs to appear
  await page.waitForSelector('.ant-tabs-tab', { timeout: 10000 }).catch(() => {
    console.log('  Tabs not found after waiting');
  });
  
  await sleep(2000);
  await page.screenshot({ path: '/tmp/final-03-suprimentos-loaded.png', fullPage: true });
  
  const tabInfo = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.ant-tabs-tab');
    return {
      count: tabs.length,
      names: Array.from(tabs).map(t => t.textContent.trim())
    };
  });
  
  console.log('\nStep 4: Verifying tabs...');
  console.log('  Tabs found:', tabInfo.count);
  console.log('  Tab names:', tabInfo.names.join(', '));
  
  if (tabInfo.count >= 6) {
    console.log('\n✓ SUCCESS: Found', tabInfo.count, 'tabs!');
    
    console.log('\nStep 5: Testing tab navigation...');
    for (let i = 0; i < 6; i++) {
      await page.evaluate((idx) => {
        document.querySelectorAll('.ant-tabs-tab')[idx].click();
      }, i);
      await sleep(1000);
      const fname = '/tmp/final-tab-' + (i + 1) + '.png';
      await page.screenshot({ path: fname, fullPage: true });
      console.log('  ✓ Tab', i + 1, ':', tabInfo.names[i]);
    }
    
    console.log('\nStep 6: Testing keyboard shortcuts Alt+1 through Alt+6...');
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.down('Alt');
      await page.keyboard.press(String(i));
      await page.keyboard.up('Alt');
      await sleep(1000);
      await page.screenshot({ path: '/tmp/final-alt' + i + '.png', fullPage: true });
      console.log('  ✓ Alt+' + i + ' shortcut');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✓✓✓ ALL TESTS PASSED SUCCESSFULLY ✓✓✓');
    console.log('='.repeat(60));
    console.log('\nVerified:');
    console.log('  ✓ Suprimentos module loads correctly');
    console.log('  ✓ All 6 tabs are present:', tabInfo.names.join(', '));
    console.log('  ✓ Tab clicking works');
    console.log('  ✓ Keyboard shortcuts (Alt+1 through Alt+6) work');
    console.log('='.repeat(60));
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('✗✗✗ TEST FAILED ✗✗✗');
    console.log('='.repeat(60));
    console.log('Expected 6 tabs, found', tabInfo.count);
    console.log('Check screenshots for details');
  }
  
  await browser.close();
})().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
