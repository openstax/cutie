import { Editor } from 'slate';
import { collectExistingResponseIds } from '../plugins/withQtiInteractions';
export { collectExistingResponseIds };
/**
 * Generate a unique response identifier by scanning the editor
 *
 * First interaction gets "RESPONSE", subsequent get "RESPONSE_2", "RESPONSE_3", etc.
 * This ensures compatibility with QTI standard templates (match_correct, map_response)
 * which require the identifier to be exactly "RESPONSE"
 */
export declare function generateUniqueResponseId(editor: Editor): string;
/**
 * Extract all response identifiers from HTML content
 *
 * @param html - HTML content
 * @returns Set of response identifiers found
 */
export declare function extractResponseIds(html: string): Set<string>;
/**
 * Validate that all response identifiers are unique
 *
 * @param html - HTML content
 * @returns Object with validation result and any duplicate IDs found
 */
export declare function validateUniqueIds(html: string): {
    valid: boolean;
    duplicates: string[];
};
