/**
 * @openstax/cutie-editor
 * React-based WYSIWYG editor for QTI v3 assessment items using Slate.js
 */

// Export main React component
export { SlateEditor } from './editor/SlateEditor';

// Export serialization utilities
export { parseXmlToSlate } from './serialization/xmlToSlate';
export { serializeSlateToXml, serializeSlateToQti } from './serialization/slateToXml';

// Export plugins
export {
  withQtiInteractions,
  withXhtml,
  withUnknownElements,
  generateResponseId,
  insertTextEntryInteraction,
  insertExtendedTextInteraction,
  insertChoiceInteraction,
} from './plugins';

// Export types
export type {
  SlateEditorProps,
  SerializationResult,
  ValidationError,
  SlateElement,
  SlateText,
  QtiTextEntryInteraction,
  QtiExtendedTextInteraction,
  QtiChoiceInteraction,
  QtiPrompt,
  QtiSimpleChoice,
  UnknownQtiElement,
  ParagraphElement,
  DivElement,
  SpanElement,
  HeadingElement,
  ImageElement,
  LineBreakElement,
  ListElement,
  ListItemElement,
  TextEntryConfig,
  ExtendedTextConfig,
  ChoiceInteractionConfig,
  ChoiceConfig,
  ElementAttributes,
} from './types';

// Re-export Slate types for convenience
export type { Descendant } from 'slate';
