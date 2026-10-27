/**
 * Parsed QTI item structure
 */
export interface ParsedQtiItem {
  /** The qti-item-body element extracted from the QTI XML */
  itemBody: Element;
  /** Modal feedback elements (siblings of item-body, at assessment-item level) */
  modalFeedbacks: Element[];
  /** The raw parsed XML Document */
  rawDocument: Document;
}

/**
 * Parsed QTI stimulus structure
 */
export interface ParsedQtiStimulus {
  /** The qti-stimulus-body element extracted from the QTI XML */
  stimulusBody: Element;
  /** The raw parsed XML Document */
  rawDocument: Document;
}
