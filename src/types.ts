import type { BaseEditor, Element, Path } from 'slate';
import type { HistoryEditor } from 'slate-history';
import type { ReactEditor } from 'slate-react';
import type { XmlNode } from './serialization/xmlNode';

// Re-export XmlNode for convenience
export type { XmlNode } from './serialization/xmlNode';

// ============================================================================
// Slate Editor Type Extensions
// ============================================================================

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: SlateElement;
    Text: SlateText;
  }
}

// ============================================================================
// Response Processing Types
// ============================================================================

/**
 * Response processing mode:
 * - 'custom': Complex logic that cannot be classified; read-only, preserved as-is
 * - 'sumScores': Partial credit; each interaction produces a score, totaled together
 * - 'allCorrect': Binary 0/1; all responses must be correct for score of 1
 */
export type ResponseProcessingMode = 'custom' | 'sumScores' | 'allCorrect';

/**
 * Configuration for response processing
 */
export interface ResponseProcessingConfig {
  mode: ResponseProcessingMode;
  /** For 'custom' mode: preserve original XML for round-trip */
  customXml?: XmlNode;
}

/**
 * Document metadata node stored at position [0] in the Slate document.
 * This is a void element that participates in Slate's undo/redo history.
 */
export interface DocumentMetadata {
  type: 'document-metadata';
  children: [{ text: '' }]; // Void element requires children
  responseProcessing: ResponseProcessingConfig;
}

// ============================================================================
// Slate Element Types
// ============================================================================

/**
 * Text alignment type for block elements
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Base attributes interface for all elements with XML attributes
 */
export interface ElementAttributes {
  [key: string]: string | undefined;
}

/**
 * QTI Text Entry Interaction (inline, void)
 */
export interface QtiTextEntryInteraction {
  type: 'qti-text-entry-interaction';
  children: [{ text: '' }];
  attributes: {
    'response-identifier': string;
    'expected-length'?: string;
    'pattern-mask'?: string;
    'placeholder-text'?: string;
  } & ElementAttributes;
  responseDeclaration: XmlNode;
}

/**
 * Inline choice option data stored on the interaction element
 */
export interface InlineChoiceOption {
  identifier: string;
  text: string;
  fixed?: boolean;
}

/**
 * QTI Inline Choice Interaction (inline, void)
 * Renders as a dropdown/select within text flow
 */
export interface QtiInlineChoiceInteraction {
  type: 'qti-inline-choice-interaction';
  children: [{ text: '' }];
  attributes: {
    'response-identifier': string;
    shuffle?: string;
  } & ElementAttributes;
  choices: InlineChoiceOption[];
  responseDeclaration: XmlNode;
}

/**
 * QTI Extended Text Interaction (block with prompt child)
 */
export interface QtiExtendedTextInteraction {
  type: 'qti-extended-text-interaction';
  children: Array<QtiPrompt>;
  attributes: {
    'response-identifier': string;
    'expected-lines'?: string;
    'expected-length'?: string;
    'placeholder-text'?: string;
  } & ElementAttributes;
  responseDeclaration: XmlNode;
}

/**
 * QTI Choice Interaction (block with children)
 */
export interface QtiChoiceInteraction {
  type: 'qti-choice-interaction';
  children: Array<QtiPrompt | QtiSimpleChoice>;
  attributes: {
    'response-identifier': string;
    'max-choices': string;
    'min-choices'?: string;
    'shuffle'?: string;
  } & ElementAttributes;
  responseDeclaration: XmlNode;
}

/**
 * QTI Prompt (block, optional first child of choice interaction)
 */
