import type { ElementHandler, TransformContext } from '../../types';
import { GAP_STYLES } from './styles';

/**
 * Handler for qti-gap elements within gap-match-interaction.
 * Renders gaps as simple spans with data attributes.
 */
export class GapHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-gap';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('qti-gap')) {
      context.styleManager.addStyle('qti-gap', GAP_STYLES);
    }

    const identifier = element.getAttribute('identifier');
    if (!identifier) {
      console.warn('qti-gap missing identifier attribute');
      const span = document.createElement('span');
      span.className = 'qti-gap qti-gap--error';
      span.textContent = '[missing identifier]';
      fragment.appendChild(span);
      return fragment;
    }

    // Get match-group if present (space-separated list)
    const matchGroup = element.getAttribute('match-group') ?? '';

    // Create the gap span with initial structure
    const gap = document.createElement('span');
    gap.className = 'qti-gap';
    gap.setAttribute('data-identifier', identifier);
    gap.setAttribute('role', 'button');
    gap.setAttribute('tabindex', '-1'); // Will be managed by controller
    gap.setAttribute('aria-label', 'Gap, empty');
    gap.setAttribute('draggable', 'false'); // Initially not draggable, becomes draggable when filled

    if (matchGroup) {
      gap.setAttribute('data-match-group', matchGroup);
    }

    // Placeholder shown when empty (empty space, sized by min-width in CSS)
    const placeholder = document.createElement('span');
    placeholder.className = 'qti-gap-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');

    // Content span shown when filled (initially hidden)
    const content = document.createElement('span');
    content.className = 'qti-gap-content';
    content.style.display = 'none';

    gap.appendChild(placeholder);
    gap.appendChild(content);

    fragment.appendChild(gap);
    return fragment;
  }
}
