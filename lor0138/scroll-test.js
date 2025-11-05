const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    console.log('📍 Step 1: Navigate to http://localhost:3006');
    await page.goto('http://localhost:3006', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/tmp/01-homepage.png', fullPage: false });
    console.log('✅ Screenshot saved: 01-homepage.png');

    console.log('\n📍 Step 2: Perform a search to load data');
    // Wait for search form to be visible
    await page.waitForSelector('input[placeholder*="Código"], input[placeholder*="código"]', { timeout: 10000 });
    
    // Fill in a search term (using a common item code pattern)
    const searchInput = await page.locator('input[placeholder*="Código"], input[placeholder*="código"]').first();
    await searchInput.fill('001');
    await page.screenshot({ path: '/tmp/02-search-form-filled.png', fullPage: false });
    console.log('✅ Screenshot saved: 02-search-form-filled.png');
    
    // Click search button or press Enter
    await page.keyboard.press('Enter');
    
    // Wait for results to load
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 15000 });
    await page.waitForTimeout(2000); // Wait for data to settle
    await page.screenshot({ path: '/tmp/03-search-results.png', fullPage: false });
    console.log('✅ Screenshot saved: 03-search-results.png');

    console.log('\n📍 Step 3: Navigate to Engenharia module');
    // Look for Engenharia menu item
    const menuItems = await page.locator('.ant-menu-item').all();
    let engenhariaFound = false;
    
    for (const item of menuItems) {
      const text = await item.innerText().catch(() => '');
      if (text.includes('Engenhar')) {
        await item.click();
        engenhariaFound = true;
        break;
      }
    }
    
    if (!engenhariaFound) {
      console.log('⚠️  Engenharia menu not found, trying alternative...');
      // Try clicking the second menu item (usually Engenharia)
      const secondMenuItem = page.locator('.ant-menu-item').nth(1);
      await secondMenuItem.click();
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/04-engenharia-module.png', fullPage: false });
    console.log('✅ Screenshot saved: 04-engenharia-module.png');

    console.log('\n📍 Step 4: Navigate to Estrutura tab');
    // Click on Estrutura tab
    const estruturaTab = page.locator('.ant-tabs-tab').filter({ hasText: 'Estrutura' }).first();
    await estruturaTab.click();
    await page.waitForTimeout(3000); // Wait for tab content to load
    await page.screenshot({ path: '/tmp/05-estrutura-tab-initial.png', fullPage: false });
    console.log('✅ Screenshot saved: 05-estrutura-tab-initial.png');

    console.log('\n📍 Step 5: Analyze scroll container');
    // Find the table wrapper/scroll container
    const tableWrapper = page.locator('.ant-table-wrapper').first();
    const tableBody = page.locator('.ant-table-body').first();
    
    const wrapperExists = await tableWrapper.count() > 0;
    const bodyExists = await tableBody.count() > 0;
    
    console.log(`Table wrapper found: ${wrapperExists}`);
    console.log(`Table body found: ${bodyExists}`);
    
    if (bodyExists) {
      // Get scroll container dimensions
      const boundingBox = await tableBody.boundingBox();
      console.log('Table body dimensions:', boundingBox);
      
      // Check scroll properties
      const scrollInfo = await tableBody.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollTop: el.scrollTop,
          overflowY: computed.overflowY,
          hasScroll: el.scrollHeight > el.clientHeight,
          maxHeight: computed.maxHeight,
          height: computed.height
        };
      });
      
      console.log('Scroll info:', JSON.stringify(scrollInfo, null, 2));
      
      if (scrollInfo.hasScroll) {
        console.log('✅ Vertical scroll is present');
        
        // Take screenshot before scroll
        await page.screenshot({ path: '/tmp/06-before-scroll.png', fullPage: false });
        console.log('✅ Screenshot saved: 06-before-scroll.png');
        
        // Scroll within the container
        await tableBody.evaluate((el) => {
          el.scrollTop = Math.min(500, el.scrollHeight / 2);
        });
        await page.waitForTimeout(500);
        
        // Take screenshot after scroll
        await page.screenshot({ path: '/tmp/07-after-scroll.png', fullPage: false });
        console.log('✅ Screenshot saved: 07-after-scroll.png');
        
        // Verify scroll actually happened
        const newScrollTop = await tableBody.evaluate(el => el.scrollTop);
        console.log(`Scrolled to position: ${newScrollTop}px`);
        
        if (newScrollTop > 0) {
          console.log('✅ Scroll within container works correctly');
        } else {
          console.log('❌ Scroll did not work - scrollTop is still 0');
        }
      } else {
        console.log('⚠️  No vertical scroll needed - content fits within container');
      }
    }

    // Check if page itself has scroll (which we DON'T want)
    const pageScrollInfo = await page.evaluate(() => {
      return {
        scrollHeight: document.body.scrollHeight,
        clientHeight: window.innerHeight,
        hasPageScroll: document.body.scrollHeight > window.innerHeight
      };
    });
    
    console.log('\nPage scroll info:', JSON.stringify(pageScrollInfo, null, 2));
    
    if (pageScrollInfo.hasPageScroll) {
      console.log('⚠️  WARNING: Page has scroll - content may be extending beyond viewport');
    } else {
      console.log('✅ Page does not have scroll - content contained within viewport');
    }

    // Check for rounded box styling
    const roundedBoxInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll('.ant-table-wrapper');
      const results = [];
      
      tables.forEach((table, index) => {
        const parent = table.closest('[style*="border-radius"], .rounded-box, [class*="rounded"]');
        const computed = window.getComputedStyle(parent || table);
        results.push({
          index,
          borderRadius: computed.borderRadius,
          border: computed.border,
          overflow: computed.overflow,
          hasRoundedParent: !!parent
        });
      });
      
      return results;
    });
    
    console.log('\nRounded box info:', JSON.stringify(roundedBoxInfo, null, 2));

    console.log('\n✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved: error-screenshot.png');
    throw error;
  } finally {
    await browser.close();
  }
})();
