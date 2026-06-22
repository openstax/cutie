import type { Descendant } from 'slate';
import type { SerializationContext } from '../../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../../serialization/xmlToSlate';
import type { SlateElement } from '../../../types';
/**
 * Export parsers and serializers as objects that can be spread
 */
export declare const modalFeedbackParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement>;
export declare const modalFeedbackSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null>;
