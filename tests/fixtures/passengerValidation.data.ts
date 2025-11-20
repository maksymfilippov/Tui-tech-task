import { PassengerDetailsData } from '@/pages/tui/TuiPassengerDetailsPage';

export interface ValidationTestCase {
  description: string;
  validationData: PassengerDetailsData;
  expectedErrorText: string;
}

export const firstNameValidationCases: ValidationTestCase[] = [
  {
    description: 'Special characters and numbers in first name',
    validationData: { Adult1: { firstName: '12345!$%^' } },
    expectedErrorText: 'Gebruik tussen de 2 en 32 letters. Geen cijfers of speciale tekens.',
  },
  {
    description: 'First name exceeds maximum length (over 32 characters)',
    validationData: {
      Adult1: { firstName: 'MaksymFilippovWithVeryLongNameThatExceedsMaximumAllowedLength' },
    },
    expectedErrorText: 'Gebruik tussen de 2 en 32 letters. Geen cijfers of speciale tekens.',
  },
  {
    description: 'First name with only whitespace',
    validationData: { Adult1: { firstName: ' ' } },
    expectedErrorText: 'Vul de voornaam in (volgens paspoort)',
  },
  {
    description: 'Empty first name',
    validationData: { Adult1: { firstName: '' } },
    expectedErrorText: 'Vul de voornaam in (volgens paspoort)',
  },
  {
    description: 'First name with single character (below minimum)',
    validationData: { Adult1: { firstName: 'A' } },
    expectedErrorText: 'Gebruik tussen de 2 en 32 letters. Geen cijfers of speciale tekens.',
  },
];
