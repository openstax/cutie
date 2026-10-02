/* spell-checker: ignore parsererror */
import type { ParsedQtiItem, ParsedQtiStimulus } from '../types';

/**
 * Parse QTI XML string into a structured format
 */
export function parseQtiXml(xmlString: string): ParsedQtiItem {
  const doc = parseXmlDocument(xmlString);

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

/**
 * Parse QTI stimulus XML string into a structured format
 */
export function parseQtiStimulusXml(xmlString: string): ParsedQtiStimulus {
  const doc = parseXmlDocument(xmlString);

  const stimulusBody = doc.querySelector('qti-stimulus-body');
  if (!stimulusBody) {
    throw new Error(
      'Invalid QTI structure: missing qti-stimulus-body element'
    );
  }

  return {
    stimulusBody,
    rawDocument: doc,
  };
}

/**
 * Parse an XML string with the native DOMParser, throwing on parser errors
 */
function parseXmlDocument(xmlString: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(
      `XML parsing failed: ${parseError.textContent ?? 'Unknown parser error'}`
    );
  }

  return doc;
}
