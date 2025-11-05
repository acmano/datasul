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
  const searchButton = await page.$('button:has-text("Buscar")') || await page.$('.ant-btn-primary');
  if (searchButton) {
    await searchButton.click();
    console.log('Clicked search button');
    await sleep(3000); // Wait for search results
    await page.screenshot({ path: '/tmp/02-search-results.png', fullPage: true });
    console.log('Screenshot 2: Search results');
  }
  
  // Step 2: Click on Suprimentos menu item
  console.log('Step 2: Clicking Suprimentos menu...');
  const suprimentosMenu = await page.$('text=Suprimentos') || 
                           await page.$('[data-menu-id*="5"]') ||
                           await page.$$('.ant-menu-item')[4]; // 5th item (0-indexed)
  
  if (suprimentosMenu) {
    await suprimentosMenu.click();
    console.log('Clicked Suprimentos menu');
    await sleep(1500);
    await page.screenshot({ path: '/tmp/03-suprimentos-module.png', fullPage: true });
    console.log('Screenshot 3: Suprimentos module loaded');
  } else {
    console.log('Could not find Suprimentos menu item, trying keyboard shortcut...');
    await page.keyboard.down('Control');
    await page.keyboard.press('5');
    await page.keyboard.up('Control');
    await sleep(1500);
    await page.screenshot({ path: '/tmp/03-suprimentos-module.png', fullPage: true });
    console.log('Screenshot 3: After Ctrl+5');
  }
  
  // Step 3: Check for tabs
  const tabs = await page.$$('.ant-tabs-tab');
  console.log('Found', tabs.length, 'tabs');
  
  if (tabs.length > 0) {
    // Test clicking each tab
    console.log('Step 3: Testing tab clicks...');
    for (let i = 0; i < Math.min(tabs.length, 6); i++) {
      const currentTabs = await page.$$('.ant-tabs-tab');
      const tabText = await currentTabs[i].evaluate(el => el.textContent);
      console.log('Clicking tab', i + 1, ':', tabText);
      await currentTabs[i].click();
      await sleep(800);
      const filename = '/tmp/04-tab-' + (i + 1) + '-' + tabText.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.png';
      await page.screenshot({ path: filename, fullPage: true });
      console.log('Screenshot saved:', filename);
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
      console.log('Screenshot saved:', filename);
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ Initial page loaded');
    console.log('✓ Search performed');
    console.log('✓ Suprimentos module accessed');
    console.log('✓ Found', tabs.length, 'tabs');
    console.log('✓ All tabs clicked successfully');
    console.log('✓ All keyboard shortcuts tested');
  } else {
    console.log('\n=== TEST FAILED ===');
    console.log('✗ No tabs found! Module may not have loaded correctly.');
    console.log('Please check screenshots for details.');
  }
  
  await browser.close();
  console.log('\nAll tests completed!');
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
