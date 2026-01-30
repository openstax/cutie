import type { BaseEditor } from 'slate';
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
// Slate Element Types
// ============================================================================

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
 * QTI Extended Text Interaction (block, void)
 */
export interface QtiExtendedTextInteraction {
  type: 'qti-extended-text-interaction';
  children: [{ text: '' }];
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
 * Choice ID Label (block element, but styled inline, editable identifier label for simple choices)
 * This is an editor-only element. The text content gets serialized to parent's identifier attribute.
 * Note: It's a block element in Slate's schema to avoid spacer text nodes that would appear
 * if it were inline (Slate inserts spacers before/after inline elements at block boundaries)
 */
export interface ChoiceIdLabel {
  type: 'choice-id-label';
  children: Array<SlateElement | SlateText>;
  attributes?: ElementAttributes;
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
 * Union type of all possible Slate elements
 */
export type SlateElement =
  | QtiTextEntryInteraction
  | QtiExtendedTextInteraction
  | QtiChoiceInteraction
  | QtiPrompt
  | QtiSimpleChoice
  | ChoiceIdLabel
  | ChoiceContent
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
  | EmElement;

/**
 * Text leaf with formatting marks
 */
export interface SlateText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
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
