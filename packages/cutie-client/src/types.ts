/**
 * Parsed QTI item structure
 */
export interface ParsedQtiItem {
  /** The qti-item-body element extracted from the QTI XML */
  itemBody: Element;
  /** The raw parsed XML Document */
  rawDocument: Document;
}
