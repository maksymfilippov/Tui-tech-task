// Navigation timeouts (TUI.nl can be slow)
export const TIMEOUTS = {
  NAVIGATION: 30_000,
  PAGE_LOAD: 15_000,
} as const;

// Selectors for TUI.nl - primary with minimal fallbacks
export const SELECTORS = {
  DEPARTURE_INPUT:
    '.UI__choiceSearchPanel input[name="Departure Airport"], input.SelectAirports__pointer',
  DESTINATION_INPUT: 'input[placeholder*="Bestemming"]',
  ROOMS_GUESTS_BUTTON: '[aria-label*="Reiziger"]',
  SEARCH_BUTTON: 'button:has-text("Zoeken")',
  SUBMIT_BUTTON: 'button[type="submit"]',
} as const;

// Text patterns for TUI.nl (Dutch locale)
export const TEXT_PATTERNS = {
  ROOMS_GUESTS: /Reiziger|Reizigers/i,
  ADULTS: /Volwassenen/i,
  CHILDREN: /Kinderen/i,
  SAVE: /Opslaan/i,
  CLOSE: /Sluiten/i,
  SEARCH: /Zoeken/i,
} as const;

export const PASSENGER = {
  MIN_ADULT_AGE: 18,
  MAX_ADULT_AGE: 80,
  MIN_CHILD_AGE: 2,
  MAX_CHILD_AGE: 17,
} as const;
