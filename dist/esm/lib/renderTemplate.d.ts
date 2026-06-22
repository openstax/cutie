import { AttemptState, ProcessingOptions } from '../types';
/**
 * Renders a sanitized QTI template for client consumption.
 *
 * This function:
 * 1. Substitutes template and outcome variable values into the item body
 * 2. Applies conditional visibility rules based on current state
 * 3. Shows/hides feedback elements based on outcome variables
 * 4. Strips sensitive content that should not be exposed to the client:
 *    - qti-template-declaration elements
 *    - qti-template-processing rules
 *    - qti-response-processing rules
 *    - qti-correct-response, qti-mapping from response declarations
 *    - Response declarations not used in the filtered body
 *    - Hidden feedback that shouldn't be visible yet
 * 5. Injects current response values as qti-default-value elements
 * 6. Optionally resolves asset URLs via provided callback
 * 7. Serializes the sanitized document to XML string
 *
 * This runs after both initializeState and processResponse to generate
 * the template that the client will render.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param state - Current attempt state with variable values
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to sanitized QTI XML string safe for client rendering
 */
export declare function renderTemplate(itemDoc: Document, state: AttemptState, options?: ProcessingOptions): Promise<string>;