export interface QtiPrompt {
  type: 'qti-prompt';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * QTI Simple Choice (block child of choice interaction)
 */
export interface QtiSimpleChoice {
  type: 'qti-simple-choice';
  children: Array<SlateElement | SlateText>;
  attributes: {
    identifier: string;
    fixed?: string;
  } & ElementAttributes;
}

/**
 * Choice ID Label (void element displaying the choice identifier)
 * This is an editor-only element. The identifier is stored in attributes and edited via properties panel.
 * Void elements are non-editable and have placeholder children.
 */
export interface ChoiceIdLabel {
  type: 'choice-id-label';
  children: [{ text: '' }];
  attributes: {
    identifier: string;
  } & ElementAttributes;
}

/**
 * Choice Content (block element, but styled inline, wraps the choice text)
 * This is an editor-only element that wraps the actual choice text content.
 * Ensures qti-simple-choice only has element children (no direct text nodes).
 */
export interface ChoiceContent {
  type: 'choice-content';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * QTI Gap Match Interaction (block with children)
 */
export interface QtiGapMatchInteraction {
  type: 'qti-gap-match-interaction';
  children: Array<GapMatchChoices | GapMatchContent>;
  attributes: {
    'response-identifier': string;
    shuffle?: string;
  } & ElementAttributes;
  responseDeclaration: XmlNode;
}

/**
 * Editor-only wrapper for gap-match choices
 */
export interface GapMatchChoices {
  type: 'gap-match-choices';
  children: Array<QtiGapText | QtiGapImg>;
  attributes?: ElementAttributes;
}

/**
 * Editor-only wrapper for gap-match content (where gaps appear)
 */
export interface GapMatchContent {
  type: 'gap-match-content';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * QTI Gap Text (choice element within gap-match-interaction)
 */
export interface QtiGapText {
  type: 'qti-gap-text';
  children: Array<SlateElement | SlateText>;
  attributes: {
    identifier: string;
    'match-max'?: string;
    'match-group'?: string;
    fixed?: string;
  } & ElementAttributes;
}

/**
 * QTI Gap Img (image choice element within gap-match-interaction)
 * This is a wrapper containing an image child, not void
 */
export interface QtiGapImg {
  type: 'qti-gap-img';
  children: Array<ImageElement>;
  attributes: {
    identifier: string;
    'match-max'?: string;
    'match-group'?: string;
    fixed?: string;
  } & ElementAttributes;
}

/**
 * QTI Gap (inline void placeholder for answers within gap-match content)
 */
export interface QtiGap {
  type: 'qti-gap';
  children: [{ text: '' }];
  attributes: {
    identifier: string;
    'match-group'?: string;
  } & ElementAttributes;
}

/**
 * QTI Match Interaction (block with children)
 * Creates directional associations between items in two sets (source → target)
 */
export interface QtiMatchInteraction {
  type: 'qti-match-interaction';
  children: Array<QtiPrompt | MatchSourceSet | MatchTargetSet>;
  attributes: {
    'response-identifier': string;
    'max-associations'?: string;
    'min-associations'?: string;
    shuffle?: string;
  } & ElementAttributes;
  responseDeclaration: XmlNode;
}

/**
 * Editor-only wrapper for the first qti-simple-match-set (source items)
 */
export interface MatchSourceSet {
  type: 'match-source-set';
  children: Array<QtiSimpleAssociableChoice>;
  attributes?: ElementAttributes;
}

/**
 * Editor-only wrapper for the second qti-simple-match-set (target items)
 */
export interface MatchTargetSet {
  type: 'match-target-set';
  children: Array<QtiSimpleAssociableChoice>;
  attributes?: ElementAttributes;
}

/**
 * QTI Simple Associable Choice (choice element within match interaction)
 */
export interface QtiSimpleAssociableChoice {
  type: 'qti-simple-associable-choice';
  children: Array<SlateElement | SlateText>;
  attributes: {
    identifier: string;
    'match-max'?: string;
    'match-min'?: string;
    fixed?: string;
  } & ElementAttributes;
}

/**
 * QTI Feedback Inline - inline feedback element shown based on outcome variable
 */
export interface QtiFeedbackInline {
  type: 'qti-feedback-inline';
  children: Array<SlateElement | SlateText>;
  attributes: {
    'outcome-identifier': string;  // Usually "FEEDBACK"
    identifier: string;            // e.g., "RESPONSE_correct"
    'show-hide': 'show' | 'hide';
  } & ElementAttributes;
}

/**
 * QTI Feedback Block - block feedback element shown based on outcome variable
 */
export interface QtiFeedbackBlock {
  type: 'qti-feedback-block';
  children: Array<QtiContentBody>;
  attributes: {
    'outcome-identifier': string;  // Usually "FEEDBACK"
    identifier: string;            // e.g., "RESPONSE_correct"
    'show-hide': 'show' | 'hide';
  } & ElementAttributes;
}

/**
 * QTI Modal Feedback - modal dialog feedback shown based on outcome variable
 * Rendered at end of editor, serialized outside qti-item-body in QTI XML
 */
export interface QtiModalFeedback {
  type: 'qti-modal-feedback';
  children: Array<QtiContentBody>;
  attributes: {
    'outcome-identifier': string;  // Usually "FEEDBACK"
    identifier: string;            // e.g., "RESPONSE_correct"
    'show-hide': 'show' | 'hide';
  } & ElementAttributes;
}

/**
 * QTI Content Body - container for flow content inside qti-modal-feedback
 * Required wrapper per QTI 3.0 specification
 */
export interface QtiContentBody {
  type: 'qti-content-body';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * Unknown QTI Element (preserve with warnings)
 */
export interface UnknownQtiElement {
  type: 'qti-unknown';
  children: Array<SlateElement | SlateText>;
  originalTagName: string;
  attributes: ElementAttributes;
  rawXml?: string; // Store original XML for perfect round-trip
  isVoid?: boolean; // Whether this element should be void
}

/**
 * XHTML Paragraph
 */
export interface ParagraphElement {
  type: 'paragraph';
  children: Array<SlateElement | SlateText>;
  align?: TextAlign;
  attributes?: ElementAttributes;
}

/**
 * XHTML Div
 */
export interface DivElement {
  type: 'div';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * XHTML Span
 */
export interface SpanElement {
  type: 'span';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * XHTML Heading (h1-h6)
 */
export interface HeadingElement {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: Array<SlateElement | SlateText>;
  align?: TextAlign;
  attributes?: ElementAttributes;
}

/**
 * XHTML Image (void)
 */
export interface ImageElement {
  type: 'image';
  children: [{ text: '' }];
  attributes: {
    src: string;
    alt?: string;
    width?: string;
    height?: string;
  } & ElementAttributes;
}

/**
 * XHTML Line Break (void)
 */
export interface LineBreakElement {
  type: 'line-break';
  children: [{ text: '' }];
  attributes?: ElementAttributes;
}

/**
 * XHTML List (ul, ol)
 */
export interface ListElement {
  type: 'list';
  ordered: boolean;
  children: Array<ListItemElement>;
  attributes?: ElementAttributes;
}

/**
 * XHTML List Item
 */
export interface ListItemElement {
  type: 'list-item';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * XHTML Strong (bold)
 */
export interface StrongElement {
  type: 'strong';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * XHTML Em (italic)
 */
export interface EmElement {
  type: 'em';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
}

/**
 * XHTML Blockquote
 */
export interface BlockquoteElement {
  type: 'blockquote';
  children: Array<SlateElement | SlateText>;
  align?: TextAlign;
  attributes?: ElementAttributes;
}

/**
 * XHTML Horizontal Rule (void)
 */
export interface HorizontalRuleElement {
  type: 'horizontal-rule';
  children: [{ text: '' }];
  attributes?: ElementAttributes;
}

/**
 * Union type of all possible Slate elements
 */
export type SlateElement =
  | DocumentMetadata
  | QtiTextEntryInteraction
  | QtiInlineChoiceInteraction
  | QtiExtendedTextInteraction
  | QtiChoiceInteraction
  | QtiGapMatchInteraction
  | QtiMatchInteraction
  | QtiPrompt
  | QtiSimpleChoice
  | ChoiceIdLabel
  | ChoiceContent
  | GapMatchChoices
  | GapMatchContent
  | QtiGapText
  | QtiGapImg
  | QtiGap
  | MatchSourceSet
  | MatchTargetSet
  | QtiSimpleAssociableChoice
  | QtiFeedbackInline
  | QtiFeedbackBlock
  | QtiModalFeedback
  | QtiContentBody
  | UnknownQtiElement
  | ParagraphElement
  | DivElement
  | SpanElement
  | HeadingElement
  | ImageElement
  | LineBreakElement
  | ListElement
  | ListItemElement
  | StrongElement
  | EmElement
  | BlockquoteElement
  | HorizontalRuleElement;

/**
 * Text leaf with formatting marks
 */
export interface SlateText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  strikethrough?: boolean;
}

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Result of serializing Slate content to QTI XML
 */
export interface SerializationResult {
  /** The generated QTI XML string */
  xml: string;
  /** List of response identifiers found in the content */
  responseIdentifiers: string[];
  /** Any validation errors encountered during serialization */
  errors?: ValidationError[];
}

/**
 * Validation error encountered during serialization
 */
export interface ValidationError {
  /** Error type */
  type: 'duplicate-identifier' | 'missing-identifier' | 'invalid-xml' | 'unknown';
  /** Human-readable error message */
  message: string;
  /** Response identifier related to the error (if applicable) */
  responseIdentifier?: string;
}

// ============================================================================
// Editor Component Props
// ============================================================================

/**
 * Props for the SlateEditor component
 */
export interface SlateEditorProps {
  /** Full QTI XML document to edit */
  qtiXml: string;
  /** Called when the QTI XML changes (debounced) */
  onQtiChange?: (xml: string, result: SerializationResult) => void;
  /** Called when there's an error parsing or serializing */
  onError?: (error: string) => void;
  /** Optional CSS class name */
  className?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Asset handlers for resolving and uploading images/media */
  assetHandlers?: EditorAssetHandlers;
}

// ============================================================================
// Dialog Configuration Types
// ============================================================================

/**
 * Configuration for text entry interaction
 */
export interface TextEntryConfig {
  responseIdentifier: string;
  expectedLength?: string;
  patternMask?: string;
  placeholderText?: string;
}

/**
 * Configuration for extended text interaction
 */
export interface ExtendedTextConfig {
  responseIdentifier: string;
  expectedLines?: string;
  expectedLength?: string;
  placeholderText?: string;
}

/**
 * Configuration for a single choice
 */
export interface ChoiceConfig {
  identifier: string;
  fixed?: boolean;
}

/**
 * Configuration for choice interaction
 */
export interface ChoiceInteractionConfig {
  responseIdentifier: string;
  maxChoices: string;
  minChoices?: string;
  shuffle?: boolean;
  choices: ChoiceConfig[];
}

// ============================================================================
// Feedback Identifier Types
// ============================================================================

/**
 * Describes a single feedback identifier available from an interaction
 */
export interface FeedbackIdentifier {
  /** The feedback identifier value, e.g., "RESPONSE_correct" */
  id: string;
  /** Human-readable label, e.g., "RESPONSE: Correct" */
  label: string;
  /** Description of when this feedback triggers */
  description: string;
}

/**
 * Collection of feedback identifiers from a single interaction
 */
export interface FeedbackIdentifierSource {
  /** The response identifier of the interaction */
  responseIdentifier: string;
  /** The type of interaction (for display purposes) */
  interactionType: string;
  /** Available feedback identifiers */
  identifiers: FeedbackIdentifier[];
}

// ============================================================================
// Element Configuration Types (for editor plugins)
// ============================================================================

/**
 * Configuration for an element type in the editor.
 * Used by plugins to define behavior for specific element types.
 */
export interface ElementConfig {
  /** The element type identifier */
  type: string;
  /** The XML tag name this element serializes to, or null for editor-only elements */
  xmlTagName: string | null;
  /** Whether this element is void (has no editable children) */
  isVoid: boolean;
  /** Whether this element is inline */
  isInline: boolean;
  /** Whether this element needs spacer paragraphs for cursor positioning */
  needsSpacers: boolean;
  /** Categories this element belongs to (e.g., ['interaction']) */
  categories: string[];
  /** Categories of descendants that are forbidden inside this element */
  forbidDescendants: string[];
  /** Predicate to check if an element matches this config */
  matches: (element: Element) => boolean;
  /**
   * Optional normalization hook for this element type.
   * Called during editor normalization when this element is encountered.
   * Return true if a normalization was performed (will re-run normalization).
   * Return false to continue with default normalization.
   */
  normalize?: (editor: CustomEditor, node: Element, path: Path) => boolean;
  /**
   * Optional hook to generate feedback identifiers for this interaction.
   * Return null if this element doesn't provide feedback identifiers.
   */
  getFeedbackIdentifiers?: (element: Element) => FeedbackIdentifierSource | null;
  /**
   * Generate correctness check for allCorrect mode. Returns a DOM element
   * evaluating to a boolean expression.
   * If not provided, defaults to qti-match(variable, correct).
   */
  generateCorrectnessCheck?: (
    responseId: string, responseDecl: XmlNode, doc: Document
  ) => globalThis.Element;
  /**
   * Generate feedback conditions for this interaction.
   * Returns array of qti-response-condition elements.
   * If not provided, defaults to standard correct/incorrect via qti-match.
   */
  generateFeedbackConditions?: (
    responseId: string,
    responseDecl: XmlNode,
    feedbackIds: Set<string>,
    doc: Document
  ) => globalThis.Element[];
}

// ============================================================================
// Asset Handler Types
// ============================================================================

/**
 * Resolves asset URL for display in the editor.
 * Called asynchronously; result is cached by the component.
 */
export type EditorAssetResolver = (url: string) => Promise<string>;

/**
 * Handles asset upload from file input.
 * Returns the src to store in QTI XML.
 */
export type EditorAssetUploader = (file: File) => Promise<string>;

/**
 * Asset-related callbacks for the editor.
 */
export interface EditorAssetHandlers {
  /** Resolve asset URLs for display (async, results cached) */
  resolveAsset?: EditorAssetResolver;
  /** Handle file upload, return src to store in XML */
  uploadAsset?: EditorAssetUploader;
}
