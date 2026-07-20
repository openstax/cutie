import { createParagraphValidationAggregator } from '../../errors/validationDisplay';
import { registry } from '../registry';
import type { ElementHandler, ParagraphValidationAggregator, TransformContext } from '../types';
import {
  annotateInlineInteractions,
  BLOCK_TAGS,
  SR_ONLY_STYLES,
} from './inlineInteractionAnnotator';

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

    // Clone the element with the same tag name
    const cloned = document.createElement(element.tagName);

    // Copy all attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr) {
        cloned.setAttribute(attr.name, attr.value);
      }
    }

    const tagName = element.tagName.toLowerCase();

    // Only <p> gets a validation aggregator: it can only contain phrasing
    // content, so a consolidated message for it must be a preceding
    // sibling — unlike other BLOCK_TAGS containers (div, li, td, ...),
    // which could validly nest a leading block child instead.
    const isParagraph = tagName === 'p';
    const previousAggregator = context.paragraphValidation;
    let aggregator: ParagraphValidationAggregator | undefined;

    if (isParagraph) {
      aggregator = createParagraphValidationAggregator(context.styleManager);
      context.paragraphValidation = aggregator;
    }

    try {
      // Recursively transform children using context function
      if (context.transformChildren) {
        const childrenFragment = context.transformChildren(element);
        cloned.appendChild(childrenFragment);
      }
    } finally {
      if (isParagraph) {
        context.paragraphValidation = previousAggregator;
      }
    }

    // After building the output for a block-level element, annotate any
    // inline interactions with aria-labelledby referencing surrounding text.
    // Inner blocks are processed first (via recursion above), so nested
    // interactions are already annotated and get skipped.
    if (BLOCK_TAGS.has(tagName)) {
      const wrapperFragment = document.createDocumentFragment();
      if (aggregator?.hasFields()) {
        wrapperFragment.appendChild(aggregator.element);
      }
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

// Register with lowest priority (catch-all for non-qti elements)
registry.register('html-passthrough', new HtmlPassthroughHandler(), 1000);
