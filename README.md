# TUI Playwright Framework

Modern Playwright E2E testing framework for TUI booking flow with TypeScript and Page Object Model.

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
npx playwright install
```

### Environment Setup

Create `.env`:

```env
CONNECTION_STRING_APP=https://www.tui.nl
ENV_NAME=LOCAL
```

## Running Tests

```bash
npm test                     # Run all tests
npm test -- --headed         # Run in headed mode
npm test -- --debug          # Debug mode
npm test -- --ui             # Playwright UI mode
```

Run a specific test:

```bash
npx playwright test tests/ui/tui-beach-booking.spec.ts
```

## Development Commands

```bash
npm run typecheck            # TypeScript checking
npm run lint                 # Lint sources
npm run lint:fix             # Auto-fix
npm run format               # Prettier formatting
npm run format:check         # Verify formatting
npm run clear                # Remove reports and storage
```

## Reports & Debugging

```bash
npx playwright show-report              # HTML report
npx playwright show-trace trace.zip     # Trace viewer
npx playwright codegen https://www.tui.nl
```

## Project Structure

```
pages/
  core/
    Fragment.ts             # Base class: typed locators + autosteps
    Component.ts            # UI components with root & helpers
    BasePage.ts             # Navigation + network idle + cookies/modals handling
    NetworkCounter.ts       # Network idle detection
    WithSteps.ts            # Auto test.step() decorator
    objectToLocator.ts      # Converts locator object → Locator API

  components/
    TuiDepartureAirport.ts
    TuiDestinationAirport.ts
    TuiDepartureDate.ts
    TuiRoomsAndGuests.ts

  tui/
    TuiHomePage.ts
    TuiSearchResultsPage.ts
    TuiHotelDetailsPage.ts
    TuiFlightsPage.ts
    TuiPassengerDetailsPage.ts
    TuiSummaryBookingPage.ts

  utils/
    inputUtils.ts
    random.ts
    stepDecorator.ts

tests/
  ui/
    tui-beach-booking.spec.ts
  fixtures/
    passengerValidation.data.ts

storage/
  tui-region.json
```

## Architecture

```
Fragment
├── Component        // UI widgets
│    ├── TuiDepartureAirport
│    ├── TuiDepartureDate
│    ├── TuiDestinationAirport
│    └── TuiRoomsAndGuests
└── BasePage         // Page-level behavior
     ├── TuiHomePage
     ├── TuiSearchResultsPage
     ├── TuiHotelDetailsPage
     ├── TuiFlightsPage
     ├── TuiPassengerDetailsPage
     └── TuiSummaryBookingPage
```

### Fragment

- Typed locator model (object with typed locators)
- Converts string locators → Playwright Locator
- Wraps all async methods in `test.step` (via `WithSteps`)
- Provides low-level element helpers

### Component

- Inherits `Fragment`
- Has `root: Locator`
- Provides UI-level APIs: `click()`, `fill()`, `waitVisible()`, `getText()`, `isVisible()` …
- Used to build reusable UI widgets (airport picker, date selector, rooms & guests)

### BasePage

- Inherits `Fragment`
- Handles page-wide behavior:
  - navigation (`open()`)
  - network idle (`waitNetworkIdle()`)
  - closing cookie banners, overlays, newsletter popups
  - page preparation (`preparePage()`)

Each page composes multiple components into a real booking flow.

## Extending the Framework

### Create a new Component

```typescript
const locators = {
  root: '.my-component',
  button: '.my-button',
  input: '.my-input',
};

export class MyComponent extends Component<typeof locators> {
  constructor(page: Page) {
    super(locators, page);
  }
}
```

### Create a new Page

```typescript
const locators = {
  header: '.header',
  content: '.content',
};

export class MyPage extends BasePage<typeof locators> {
  private myComponent: MyComponent;

  constructor(page: Page) {
    super(locators, page);
    this.myComponent = new MyComponent(page);
  }

  async open() {
    await this.page.goto('/my-page');
    await this.preparePage();
  }
}
```

## Test Scenario: TUI Beach Holiday Booking

The E2E test performs:

1. Open homepage & prepare environment
2. Accept cookies
3. Select departure + destination
4. Pick date
5. Configure rooms & guests
6. Search for holidays
7. Select hotel
8. Select flights
9. Go to passenger details
10. Validate passenger form inputs
11. Navigate to summary

This is a full real-world booking journey.

## Storage State

Framework supports Playwright `storageState`:

- Saves cookies, region settings, preferences
- Stored in `storage/tui-region.json`

```typescript
const context = await browser.newContext({
  storageState: 'storage/tui-region.json',
});
```
