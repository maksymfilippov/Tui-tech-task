import { test } from '@playwright/test';
import { TuiHomePage } from '@/pages/tui/TuiHomePage';
import { TuiSearchResultsPage } from '@/pages/tui/TuiSearchResultsPage';
import { TuiPassengerDetailsPage } from '@/pages/tui/TuiPassengerDetailsPage';
import { TuiHotelDetailsPage } from '@/pages/tui/TuiHotelDetailsPage';
import { TuiFlightsPage } from '@/pages/tui/TuiFlightsPage';
import {
  FIRST_NAME_VALIDATION,
  LAST_NAME_VALIDATION,
  EMAIL_VALIDATION,
  PHONE_VALIDATION,
  DATE_OF_BIRTH_VALIDATION,
} from '../data/ValidationTestCaseFactory';

const MAX_BOOKING_FLOW_RETRIES = 3;

const VALIDATION_FIELDS = [
  { name: 'firstName', tests: FIRST_NAME_VALIDATION },
  { name: 'lastName', tests: LAST_NAME_VALIDATION },
  { name: 'email', tests: EMAIL_VALIDATION },
  { name: 'phone', tests: PHONE_VALIDATION },
  { name: 'dateOfBirth', tests: DATE_OF_BIRTH_VALIDATION },
] as const;

async function validatePassengerFields(passengerPage: TuiPassengerDetailsPage) {
  await passengerPage.pageLoaded();

  for (const field of VALIDATION_FIELDS) {
    for (const testCase of field.tests) {
      console.log(`Testing ${field.name}: ${testCase.description}`);
      await passengerPage.validateField(field.name, testCase.value, testCase.expectedError);
    }
  }

  console.log('All field validations passed!');
}

async function executeBookingFlow(
  attempt: number,
  homePage: TuiHomePage,
  resultsPage: TuiSearchResultsPage,
  page: import('@playwright/test').Page
) {
  await test.step(`Attempt ${attempt}: Select departure airport`, async () => {
    await homePage.selectRandomDepartureAirportNL();
  });

  await test.step(`Attempt ${attempt}: Select destination and date`, async () => {
    await homePage.selectDestinationAndDateWithRetry();
  });

  await test.step(`Attempt ${attempt}: Set rooms & guests`, async () => {
    await homePage.roomsAndGuests.setTwoAdultsWithRandomChild();
  });

  await test.step(`Attempt ${attempt}: Search holidays`, async () => {
    await homePage.search();
  });

  await test.step(`Attempt ${attempt}: Open first hotel`, async () => {
    await resultsPage.openFirstHotel();
  });

  await test.step(`Attempt ${attempt}: Continue to booking summary`, async () => {
    const hotelPage = new TuiHotelDetailsPage(page);
    await hotelPage.proceedBooking();
  });

  await test.step(`Attempt ${attempt}: Select flights`, async () => {
    const flightsPage = new TuiFlightsPage(page);
    await flightsPage.continueToPassengersOrSummary();
  });

  await test.step(`Attempt ${attempt}: Validate passenger fields`, async () => {
    const passengerPage = new TuiPassengerDetailsPage(page);
    await validatePassengerFields(passengerPage);
  });
}

test.describe('TUI beach holiday booking', () => {
  test('[E2E] Booking flow with validation on passenger details', async ({ page }) => {
    const homePage = new TuiHomePage(page);
    const resultsPage = new TuiSearchResultsPage(page);

    await test.step('Open homepage & prepare', async () => {
      await homePage.open();
      await homePage.acceptCookiesIfPresent();
    });

    let bookingFlowSuccess = false;
    let attempt = 0;

    // eslint-disable-next-line playwright/no-conditional-in-test
    while (!bookingFlowSuccess && attempt < MAX_BOOKING_FLOW_RETRIES) {
      attempt++;
      console.log(`\nBooking flow attempt ${attempt}/${MAX_BOOKING_FLOW_RETRIES}`);

      try {
        await executeBookingFlow(attempt, homePage, resultsPage, page);
        bookingFlowSuccess = true;
        console.log(`Booking flow succeeded on attempt ${attempt}`);
      } catch (error) {
        console.log(`Booking flow failed on attempt ${attempt}: ${error}`);

        // eslint-disable-next-line playwright/no-conditional-in-test
        if (attempt < MAX_BOOKING_FLOW_RETRIES) {
          console.log('Restarting with new search criteria...');
          await homePage.open();
        } else {
          console.log(`All ${MAX_BOOKING_FLOW_RETRIES} attempts failed`);
          throw error;
        }
      }
    }
  });
});
