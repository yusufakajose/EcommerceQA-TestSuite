# Test Environment Setup

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run install:browsers
   ```

3. Set up test environment:
   ```bash
   npm run setup:test-env
   ```

4. Run tests:
   ```bash
   npm run test:ui:dev
   ```

## Environment-Specific Testing

- Development: `npm run test:ui:dev`
- Staging: `npm run test:ui:staging`
- Production: `npm run test:ui:prod`

## Browser-Specific Testing

- Chrome: `npm run test:ui:chrome`
- Firefox: `npm run test:ui:firefox`
- Safari: `npm run test:ui:safari`

## Device-Specific Testing

- Mobile: `npm run test:ui:mobile`
- Desktop: `npm run test:ui:desktop`

## Reports

- Open latest report: `npm run report:open`
- Open development report: `npm run report:open:dev`
- Open staging report: `npm run report:open:staging`

## Cleanup

- Clean reports: `npm run clean:reports`
- Clean screenshots: `npm run clean:screenshots`
