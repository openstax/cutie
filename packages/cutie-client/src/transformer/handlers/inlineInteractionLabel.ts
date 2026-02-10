const INLINE_INTERACTION_TAGS = [
  'qti-text-entry-interaction',
  'qti-inline-choice-interaction',
];

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'blockquote',
  'li',
  'td',
  'th',
  'dt',
  'dd',
  'section',
  'article',
  'header',
  'footer',
  'figcaption',
]);

const STOP_TAG = 'qti-item-body';

function findBlockAncestor(element: Element): Element | null {
  let current = element.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === STOP_TAG) return null;
    if (BLOCK_TAGS.has(tag)) return current;
    current = current.parentElement;
  }
  return null;
}

export function buildInlineInteractionLabel(element: Element): string {
  const block = findBlockAncestor(element);
  if (!block) return 'blank';

  const selector = INLINE_INTERACTION_TAGS.join(', ');
  const interactions = Array.from(block.querySelectorAll(selector));

  if (interactions.length <= 1) return 'blank';

  const index = interactions.indexOf(element);
  if (index === -1) return 'blank';

  return `blank ${index + 1} of ${interactions.length}`;
}
