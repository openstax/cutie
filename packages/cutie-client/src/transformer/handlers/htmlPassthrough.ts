/* spell-checker: ignore MATHML */
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import {
  annotateInlineInteractions,
  BLOCK_TAGS,
  SR_ONLY_STYLES,
} from './inlineInteractionAnnotator';

/**
 * MathML 3 is the only imported namespace QTI v3 renders as markup. Everything
 * else here is HTML, which the QTI document carries in the QTI namespace.
 */
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

/**
 * Handler for standard HTML/XHTML elements
 * Passes through any non-qti elements as-is
 */
class HtmlPassthroughHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    // Handle any element that doesn't start with "qti-"
    return !element.tagName.toLowerCase().startsWith('qti-');
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const cloned = cloneElementShell(element);

    // Recursively transform children using context function
    if (context.transformChildren) {
      const childrenFragment = context.transformChildren(element);
      cloned.appendChild(childrenFragment);
    }

    // After building the output for a block-level element, annotate any
    // inline interactions with aria-labelledby referencing surrounding text.
    // Inner blocks are processed first (via recursion above), so nested
    // interactions are already annotated and get skipped.
    if (BLOCK_TAGS.has(element.tagName.toLowerCase())) {
      const wrapperFragment = document.createDocumentFragment();
      wrapperFragment.appendChild(cloned);
      if (annotateInlineInteractions(wrapperFragment)) {
        if (context.styleManager && !context.styleManager.hasStyle('cutie-sr-only')) {
          context.styleManager.addStyle('cutie-sr-only', SR_ONLY_STYLES);
        }
      }
      fragment.appendChild(wrapperFragment);
      return fragment;
    }

    fragment.appendChild(cloned);
    return fragment;
  }
}

/**
 * Create an empty copy of an element with its attributes. MathML keeps its
 * namespace so the browser renders it as math (and hides its annotations);
 * the local name drops any prefix the source used, such as `m:math`.
 */
function cloneElementShell(element: Element): Element {
  if (element.namespaceURI === MATHML_NAMESPACE) {
    const cloned = document.createElementNS(MATHML_NAMESPACE, element.localName);
    for (const attr of Array.from(element.attributes)) {
      cloned.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
    }
    return cloned;
  }

  // Clone the element with the same tag name
  const cloned = document.createElement(element.tagName);
  for (const attr of Array.from(element.attributes)) {
    cloned.setAttribute(attr.name, attr.value);
  }
  return cloned;
}

// Register with lowest priority (catch-all for non-qti elements)
registry.register('html-passthrough', new HtmlPassthroughHandler(), 1000);
