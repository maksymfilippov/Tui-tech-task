import { test } from '@playwright/test';
import { TuiHomePage } from '@/pages/tui/TuiHomePage';
import { TuiSearchResultsPage } from '@/pages/tui/TuiSearchResultsPage';
import { TuiPassengerDetailsPage } from '@/pages/tui/TuiPassengerDetailsPage';
import { TuiHotelDetailsPage } from '@/pages/tui/TuiHotelDetailsPage';
import { TuiFlightsPage } from '@/pages/tui/TuiFlightsPage';
import { TuiSummaryBookingPage } from '../../pages/tui/TuiSummaryBookingPage';
import { firstNameValidationCases } from '../fixtures/passengerValidation.data';

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

    await test.step('Select destination', async () => {
      await homePage.selectRandomDestinationAirport();
    });

    await test.step('Select departure date', async () => {
      await homePage.selectAnyAvailableDepartureDate();
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
      try {
        await flightsPage.continueToPassengers();
      } catch (err) {
        let currentPage = page;
        try {
          const pages = page.context().pages();
          const alive = pages.reverse().find(p => !p.isClosed());
          if (alive) currentPage = alive;
        } catch {}
        const summary = new TuiSummaryBookingPage(currentPage);
        await summary.pageLoaded().catch(async () => {
          await summary.navigate();
        });
        await summary.proceedBooking();
      }
    });

    await test.step('Validate passenger details form', async () => {
      const passengerPage = new TuiPassengerDetailsPage(page);
      await passengerPage.pageLoaded();

      console.log(`\n[TUI] Starting validation tests: ${firstNameValidationCases.length} cases`);

      for (const { description, validationData, expectedErrorText } of firstNameValidationCases) {
        await test.step(`Validate: ${description}`, async () => {
          console.log(`\n--- Test Case: ${description} ---`);
          await passengerPage.personalDetailsValidating(validationData, expectedErrorText);
          console.log(`✓ Validation passed for: ${description}`);
        });
      }
    });
  });
});
