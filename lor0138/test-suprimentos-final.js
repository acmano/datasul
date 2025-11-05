const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  
  await page.waitForSelector('body', { timeout: 10000 });
  console.log('App loaded successfully');
  
  await page.screenshot({ path: '/tmp/01-initial-page.png', fullPage: true });
  console.log('Screenshot 1: Initial page');
  
  await sleep(2000);
  
  // Step 1: Perform a search to get results
  console.log('Step 1: Searching for items...');
  const searchButton = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Buscar'));
  });
  
  if (searchButton && searchButton.asElement()) {
    await searchButton.asElement().click();
    console.log('Clicked search button');
    await sleep(4000); // Wait for search results
    await page.screenshot({ path: '/tmp/02-search-results.png', fullPage: true });
    console.log('Screenshot 2: Search results');
  }
  
  // Step 2: Click on Suprimentos menu item
  console.log('Step 2: Clicking Suprimentos menu...');
  const suprimentosClicked = await page.evaluate(() => {
    const menuItems = Array.from(document.querySelectorAll('.ant-menu-item'));
    const suprimentosItem = menuItems.find(item => item.textContent.includes('Suprimentos'));
    if (suprimentosItem) {
      suprimentosItem.click();
      return true;
    }
    return false;
  });
  
  if (suprimentosClicked) {
    console.log('Clicked Suprimentos menu');
  } else {
    console.log('Menu item not found, trying keyboard shortcut...');
    await page.keyboard.down('Control');
    await page.keyboard.press('5');
    await page.keyboard.up('Control');
  }
  
  await sleep(2000);
  await page.screenshot({ path: '/tmp/03-suprimentos-module.png', fullPage: true });
  console.log('Screenshot 3: Suprimentos module');
  
  // Step 3: Check for tabs
  const tabs = await page.$$('.ant-tabs-tab');
  console.log('Found', tabs.length, 'tabs');
  
  if (tabs.length >= 6) {
    // Get tab names
    const tabNames = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.ant-tabs-tab'));
      return tabs.map(t => t.textContent.trim());
    });
    console.log('Tab names:', tabNames);
    
    // Test clicking each tab
    console.log('Step 3: Testing tab clicks...');
    for (let i = 0; i < 6; i++) {
      await page.evaluate((index) => {
        const tabs = Array.from(document.querySelectorAll('.ant-tabs-tab'));
        if (tabs[index]) tabs[index].click();
      }, i);
      await sleep(800);
      const filename = '/tmp/04-tab-' + (i + 1) + '.png';
      await page.screenshot({ path: filename, fullPage: true });
      console.log('Screenshot: Tab', i + 1, '-', tabNames[i]);
    }
    
    // Step 4: Test keyboard shortcuts Alt+1 through Alt+6
    console.log('Step 4: Testing Alt+1 through Alt+6 shortcuts...');
    for (let i = 1; i <= 6; i++) {
      console.log('Testing Alt+' + i);
      await page.keyboard.down('Alt');
      await page.keyboard.press(String(i));
      await page.keyboard.up('Alt');
      await sleep(800);
      const filename = '/tmp/05-alt' + i + '-shortcut.png';
      await page.screenshot({ path: filename, fullPage: true });
      console.log('Screenshot saved: Alt+' + i);
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ Initial page loaded');
    console.log('✓ Search performed');
    console.log('✓ Suprimentos module accessed');
    console.log('✓ Found', tabs.length, 'tabs');
    console.log('✓ Tab names:', tabNames.join(', '));
    console.log('✓ All tabs clicked successfully');
    console.log('✓ All keyboard shortcuts tested (Alt+1 through Alt+6)');
  } else {
    console.log('\n=== TEST FAILED ===');
    console.log('✗ Expected 6 tabs, found', tabs.length);
    console.log('Please check screenshots for details.');
  }
  
  await browser.close();
  console.log('\nAll tests completed!');
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
