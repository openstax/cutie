/* spell-checker: ignore parsererror */
import type { ParsedQtiItem } from '../types';

/**
 * Parse QTI XML string into a structured format
 */
export function parseQtiXml(xmlString: string): ParsedQtiItem {
  // Parse XML using native DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Check for parser errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(
      `XML parsing failed: ${parseError.textContent ?? 'Unknown parser error'}`
    );
  }

  // Extract qti-item-body element
  const itemBody = doc.querySelector('qti-item-body');
  if (!itemBody) {
    throw new Error(
      'Invalid QTI structure: missing qti-item-body element'
    );
  }

  // Extract modal feedback elements (siblings of item-body)
  const modalFeedbacks = Array.from(doc.querySelectorAll('qti-modal-feedback'));

  return {
    itemBody,
    modalFeedbacks,
    rawDocument: doc,
  };
}
