# Cypress E2E Tests - Phase 8

## Overview

This directory contains comprehensive E2E tests for the lor0138 application using Cypress 15.5.0.

## Test Suites

### 1. item-search.cy.ts (8 tests)
Tests the complete item search flow:
- Page loading
- Exact code search
- Wildcard search
- Description search
- Empty results handling
- Family filtering
- Clear filters functionality

### 2. tabs-navigation.cy.ts (9 tests)
Tests navigation between tabs:
- Default tab display
- Navigation to all tabs (Dimensões, Planejamento, Manufatura, Fiscal)
- Data persistence across tabs
- Keyboard shortcuts (Alt+1, Alt+2)

### 3. export.cy.ts (7 tests)
Tests data export functionality:
- Export buttons visibility
- CSV export
- Excel export
- PDF export
- Print preview
- Data correctness in exports

### 4. keyboard-shortcuts.cy.ts (9 tests)
Tests keyboard shortcuts:
- Enter to search
- Ctrl+0 to toggle menu
- Ctrl+1, Ctrl+2 for navigation
- F1 for help
- ESC to close modals
- Ctrl+T for theme toggle

### 5. error-handling.cy.ts (14 tests)
Tests error handling with correlation IDs:
- ErrorDisplay component
- Correlation ID display and copy
- API error toasts
- 404 error handling
- Retry functionality
- Correlation ID in error messages

### 6. rate-limit.cy.ts (15 tests)
Tests rate limit UI feedback:
- 429 error handling
- Countdown timer display
- Retry button state
- Alert close functionality
- Rate limit badge display
- Badge updates after requests

## Total: 62 E2E Tests

## Running Tests

### Open Cypress UI (Interactive Mode)
```bash
cd /home/mano/projetos/datasul/lor0138
npx cypress open
```

### Run All Tests (Headless Mode)
```bash
npx cypress run
```

### Run Specific Test Suite
```bash
npx cypress run --spec cypress/e2e/item-search.cy.ts
npx cypress run --spec cypress/e2e/tabs-navigation.cy.ts
npx cypress run --spec cypress/e2e/export.cy.ts
npx cypress run --spec cypress/e2e/keyboard-shortcuts.cy.ts
npx cypress run --spec cypress/e2e/error-handling.cy.ts
npx cypress run --spec cypress/e2e/rate-limit.cy.ts
```

### Run with Browser Selection
```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

## Configuration

Configuration is in `cypress.config.ts`:
- **Base URL**: http://localhost:3000
- **Viewport**: 1280x720
- **Video**: Disabled (for faster runs)
- **Screenshots**: Enabled on failure
- **Timeouts**: 10s command, 30s response

## Prerequisites

### 1. Start the Application
Before running tests, ensure the dev server is running:
```bash
npm run dev
# or
yarn dev
```

### 2. Add data-testid Attributes
Tests require `data-testid` attributes on components. See `DATA_TESTID_REQUIREMENTS.md` for details.

## Test Structure

Each test suite follows this pattern:
```typescript
describe('Test Suite Name', () => {
  beforeEach(() => {
    cy.visit('/');
    // Common setup
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

## Best Practices

1. **Use data-testid selectors**: More stable than CSS classes or IDs
2. **Intercept API calls**: Use `cy.intercept()` for API mocking
3. **Wait for elements**: Use `.should('be.visible')` instead of fixed waits
4. **Clean state**: Each test starts from home page with `beforeEach()`
5. **Descriptive names**: Test names in Portuguese matching requirements

## CI/CD Integration

To run in CI/CD:
```bash
# Install dependencies
npm ci

# Run tests headless
npx cypress run --browser chrome --headless

# Generate reports (if configured)
npx cypress run --reporter mochawesome
```

## Debugging

### Failed Tests
- Screenshots are automatically saved to `cypress/screenshots/`
- Check console output for detailed error messages
- Use `cy.pause()` in tests to debug interactively

### Slow Tests
- Increase timeouts in `cypress.config.ts` if needed
- Check network tab for slow API calls
- Verify application performance

## Common Issues

### Tests Can't Find Elements
- Check if `data-testid` attributes are added
- Verify element is rendered (check with browser DevTools)
- Ensure application is running on correct port

### Timeout Errors
- Increase timeout in config or specific command
- Check if API is responding
- Verify network connectivity

### Flaky Tests
- Add proper waits (`.should('be.visible')`)
- Avoid fixed `cy.wait(1000)`
- Use `cy.intercept()` to wait for API responses

## Next Steps

1. Add `data-testid` attributes to components (see DATA_TESTID_REQUIREMENTS.md)
2. Run tests to verify functionality
3. Fix any failing tests
4. Add tests to CI/CD pipeline
5. Monitor test coverage

## Coverage

These tests cover:
- ✅ Search functionality (exact, wildcard, description)
- ✅ Navigation (tabs, menu, keyboard shortcuts)
- ✅ Export (CSV, Excel, PDF, Print)
- ✅ Error handling (ErrorDisplay, correlation IDs)
- ✅ Rate limiting (UI feedback, countdown, badges)
- ✅ Keyboard shortcuts (Alt, Ctrl, F1, ESC)
- ✅ Theme toggling
- ✅ Help system

## Maintenance

- Update tests when UI changes
- Keep data-testid attributes synchronized
- Review test performance regularly
- Add tests for new features
