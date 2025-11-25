# TUI Playwright Framework

Modern Playwright E2E testing framework for TUI booking flow with TypeScript and Page Object Model.

## Features

- **Page Object Model** - Clean separation of concerns
- **Automatic retry logic** - Handles TUI.nl booking flow instability
- **Comprehensive validation** - 18 test cases for passenger form fields
- **Type-safe** - Full TypeScript coverage
- **Centralized configuration** - All selectors, patterns in one place
- **Locale-aware** - Dutch text matching with regex patterns

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
internal/
  config/
    constants.ts           # Timeouts, selectors, patterns
    variables.ts           # Environment variables

pages/
  core/
    Fragment.ts            # Base class: typed locators + autosteps
    Component.ts           # UI components with root & helpers
  BasePage.ts            # Navigation + cookies/modals handling
    WithSteps.ts           # Auto test.step() decorator
    objectToLocator.ts     # Converts locator object → Locator API

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
  data/
    validationTestCases.json        # JSON with all validation test cases
    ValidationTestCaseFactory.ts    # Factory for validation tests
  types/
    PassengerData.ts                # TypeScript interfaces
  ui/
    tui-beach-booking.spec.ts       # Main E2E test

storage/
  tui-region.json
```

## Architecture

The framework uses a three-tier hierarchy:

```
Fragment (pages/core/Fragment.ts)
    ├── Component (pages/core/Component.ts)
    │   └── UI Components (pages/components/)
    │       ├── TuiDepartureAirport
    │       ├── TuiDepartureDate
    │       ├── TuiDestinationAirport
    │       └── TuiRoomsAndGuests
    │
    └── BasePage (pages/core/BasePage.ts)
        └── Page Objects (pages/tui/)
            ├── TuiHomePage
            ├── TuiSearchResultsPage
            ├── TuiHotelDetailsPage
            ├── TuiFlightsPage
            ├── TuiPassengerDetailsPage
            └── TuiSummaryBookingPage
```

### Fragment (`pages/core/Fragment.ts`)

Base class for all page objects and components:

- Typed locator model (object with typed locators)
- Converts string locators → Playwright Locator
- Wraps all async methods in `test.step` (via `WithSteps`)
- Provides low-level element helpers

### Component (`pages/core/Component.ts`)

Extends `Fragment` for reusable UI widgets:

- Has `root: Locator` for scoped locators
- Provides UI-level APIs: `click()`, `fill()`, `waitVisible()`, `getText()`, `isVisible()`
- Used for reusable UI components (airport picker, date selector, rooms & guests)

### BasePage (`pages/core/BasePage.ts`)

Extends `Fragment` for page-level behavior:

- Navigation (`open()`)
- Handles cookies and modals
- Each page компoses multiple components into a real booking flow

### Test Data Management

- **ValidationTestCaseFactory**: Factory pattern for validation test cases
  - Single source of truth: `validationTestCases.json`
  - 18 validation test cases across 5 fields:
    - First name (3 cases): too short, numbers, special chars
    - Last name (3 cases): too short, numbers, special chars
    - Email (5 cases): missing @, domain, local part, TLD, consecutive dots
    - Phone (4 cases): too short, letters, special chars, country code only
    - Date of birth (3 cases): invalid day, month, format
  - Exported constants: `FIRST_NAME_VALIDATION`, `LAST_NAME_VALIDATION`, etc.
  - Methods: `getTestCasesForField()`, `getAllTestCases()`, `getTestCasesByPattern()`

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
  }
}
```

## Test Scenario: TUI Beach Holiday Booking

The E2E test performs:

1. **Open homepage & prepare** - Accept cookies, close modals
2. **Select departure airport** - Random Dutch airport
3. **Select destination and date** - With automatic retry on failure
4. **Set rooms & guests** - 2 adults + 1 child (random age 2-15)
5. **Search holidays** - Submit search form
6. **Open first hotel** - From search results
7. **Continue to flights** - From hotel details
8. **Select flights** - Continue to passengers or summary (with fallback)
9. **Validate passenger form** - Test all 18 validation cases:
   - First name validation (3 cases)
   - Last name validation (3 cases)
   - Email validation (5 cases)
   - Phone validation (4 cases)
   - Date of birth validation (3 cases)

This is a full real-world booking journey with comprehensive form validation.

## Storage State

Framework supports Playwright `storageState`:

- Saves cookies, region settings, preferences
- Stored in `storage/tui-region.json`

```typescript
const context = await browser.newContext({
  storageState: 'storage/tui-region.json',
});
```
