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

    console.log('\n📍 Step 2: Perform a wildcard search to load data');
    // Wait for search form to be visible
    await page.waitForSelector('input[placeholder*="Código"], input[placeholder*="código"]', { timeout: 10000 });
    
    // Fill in a wildcard search to get any results
    const searchInput = await page.locator('input[placeholder*="Código"], input[placeholder*="código"]').first();
    await searchInput.fill('%'); // Use wildcard to get all items
    await page.screenshot({ path: '/tmp/02-search-form-filled.png', fullPage: false });
    console.log('✅ Screenshot saved: 02-search-form-filled.png');
    
    // Click the Buscar button
    const buscarButton = page.locator('button:has-text("Buscar")').first();
    await buscarButton.click();
    console.log('Clicked Buscar button, waiting for results...');
    
    // Wait for results to load with longer timeout
    try {
      await page.waitForSelector('.ant-table-tbody tr', { timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for data to settle
      await page.screenshot({ path: '/tmp/03-search-results.png', fullPage: false });
      console.log('✅ Screenshot saved: 03-search-results.png');
    } catch (e) {
      console.log('⚠️  No results appeared, taking screenshot anyway');
      await page.screenshot({ path: '/tmp/03-no-results.png', fullPage: false });
      
      // Try clicking on an existing result in the dock if available
      console.log('Looking for any existing search results or sample data...');
      await page.screenshot({ path: '/tmp/03b-current-state.png', fullPage: false });
    }

    console.log('\n📍 Step 3: Navigate to Engenharia module');
    // Look for Engenharia menu item
    const menuItems = await page.locator('.ant-menu-item').all();
    let engenhariaFound = false;
    
    for (const item of menuItems) {
      const text = await item.innerText().catch(() => '');
      console.log(`Menu item found: "${text}"`);
      if (text.includes('Engenhar')) {
        await item.click();
        engenhariaFound = true;
        console.log('✅ Clicked Engenharia menu');
        break;
      }
    }
    
    if (!engenhariaFound) {
      console.log('⚠️  Engenharia menu not found by text, trying nth(1)...');
      const secondMenuItem = page.locator('.ant-menu-item').nth(1);
      await secondMenuItem.click();
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/04-engenharia-module.png', fullPage: false });
    console.log('✅ Screenshot saved: 04-engenharia-module.png');

    console.log('\n📍 Step 4: Check available tabs');
    const tabs = await page.locator('.ant-tabs-tab').all();
    console.log(`Found ${tabs.length} tabs`);
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].innerText().catch(() => '');
      console.log(`  Tab ${i}: "${text}"`);
    }

    console.log('\n📍 Step 5: Navigate to Estrutura tab');
    // Click on Estrutura tab
    const estruturaTab = page.locator('.ant-tabs-tab').filter({ hasText: 'Estrutura' }).first();
    const estruturaExists = await estruturaTab.count() > 0;
    
    if (estruturaExists) {
      await estruturaTab.click();
      await page.waitForTimeout(3000); // Wait for tab content to load
      await page.screenshot({ path: '/tmp/05-estrutura-tab-initial.png', fullPage: false });
      console.log('✅ Screenshot saved: 05-estrutura-tab-initial.png');
    } else {
      console.log('⚠️  Estrutura tab not found, trying Onde Usado...');
      const ondeUsadoTab = page.locator('.ant-tabs-tab').filter({ hasText: 'Onde' }).first();
      if (await ondeUsadoTab.count() > 0) {
        await ondeUsadoTab.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/05-onde-usado-tab.png', fullPage: false });
        console.log('✅ Screenshot saved: 05-onde-usado-tab.png');
      }
    }

    console.log('\n📍 Step 6: Analyze scroll container');
    // Find any table on the page
    const tables = await page.locator('.ant-table-wrapper').all();
    console.log(`Found ${tables.length} tables on page`);
    
    if (tables.length > 0) {
      const tableBody = page.locator('.ant-table-body').first();
      const bodyExists = await tableBody.count() > 0;
      
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
          console.log('   This might be because:');
          console.log('   - No data loaded yet');
          console.log('   - Table has few rows that fit on screen');
          console.log('   - maxHeight is not constraining the table');
        }
      }
    } else {
      console.log('⚠️  No tables found on the page');
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

    // Final screenshot
    await page.screenshot({ path: '/tmp/08-final-state.png', fullPage: true });
    console.log('✅ Screenshot saved: 08-final-state.png (full page)');

    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved: error-screenshot.png');
  } finally {
    await browser.close();
  }
})();
