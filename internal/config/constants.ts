// All timeouts in milliseconds
export const TIMEOUTS = {
  COOKIE_BANNER_DELAY: 500,
  COOKIE_CLICK_DELAY: 300,
  DATE_PICKER_OPEN_DELAY: 500,
  FIELD_VALIDATION_DELAY: 500,
  NAVIGATION_BACK_DELAY: 500,
  CHILDREN_SELECTOR_DELAY: 500,
  RETRY_BASE_DELAY: 150,
  DROPDOWN_OPEN_DELAY: 200,
  HOTEL_SELECTION_DELAY: 1500,
  MODAL_VISIBILITY_TIMEOUT: 1000,
  PAGE_NAVIGATION_TIMEOUT: 40_000,
  PAGE_HEADING_TIMEOUT: 20_000,
} as const;

export const COOKIE_SELECTORS = [
  '#__tealiumGDPRecModal',
  '#cmNotifyBanner',
  '[id*="cookie"]',
  '[class*="cookie"]',
  '.privacy_prompt.explicit_consent',
] as const;

export const COOKIE_ACCEPT_PATTERN =
  /accept|agree|ok|continue|got it|understood|akkoord|accepteren|alles accepteren|accepteer|ja|yes|toestaan|allow|accept all|accept cookies|sluiten|close|doorgaan|verder|bevestigen|instemmen|accepteer alle/i;

export const OVERLAY_IDS = ['__tealiumGDPRecModal', 'cmNotifyBanner'] as const;

// Locale-aware selectors for TUI.nl (combine data-test-ids with Dutch text fallbacks)
export const SELECTORS = {
  DEPARTURE_INPUT:
    '.UI__choiceSearchPanel input[name="Departure Airport"], input.SelectAirports__pointer',
  DESTINATION_INPUT:
    '[data-test-id="destination-input"], input[placeholder*="Destination"], input[placeholder*="Hotel"], input[placeholder*="Bestemming"]',
  ROOMS_GUESTS_BUTTON:
    '[aria-label="room and guest"], [aria-label*="Reiziger"], button:has-text("Reiziger"), button:has-text("Reizigers")',
  SEARCH_BUTTON: 'button:has-text("ZOEKEN"), button:has-text("Zoeken"), button:has-text("Search")',
  SUBMIT_BUTTON:
    'button:has-text("Continue"), button:has-text("Ga verder"), button:has-text("Doorgaan"), button[type="submit"], .ProgressbarNavigation__summaryButton button',
} as const;

// Regex patterns for Dutch/English text matching
export const TEXT_PATTERNS = {
  ROOMS_GUESTS: /room and guest|passengers|Reiziger|Reizigers/i,
  ADULTS: /Volwassenen|Adults|Reiziger|Reizigers/i,
  CHILDREN: /Kinderen|Children/i,
  SAVE: /Opslaan|Save|Bewaren/i,
  CLOSE: /Sluiten|Close/i,
  SEARCH: /Zoeken|Search|ZOEKEN/i,
} as const;

export const PASSENGER = {
  MIN_ADULT_AGE: 18,
  MAX_ADULT_AGE: 80,
  MIN_CHILD_AGE: 2,
  MAX_CHILD_AGE: 17,
} as const;
