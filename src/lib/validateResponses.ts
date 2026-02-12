import type { ResponseData } from '../types';

interface ValidationError {
  responseIdentifier: string;
  constraint: string;
  message: string;
}

/**
 * Error thrown when submitted responses violate interaction constraints.
 * Contains structured error details for each violated constraint.
 */
export class ResponseValidationError extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const messages = errors.map((e) => `${e.responseIdentifier}: ${e.message}`);
    super(`Response validation failed: ${messages.join('; ')}`);
    this.name = 'ResponseValidationError';
    this.errors = errors;
  }
}

/**
 * Validate a response submission against interaction constraints defined in the item.
 * Throws ResponseValidationError if any constraints are violated.
 */
export function validateSubmission(submission: ResponseData, itemDoc: Document): void {
  const errors: ValidationError[] = [];

  validateChoiceInteractions(submission, itemDoc, errors);
  validateTextEntryInteractions(submission, itemDoc, errors);
  validateExtendedTextInteractions(submission, itemDoc, errors);
  validateInlineChoiceInteractions(submission, itemDoc, errors);
  validateGapMatchInteractions(submission, itemDoc, errors);
  validateMatchInteractions(submission, itemDoc, errors);

  if (errors.length > 0) {
    throw new ResponseValidationError(errors);
  }
}

function validateChoiceInteractions(
  submission: ResponseData,
  itemDoc: Document,
  errors: ValidationError[]
): void {
  const interactions = itemDoc.getElementsByTagName('qti-choice-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i]!;
    const responseIdentifier = interaction.getAttribute('response-identifier');
    if (!responseIdentifier) continue;

    const response = submission[responseIdentifier];
    const selectedCount = getSelectedCount(response);

    // Check min-choices
    const minChoicesAttr = interaction.getAttribute('min-choices');
    if (minChoicesAttr) {
      const minChoices = parseInt(minChoicesAttr, 10);
      if (!isNaN(minChoices) && minChoices > 0 && selectedCount < minChoices) {
        errors.push({
          responseIdentifier,
          constraint: 'min-choices',
          message: `Expected at least ${minChoices} choice(s), got ${selectedCount}`,
        });
      }
    }

    // Check max-choices
    const maxChoicesAttr = interaction.getAttribute('max-choices');
    if (maxChoicesAttr) {
      const maxChoices = parseInt(maxChoicesAttr, 10);
      if (!isNaN(maxChoices) && maxChoices > 0 && selectedCount > maxChoices) {
        errors.push({
          responseIdentifier,
          constraint: 'max-choices',
          message: `Expected at most ${maxChoices} choice(s), got ${selectedCount}`,
        });
      }
    }
  }
}

function getSelectedCount(response: unknown): number {
  if (response == null) return 0;
  if (Array.isArray(response)) return response.length;
  return 1;
}

function validateTextEntryInteractions(
  submission: ResponseData,
  itemDoc: Document,
  errors: ValidationError[]
): void {
  const interactions = itemDoc.getElementsByTagName('qti-text-entry-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i]!;
    const responseIdentifier = interaction.getAttribute('response-identifier');
    if (!responseIdentifier) continue;

    const patternMask = interaction.getAttribute('pattern-mask');
    if (!patternMask) continue;

    const value = String(submission[responseIdentifier] ?? '');
    if (!new RegExp(patternMask).test(value)) {
      errors.push({
        responseIdentifier,
        constraint: 'pattern-mask',
        message: `Value does not match pattern "${patternMask}"`,
      });
    }
  }
}

function validateExtendedTextInteractions(
  submission: ResponseData,
  itemDoc: Document,
  errors: ValidationError[]
): void {
  const interactions = itemDoc.getElementsByTagName('qti-extended-text-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i]!;
    const responseIdentifier = interaction.getAttribute('response-identifier');
    if (!responseIdentifier) continue;

    const minStringsAttr = interaction.getAttribute('min-strings');
    if (!minStringsAttr) continue;

    const minStrings = parseInt(minStringsAttr, 10);
    if (isNaN(minStrings) || minStrings <= 0) continue;

    const value = String(submission[responseIdentifier] ?? '').trim();
    if (value.length === 0) {
      errors.push({
        responseIdentifier,
        constraint: 'min-strings',
        message: `Expected at least ${minStrings} non-empty string(s), got 0`,
      });
    }
  }
}

function validateInlineChoiceInteractions(
  submission: ResponseData,
  itemDoc: Document,
  errors: ValidationError[]
): void {
  const interactions = itemDoc.getElementsByTagName('qti-inline-choice-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i]!;
    const responseIdentifier = interaction.getAttribute('response-identifier');
    if (!responseIdentifier) continue;

    const required = interaction.getAttribute('required') === 'true';
    const minChoicesAttr = interaction.getAttribute('min-choices');
    const minChoices = minChoicesAttr ? parseInt(minChoicesAttr, 10) : 0;
    const isConstrained = required || (!isNaN(minChoices) && minChoices >= 1);

    if (!isConstrained) continue;

    const value = submission[responseIdentifier];
    if (value == null || String(value).trim().length === 0) {
      errors.push({
        responseIdentifier,
        constraint: required ? 'required' : 'min-choices',
        message: 'A selection is required',
      });
    }
  }
}

function validateGapMatchInteractions(
  submission: ResponseData,
  itemDoc: Document,
  errors: ValidationError[]
): void {
  const interactions = itemDoc.getElementsByTagName('qti-gap-match-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i]!;
    const responseIdentifier = interaction.getAttribute('response-identifier');
    if (!responseIdentifier) continue;

    const response = submission[responseIdentifier];
    const count = getSelectedCount(response);

    const minAttr = interaction.getAttribute('min-associations');
    if (minAttr) {
      const min = parseInt(minAttr, 10);
      if (!isNaN(min) && min > 0 && count < min) {
        errors.push({
          responseIdentifier,
          constraint: 'min-associations',
          message: `Expected at least ${min} association(s), got ${count}`,
        });
      }
    }

    const maxAttr = interaction.getAttribute('max-associations');
    if (maxAttr) {
      const max = parseInt(maxAttr, 10);
      if (!isNaN(max) && max > 0 && count > max) {
        errors.push({
          responseIdentifier,
          constraint: 'max-associations',
          message: `Expected at most ${max} association(s), got ${count}`,
        });
      }
    }
  }
}

function validateMatchInteractions(
  submission: ResponseData,
  itemDoc: Document,
  errors: ValidationError[]
): void {
  const interactions = itemDoc.getElementsByTagName('qti-match-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i]!;
    const responseIdentifier = interaction.getAttribute('response-identifier');
    if (!responseIdentifier) continue;

    const response = submission[responseIdentifier];
    const count = getSelectedCount(response);

    const minAttr = interaction.getAttribute('min-associations');
    if (minAttr) {
      const min = parseInt(minAttr, 10);
      if (!isNaN(min) && min > 0 && count < min) {
        errors.push({
          responseIdentifier,
          constraint: 'min-associations',
          message: `Expected at least ${min} association(s), got ${count}`,
        });
      }
    }

    const maxAttr = interaction.getAttribute('max-associations');
    if (maxAttr) {
      const max = parseInt(maxAttr, 10);
      if (!isNaN(max) && max > 0 && count > max) {
        errors.push({
          responseIdentifier,
          constraint: 'max-associations',
          message: `Expected at most ${max} association(s), got ${count}`,
        });
      }
    }
  }
}
