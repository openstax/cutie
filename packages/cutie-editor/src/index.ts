/**
 * @openstax/cutie-editor
 * React-based WYSIWYG editor for QTI v3 assessment items using Slate.js
 */

// Export main React component
export { SlateEditor } from './editor/SlateEditor.js';

// Export serialization utilities
export { parseXmlToSlate } from './serialization/xmlToSlate.js';
export { serializeSlateToXml, serializeSlateToQti } from './serialization/slateToXml.js';
export {
  domToXmlNode,
  xmlNodeToDom,
  findChild,
  findChildren,
} from './serialization/xmlNode.js';

// Export plugins
export {
  withQtiInteractions,
  withXhtml,
  withUnknownElements,
} from './plugins/index.js';

// Export asset context hook
export { useAssetHandlers } from './contexts/AssetContext.js';

// Export interaction insertion functions
export { insertChoiceInteraction } from './interactions/choice/index.js';
export { insertTextEntryInteraction } from './interactions/textEntry/index.js';
export { insertExtendedTextInteraction } from './interactions/extendedText/index.js';

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
  QtiModalFeedback,
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
  // Feedback identifier types
  FeedbackIdentifier,
  FeedbackIdentifierSource,
} from './types.js';

// Re-export Slate types for convenience
export type { Descendant } from 'slate';
