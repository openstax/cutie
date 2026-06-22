/**
 * @openstax/cutie-editor
 * React-based WYSIWYG editor for QTI v3 assessment items using Slate.js
 */
export { SlateEditor } from './editor/SlateEditor';
export { parseXmlToSlate } from './serialization/xmlToSlate';
export { serializeSlateToXml, serializeSlateToQti } from './serialization/slateToXml';
export { domToXmlNode, xmlNodeToDom, findChild, findChildren, } from './serialization/xmlNode';
export { withQtiInteractions, withXhtml, withUnknownElements, } from './plugins';
export { useAssetHandlers } from './contexts/AssetContext';
export { insertChoiceInteraction } from './interactions/choice';
export { insertTextEntryInteraction } from './interactions/textEntry';
export { insertExtendedTextInteraction } from './interactions/extendedText';
export type { SlateEditorProps, SerializationResult, ValidationError, SlateElement, SlateText, QtiTextEntryInteraction, QtiExtendedTextInteraction, QtiChoiceInteraction, QtiPrompt, QtiSimpleChoice, QtiModalFeedback, UnknownQtiElement, ParagraphElement, DivElement, SpanElement, HeadingElement, ImageElement, LineBreakElement, ListElement, ListItemElement, BlockquoteElement, TextEntryConfig, ExtendedTextConfig, ChoiceInteractionConfig, ChoiceConfig, ElementAttributes, XmlNode, TextAlign, ResponseProcessingMode, ResponseProcessingConfig, DocumentMetadata, EditorAssetResolver, EditorAssetUploader, EditorAssetHandlers, FeedbackIdentifier, FeedbackIdentifierSource, } from './types';
export type { Descendant } from 'slate';
