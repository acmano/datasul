# Data TestID Requirements for E2E Tests

This document lists all `data-testid` attributes that need to be added to components for the Cypress E2E tests to work correctly.

## Search Components

### SearchForm.tsx
- `search-input-codigo` - Input field for item code search
- `search-input-descricao` - Input field for description search
- `search-button` - Search button
- `clear-filters` - Clear filters button
- `filter-familia` - Family filter dropdown

### ResultsTable.tsx
- `results-table` - Main results table component
- `results-row` - Each row in the results table (repeated)

## Navigation Components

### Menu/Sidebar
- `menu-lateral` - Lateral menu/sidebar component

### Tabs Component
- `tab-informacoes-gerais` - General information tab
- `tab-dimensoes` - Dimensions tab
- `tab-planejamento` - Planning tab
- `tab-manufatura` - Manufacturing tab
- `tab-fiscal` - Fiscal tab

## Export Components

### ExportButtons.tsx (or similar)
- `export-csv` - CSV export button
- `export-excel` - Excel export button
- `export-pdf` - PDF export button
- `export-print` - Print button

## Error Handling Components

### ErrorDisplay.tsx
- `correlation-id` - Correlation ID display
- `copy-correlation-id` - Copy correlation ID button
- `retry-button` - Retry button

## Rate Limit Components

### RateLimitWarning.tsx (or similar)
- `rate-limit-warning` - Rate limit warning alert
- `rate-limit-countdown` - Countdown timer display
- `close-rate-limit` - Close rate limit warning button
- `rate-limit-badge` - Rate limit badge in header

## Help Components

### HelpModal.tsx
- `help-modal` - Help modal component

## Theme Components

### Body/Theme Toggle
- Add `light-theme` or `dark-theme` class to `<body>` element based on current theme

## Implementation Notes

1. **DO NOT** implement these now - this is for the tester agent
2. Each `data-testid` should be added as an attribute: `data-testid="identifier"`
3. Repeated elements (like `results-row`) should have the same testid on each instance
4. TestIDs should be unique within their context but can repeat across different components

## Example Implementation

```tsx
// SearchForm.tsx
<Input
  data-testid="search-input-codigo"
  placeholder="Código do Item"
  {...otherProps}
/>

<Button
  data-testid="search-button"
  onClick={handleSearch}
>
  Buscar
</Button>

// ResultsTable.tsx
<Table data-testid="results-table">
  {results.map(item => (
    <tr key={item.id} data-testid="results-row">
      {/* row content */}
    </tr>
  ))}
</Table>
```

## Testing Checklist

After adding data-testid attributes, verify:
- [ ] All search inputs are accessible
- [ ] Search and filter buttons work
- [ ] Results table and rows are selectable
- [ ] All tabs are clickable
- [ ] Export buttons are accessible
- [ ] Error handling components display correctly
- [ ] Rate limit components show feedback
- [ ] Keyboard shortcuts work
- [ ] Theme toggling updates body class
