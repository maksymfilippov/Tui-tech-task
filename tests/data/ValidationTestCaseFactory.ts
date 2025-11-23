import validationData from './validationTestCases.json';

export interface ValidationTestCase {
  field: string;
  value: string;
  expectedError: string;
  description: string;
}

export type ValidatedField = keyof typeof validationData;

export class ValidationTestCaseFactory {
  static getTestCasesForField(field: ValidatedField): ValidationTestCase[] {
    const cases = validationData[field];
    return cases.map(testCase => ({
      field,
      ...testCase,
    }));
  }

  static getAllTestCases(): Record<ValidatedField, ValidationTestCase[]> {
    const result = {} as Record<ValidatedField, ValidationTestCase[]>;

    (Object.keys(validationData) as ValidatedField[]).forEach(field => {
      result[field] = this.getTestCasesForField(field);
    });

    return result;
  }

  static getTestCasesByPattern(pattern: RegExp): ValidationTestCase[] {
    const allCases = this.getAllTestCases();
    const result: ValidationTestCase[] = [];

    Object.values(allCases).forEach(fieldCases => {
      fieldCases.forEach(testCase => {
        if (pattern.test(testCase.description)) {
          result.push(testCase);
        }
      });
    });

    return result;
  }
}

export const FIRST_NAME_VALIDATION = ValidationTestCaseFactory.getTestCasesForField('firstName');
export const LAST_NAME_VALIDATION = ValidationTestCaseFactory.getTestCasesForField('lastName');
export const EMAIL_VALIDATION = ValidationTestCaseFactory.getTestCasesForField('email');
export const PHONE_VALIDATION = ValidationTestCaseFactory.getTestCasesForField('phone');
export const DATE_OF_BIRTH_VALIDATION =
  ValidationTestCaseFactory.getTestCasesForField('dateOfBirth');
