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

test.describe('TUI beach holiday booking', () => {
  test('[E2E] Booking flow with validation on passenger details', async ({ page }) => {
    const homePage = new TuiHomePage(page);
    const resultsPage = new TuiSearchResultsPage(page);

    await test.step('Open homepage & prepare', async () => {
      await homePage.open();
      await homePage.ensureReady();
    });

    await test.step('Select departure airport', async () => {
      await homePage.selectRandomDepartureAirportNL();
    });

    await test.step('Select destination and date', async () => {
      await homePage.selectDestinationAndDateWithRetry();
    });

    await test.step('Set rooms & guests (2 adults, 1 child)', async () => {
      await homePage.roomsAndGuests.setTwoAdultsWithRandomChild();
    });

    await test.step('Search holidays', async () => {
      await homePage.search();
    });

    await test.step('Open first hotel from results', async () => {
      await resultsPage.openFirstHotel();
    });

    await test.step('Continue from hotel page to flights', async () => {
      const hotelPage = new TuiHotelDetailsPage(page);
      await hotelPage.continueToFlights();
    });

    await test.step('Select available flights and continue', async () => {
      const flightsPage = new TuiFlightsPage(page);
      await flightsPage.continueToPassengersOrSummary();
    });

    await test.step('Validate passenger form fields', async () => {
      const passengerPage = new TuiPassengerDetailsPage(page);
      await passengerPage.pageLoaded();

      for (const testCase of FIRST_NAME_VALIDATION) {
        console.log(`Testing firstName: ${testCase.description}`);
        await passengerPage.validateField('firstName', testCase.value, testCase.expectedError);
      }

      for (const testCase of LAST_NAME_VALIDATION) {
        console.log(`Testing lastName: ${testCase.description}`);
        await passengerPage.validateField('lastName', testCase.value, testCase.expectedError);
      }

      for (const testCase of EMAIL_VALIDATION) {
        console.log(`Testing email: ${testCase.description}`);
        await passengerPage.validateField('email', testCase.value, testCase.expectedError);
      }

      for (const testCase of PHONE_VALIDATION) {
        console.log(`Testing phone: ${testCase.description}`);
        await passengerPage.validateField('phone', testCase.value, testCase.expectedError);
      }

      for (const testCase of DATE_OF_BIRTH_VALIDATION) {
        console.log(`Testing dateOfBirth: ${testCase.description}`);
        await passengerPage.validateField('dateOfBirth', testCase.value, testCase.expectedError);
      }

      console.log('All field validations passed!');
    });
  });
});
