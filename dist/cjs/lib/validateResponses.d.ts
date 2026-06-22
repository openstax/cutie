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
export declare class ResponseValidationError extends Error {
    errors: ValidationError[];
    constructor(errors: ValidationError[]);
}
/**
 * Validate a response submission against interaction constraints defined in the item.
 * Throws ResponseValidationError if any constraints are violated.
 */
export declare function validateSubmission(submission: ResponseData, itemDoc: Document): void;
export {};
