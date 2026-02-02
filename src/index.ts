/**
 * @openstax/cutie-editor
 * React-based WYSIWYG editor for QTI v3 assessment items using Slate.js
 */

// Export main React component
export { SlateEditor } from './editor/SlateEditor';

// Export serialization utilities
export { parseXmlToSlate } from './serialization/xmlToSlate';
export { serializeSlateToXml, serializeSlateToQti } from './serialization/slateToXml';
export {
  domToXmlNode,
  xmlNodeToDom,
  findChild,
  findChildren,
} from './serialization/xmlNode';

// Export plugins
export {
  withQtiInteractions,
  withXhtml,
  withUnknownElements,
} from './plugins';

// Export asset context hook
export { useAssetHandlers } from './contexts/AssetContext';

// Export interaction insertion functions
export { insertChoiceInteraction } from './interactions/choice';
export { insertTextEntryInteraction } from './interactions/textEntry';
export { insertExtendedTextInteraction } from './interactions/extendedText';

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
  BlockquoteElement,
  TextEntryConfig,
  ExtendedTextConfig,
  ChoiceInteractionConfig,
  ChoiceConfig,
  ElementAttributes,
  XmlNode,
  // Text alignment type
  TextAlign,
  // Response processing types
  ResponseProcessingMode,
  ResponseProcessingConfig,
  DocumentMetadata,
  // Asset handler types
  EditorAssetResolver,
  EditorAssetUploader,
  EditorAssetHandlers,
} from './types';

// Re-export Slate types for convenience
export type { Descendant } from 'slate';
