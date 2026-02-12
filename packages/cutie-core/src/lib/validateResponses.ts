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
