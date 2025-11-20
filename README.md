# TUI Beach Holiday Booking - E2E Tests

Playwright-based end-to-end testing framework for TUI holiday booking flow with automated validation.

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install
```

4. Configure environment variables:

Create a `.env` file in the root directory:

```env
CONNECTION_STRING_APP=https://www.tui.nl
CONNECTION_STRING_API=https://api.tui.nl
ENV_NAME=LOCAL
```

## Running Tests

### Run all tests (headless mode)

```bash
npx playwright test
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test tests/ui/tui-beach-booking.spec.ts
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

## Viewing Results

### HTML Report

After test execution, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test execution results
- Screenshots on failure
- Video recordings
- Step-by-step execution details

### Trace Viewer

To analyze test execution with detailed trace:

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

Trace viewer provides:
- Network activity
- Console logs
- DOM snapshots
- Action timeline
- Screenshots at each step

### View specific test trace

```bash
# Example path from test results
npx playwright show-trace test-results/ui-tui-beach-booking-TUI-b-a54d2-dation-on-passenger-details-e2e-ui/trace.zip
```

## Debugging & Development

### Playwright Inspector

Debug tests step-by-step:

```bash
npx playwright test --debug
```

### Validate UI Selectors

Use Playwright's codegen to inspect and validate selectors:

```bash
npx playwright codegen https://www.tui.nl
```

This opens:
- A browser window to interact with the site
- Inspector showing generated selectors
- Record/pause functionality

### Pick Locator (in existing browser)

```bash
npx playwright codegen --target=csharp https://www.tui.nl
```

Or from within test:

```typescript
await page.pause(); // Pauses execution and opens inspector
```

## Config

Just handles env variables via `dotenv` library.

Available environment variables:
- `CONNECTION_STRING_APP` - TUI website URL
- `CONNECTION_STRING_API` - TUI API URL (for future use)
- `ENV_NAME` - Environment name (DEV/QA/LOCAL)
- `CI` - CI environment flag

## Pages

Structure: `Fragment` -> `Component` -> `Page`

- **Fragment**: atomic entity, contains:
  - converter of string locators to `playwright page.locator`
  - decorator to wrap ALL async methods into `test.step` with meaningful name
  - network listener that waits until network requests and responses to match
- **Component**: all above + multiple fragments
- **Page**: all above + components required for specific page

## Test Scenario: TUI Beach Holiday Booking

The main E2E test (`tests/ui/tui-beach-booking.spec.ts`) covers the following flow:

1. **Open the homepage** - Navigate to TUI homepage and handle initial setup
2. **Accept the cookies pop-up** - Handle GDPR consent banner
3. **Select a random available departure airport** - Choose from available NL airports
4. **Select a random available destination airport** - Pick random country and city
5. **Select an available departure date** - Choose from available dates in the calendar
6. **Configure "Rooms & Guests"** - Set 2 adults and 1 child (child age randomly selected from 2-15 years)
7. **Search for holidays** - Submit the search form
8. **Pick the first available hotel** - Select first hotel from search results
9. **Continue from hotel details page** - Navigate to flight selection
10. **Select available flights** - Choose outbound and inbound flights
11. **Navigate to Passenger details page** - Proceed to passenger information form
12. **Validate passenger details form** - Test error messages for invalid inputs:
    - Special characters and numbers in first name
    - First name exceeding maximum length (over 32 characters)
    - First name with only whitespace
    - Empty first name
    - First name with single character (below minimum)

### Key Components

- **TuiHomePage** - Homepage with search functionality
- **TuiSearchResultsPage** - Hotel search results
- **TuiHotelDetailsPage** - Hotel details and booking
- **TuiFlightsPage** - Flight selection
- **TuiPassengerDetailsPage** - Passenger information and validation
- **TuiRoomsAndGuests** - Component for selecting travelers and room configuration

### Utilities

- **random** (`pages/utils/random.ts`) - Helper functions for random selection:
  - `getRandomInt(min, max)` - Generate random integers
  - `pickRandom<T>(items)` - Pick random item from array

## Storage State

The project uses Playwright's storage state feature to persist browser context:

- **`storage/tui-region.json`** - Stores cookies and session data for TUI region
- This can be used to skip authentication/setup steps in future test runs
- Useful for maintaining region-specific cookies and preferences

To use storage state in tests:

```typescript
// Load existing storage state
const context = await browser.newContext({
  storageState: 'storage/tui-region.json'
});

// Save storage state after setup
await context.storageState({ path: 'storage/tui-region.json' });
```
