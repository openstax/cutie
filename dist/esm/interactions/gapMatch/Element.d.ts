import type { RenderElementProps } from 'slate-react';
/**
 * Renders a gap-match interaction in the editor
 */
export declare function GapMatchInteractionElement({ attributes, children, element, }: RenderElementProps): React.JSX.Element;
/**
 * Renders the choices container (editor-only wrapper)
 */
export declare function GapMatchChoicesElement({ attributes, children, }: RenderElementProps): React.JSX.Element;
/**
 * Renders the content container (editor-only wrapper - invisible)
 */
export declare function GapMatchContentElement({ attributes, children, }: RenderElementProps): React.JSX.Element;
/**
 * Renders a gap-text choice element
 */
export declare function GapTextElement({ attributes, children, element, }: RenderElementProps): React.JSX.Element;
/**
 * Renders a gap-img choice element
 */
export declare function GapImgElement({ attributes, children, element, }: RenderElementProps): React.JSX.Element;
/**
 * Renders a gap (inline void placeholder)
 * Styled to match inline choice and text entry elements
 */
export declare function GapElement({ attributes, children, element, }: RenderElementProps): React.JSX.Element;
