const puppeteer = require('puppeteer');

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
  
  // Wait for the app to load
  await page.waitForSelector('body', { timeout: 10000 });
  console.log('App loaded successfully');
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/01-initial-page.png', fullPage: true });
  console.log('Screenshot saved: 01-initial-page.png');
  
  // Wait a bit for React to render
  await page.waitForTimeout(2000);
  
  // Test Ctrl+5 to navigate to Suprimentos
  console.log('Testing Ctrl+5 shortcut...');
  await page.keyboard.down('Control');
  await page.keyboard.press('5');
  await page.keyboard.up('Control');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/02-after-ctrl5.png', fullPage: true });
  console.log('Screenshot saved: 02-after-ctrl5.png');
  
  // Check if tabs are visible
  const tabs = await page.$$('.ant-tabs-tab');
  console.log('Found tabs:', tabs.length);
  
  if (tabs.length > 0) {
    // Test clicking each tab
    for (let i = 0; i < Math.min(tabs.length, 6); i++) {
      console.log('Clicking tab', i + 1);
      const currentTabs = await page.$$('.ant-tabs-tab');
      await currentTabs[i].click();
      await page.waitForTimeout(500);
      const filename = '/tmp/tab-' + (i + 1) + '.png';
      await page.screenshot({ path: filename, fullPage: true });
      console.log('Screenshot saved:', filename);
    }
    
    // Test keyboard shortcuts Alt+1 through Alt+6
    console.log('Testing Alt+1 through Alt+6 shortcuts...');
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.down('Alt');
      await page.keyboard.press(String(i));
      await page.keyboard.up('Alt');
      await page.waitForTimeout(500);
      const filename = '/tmp/alt' + i + '-shortcut.png';
      await page.screenshot({ path: filename, fullPage: true });
      console.log('Screenshot saved:', filename);
    }
  }
  
  console.log('All tests completed!');
  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
