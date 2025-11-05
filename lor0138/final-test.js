const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,  // Run in visible mode to debug
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('1. Loading app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(2000);
  await page.screenshot({ path: '/tmp/step1-loaded.png', fullPage: true });
  
  console.log('2. Entering search criteria...');
  await page.type('input[placeholder="Código"]', '%');
  await sleep(500);
  
  console.log('3. Clicking search button...');
  await page.click('button.ant-btn-primary');
  await sleep(5000);
  await page.screenshot({ path: '/tmp/step2-searched.png', fullPage: true });
  
  console.log('4. Clicking SIDEBAR Suprimentos menu item...');
  // Click specifically on the sidebar menu, not the tab
  await page.evaluate(() => {
    const sidebarItems = document.querySelectorAll('.ant-layout-sider .ant-menu-item');
    const suprItem = Array.from(sidebarItems).find(item => 
      item.textContent.trim() === 'Suprimentos' || item.textContent.includes('Suprimentos')
    );
    if (suprItem) {
      console.log('Found sidebar Suprimentos, clicking...');
      suprItem.click();
    } else {
      console.log('Sidebar Suprimentos NOT found');
    }
  });
  
  await sleep(3000);
  await page.screenshot({ path: '/tmp/step3-suprimentos-loaded.png', fullPage: true });
  
  console.log('5. Checking for tabs...');
  const tabInfo = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.ant-tabs-tab');
    return {
      count: tabs.length,
      names: Array.from(tabs).map(t => t.textContent.trim())
    };
  });
  
  console.log('Tabs found:', tabInfo.count);
  console.log('Tab names:', tabInfo.names);
  
  if (tabInfo.count >= 6) {
    console.log('SUCCESS: Found', tabInfo.count, 'tabs');
    console.log('Clicking each tab...');
    
    for (let i = 0; i < 6; i++) {
      await page.evaluate((idx) => {
        document.querySelectorAll('.ant-tabs-tab')[idx].click();
      }, i);
      await sleep(1000);
      await page.screenshot({ path: '/tmp/tab-' + i + '-' + tabInfo.names[i].replace(/\s+/g, '-') + '.png', fullPage: true });
      console.log('  Tab', i + 1, ':', tabInfo.names[i]);
    }
    
    console.log('Testing Alt+1 through Alt+6...');
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.down('Alt');
      await page.keyboard.press(String(i));
      await page.keyboard.up('Alt');
      await sleep(1000);
      await page.screenshot({ path: '/tmp/alt-' + i + '.png', fullPage: true });
      console.log('  Alt+' + i);
    }
    
    console.log('\n✓✓✓ ALL TESTS PASSED ✓✓✓');
  } else {
    console.log('\n✗✗✗ TEST FAILED ✗✗✗');
    console.log('Expected 6 tabs, found', tabInfo.count);
  }
  
  await sleep(2000);
  await browser.close();
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
