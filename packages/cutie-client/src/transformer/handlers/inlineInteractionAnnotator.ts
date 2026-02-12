// spell-checker: ignore Roselli
/**
 * Inline Interaction Annotator
 *
 * Annotates inline interactions (textEntryInteraction, inlineChoiceInteraction)
 * with aria-labelledby referencing spans wrapped around surrounding visible text.
 * This provides accessible labels per WCAG 4.1.2 and 3.3.2.
 *
 * References:
 * - W3C ARIA9 technique: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA9
 * - MDN Multipart Labels: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Multipart_labels
 * - Adrian Roselli labeling priority: https://adrianroselli.com/2020/01/my-priority-of-methods-for-labeling-a-control.html
 * - WCAG 4.1.2 Name, Role, Value: https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html
 * - WCAG 3.3.2 Labels or Instructions: https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
 */

const INTERACTION_SELECTOR =
  'input.cutie-text-entry-interaction, select.cutie-inline-choice-interaction';

const SENTENCE_BOUNDARY = /[.!?]\s+/;

export const BLOCK_TAGS = new Set([
  'p', 'div', 'blockquote', 'li', 'td', 'th',
  'dt', 'dd', 'section', 'article', 'header',
  'footer', 'figcaption',
]);

const INLINE_TAGS = new Set([
  'strong', 'em', 'span', 'a', 'sub', 'sup',
  'b', 'i', 'u', 's', 'small', 'mark', 'abbr',
  'cite', 'code', 'kbd', 'samp', 'var', 'q',
  'dfn', 'time', 'data', 'ruby', 'rt', 'rp',
  'bdi', 'bdo', 'wbr', 'del', 'ins', 'label',
]);

const ATOMIC_TAGS = new Set(['math', 'img', 'svg', 'picture', 'video', 'audio', 'canvas', 'iframe']);

/** Module-level counter for default ID generation */
let idCounter = 0;

/** Default ID generator for production use */
export function defaultGenerateId(): string {
  return `cutie-ctx-${++idCounter}`;
}

function isInteraction(node: Node): node is HTMLElement {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as HTMLElement;
  return (
    (el.tagName === 'INPUT' && el.classList.contains('cutie-text-entry-interaction')) ||
    (el.tagName === 'SELECT' && el.classList.contains('cutie-inline-choice-interaction'))
  );
}

function isInlineElement(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return INLINE_TAGS.has((node as Element).tagName.toLowerCase());
}

function isAtomicElement(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return ATOMIC_TAGS.has((node as Element).tagName.toLowerCase());
}

function isBr(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return (node as Element).tagName.toLowerCase() === 'br';
}

function isBlockElement(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return BLOCK_TAGS.has((node as Element).tagName.toLowerCase());
}

function containsInteraction(el: Element): boolean {
  return el.querySelector(INTERACTION_SELECTOR) !== null;
}

function textHasSentenceBoundary(text: string): boolean {
  return SENTENCE_BOUNDARY.test(text);
}

function hasNonWhitespace(nodes: Node[]): boolean {
  const text = nodes.map((n) => n.textContent ?? '').join('');
  return text.trim().length > 0;
}

interface InteractionRecord {
  element: HTMLElement;
  beforeSpanIds: string[];
  afterSpanIds: string[];
}

/**
 * Tracks span regions between interactions, grouped into segments
 * separated by sentence boundaries.
 *
 * Between two interactions, there may be multiple segments (groups of
 * spans separated by sentence boundaries). When assigning labels:
 * - The first segment goes to the previous interaction's "after"
 * - The last segment goes to the next interaction's "before"
 * - If there's only one segment (no sentence boundary), it's shared by both
 * - Middle segments (if any) belong to neither
 */
interface RegionTracker {
  /** Span IDs in the current segment */
  currentSegment: string[];
  /** Segments of span IDs between interactions, split at sentence boundaries */
  pendingSegments: string[][];
  /** All recorded interactions */
  interactions: InteractionRecord[];
}

function createRegionTracker(): RegionTracker {
  return {
    currentSegment: [],
    pendingSegments: [],
    interactions: [],
  };
}

/** Add a span to the current segment */
function trackSpan(tracker: RegionTracker, spanId: string): void {
  tracker.currentSegment.push(spanId);
}

/** Start a new segment (called at sentence boundaries) */
function startNewRegion(tracker: RegionTracker): void {
  if (tracker.currentSegment.length > 0) {
    tracker.pendingSegments.push(tracker.currentSegment);
    tracker.currentSegment = [];
  }
}

/**
 * Assign pending segments between two interactions.
 * First segment -> prev interaction's after.
 * Last segment -> next interaction's before.
 * Single segment -> shared by both.
 */
function assignPendingSegments(
  tracker: RegionTracker
): { afterIds: string[]; beforeIds: string[] } {
  // Flush current segment
  if (tracker.currentSegment.length > 0) {
    tracker.pendingSegments.push(tracker.currentSegment);
    tracker.currentSegment = [];
  }

  const segments = tracker.pendingSegments;
  tracker.pendingSegments = [];

  if (segments.length === 0) {
    return { afterIds: [], beforeIds: [] };
  }

  if (segments.length === 1) {
    // No sentence boundary — shared by both interactions
    const shared = segments[0]!;
    return { afterIds: shared, beforeIds: [...shared] };
  }

  // Multiple segments: first -> after, last -> before, middle -> neither
  return {
    afterIds: segments[0]!,
    beforeIds: segments[segments.length - 1]!,
  };
}

/** Record an interaction, assigning pending segments appropriately */
function trackInteraction(tracker: RegionTracker, element: HTMLElement): void {
  const { afterIds, beforeIds } = assignPendingSegments(tracker);

  // Assign "after" to the previous interaction
  if (tracker.interactions.length > 0) {
    const prev = tracker.interactions[tracker.interactions.length - 1]!;
    prev.afterSpanIds = afterIds;
  }

  // "before" for this interaction
  const record: InteractionRecord = {
    element,
    beforeSpanIds: beforeIds,
    afterSpanIds: [],
  };
  tracker.interactions.push(record);
}

/** Finalize: assign remaining segments as "after" for the last interaction */
function finalizeTracker(tracker: RegionTracker): InteractionRecord[] {
  if (tracker.currentSegment.length > 0) {
    tracker.pendingSegments.push(tracker.currentSegment);
    tracker.currentSegment = [];
  }

  if (tracker.interactions.length > 0 && tracker.pendingSegments.length > 0) {
    const last = tracker.interactions[tracker.interactions.length - 1]!;
    // All remaining segments go to the last interaction's after
    last.afterSpanIds = tracker.pendingSegments[0]!;
  }

  return tracker.interactions;
}

/**
 * Wraps a group of consecutive nodes into a <span> with a generated ID.
 * Inserts the span at the position of the first node in the group.
 * Returns the span ID, or null if the group was empty/whitespace-only.
 */
function flushGroup(
  group: Node[],
  generateId: () => string
): string | null {
  if (group.length === 0 || !hasNonWhitespace(group)) return null;

  const span = document.createElement('span');
  const id = generateId();
  span.id = id;

  // Insert the span before the first node in the group
  const firstNode = group[0]!;
  firstNode.parentNode!.insertBefore(span, firstNode);

  // Move all group nodes into the span
  for (const node of group) {
    span.appendChild(node);
  }

  return id;
}

/** Flush a group into a span, push its ID, and track it in the region tracker */
function flushAndTrack(
  group: Node[],
  generateId: () => string,
  tracker: RegionTracker,
  spanIds: string[]
): void {
  const spanId = flushGroup(group, generateId);
  if (spanId) {
    spanIds.push(spanId);
    trackSpan(tracker, spanId);
  }
}

/**
 * Process children of a container, wrapping text regions in spans and
 * recording interactions with their surrounding span IDs.
 *
 * Walks children of `container`, grouping consecutive content into spans.
 * When an interaction is found, the current group is flushed. Sentence
 * boundaries start new regions so that labels don't bleed across sentences.
 *
 * Returns all interactions found with their surrounding span IDs,
 * plus all span IDs created at this level (for parent to reference).
 */
function processContainer(
  container: Node,
  generateId: () => string,
  tracker?: RegionTracker
): { interactions: InteractionRecord[]; spanIds: string[] } {
  const isTopLevel = !tracker;
  if (!tracker) tracker = createRegionTracker();
  const allSpanIds: string[] = [];
  let currentGroup: Node[] = [];

  // We need to snapshot the childNodes since we'll be mutating the DOM
  const children = Array.from(container.childNodes);

  for (let i = 0; i < children.length; i++) {
    const node = children[i]!;

    if (node.nodeType === Node.TEXT_NODE) {
      const textResult = processTextNode(node as Text, currentGroup, tracker!, generateId);
      currentGroup = textResult.currentGroup;
      allSpanIds.push(...textResult.flushedSpanIds);
      continue;
    }

    if (isInteraction(node)) {
      // Skip already-annotated interactions — flush current group but don't move the interaction
      if ((node as HTMLElement).hasAttribute('aria-labelledby')) {
        flushAndTrack(currentGroup, generateId, tracker, allSpanIds);
        currentGroup = [];
        continue;
      }

      // Flush current group as span
      flushAndTrack(currentGroup, generateId, tracker, allSpanIds);
      currentGroup = [];

      // Record the interaction with region-based before/after tracking
      trackInteraction(tracker, node as HTMLElement);
      continue;
    }

    if (isBr(node)) {
      // BR acts as a span/region boundary
      flushAndTrack(currentGroup, generateId, tracker, allSpanIds);
      currentGroup = [];
      startNewRegion(tracker);
      continue;
    }

    if (isAtomicElement(node)) {
      currentGroup.push(node);
      continue;
    }

    if (isInlineElement(node)) {
      const el = node as Element;

      if (containsInteraction(el) || textHasSentenceBoundary(el.textContent ?? '')) {
        // Flush current group, recurse into element, start new group
        flushAndTrack(currentGroup, generateId, tracker, allSpanIds);
        currentGroup = [];

        const result = processContainer(el, generateId, tracker);
        allSpanIds.push(...result.spanIds);
        continue;
      }

      // No interaction or boundary — include whole element in current group
      currentGroup.push(node);
      continue;
    }

    if (isBlockElement(node)) {
      // Block element — flush and stop (defensive)
      flushAndTrack(currentGroup, generateId, tracker, allSpanIds);
      currentGroup = [];
      continue;
    }

    // Unknown element — include in group
    currentGroup.push(node);
  }

  // Flush remaining group
  flushAndTrack(currentGroup, generateId, tracker, allSpanIds);

  return {
    interactions: isTopLevel ? finalizeTracker(tracker) : [],
    spanIds: allSpanIds,
  };
}

/**
 * Process a text node, splitting at sentence boundaries if present.
 * Returns the updated currentGroup and any flushed span IDs.
 * Mutates tracker (trackSpan before startNewRegion) to maintain correct ordering.
 */
function processTextNode(
  textNode: Text,
  currentGroup: Node[],
  tracker: RegionTracker,
  generateId: () => string
): { currentGroup: Node[]; flushedSpanIds: string[] } {
  const text = textNode.textContent ?? '';

  if (!textHasSentenceBoundary(text)) {
    return { currentGroup: [...currentGroup, textNode], flushedSpanIds: [] };
  }

  const flushedSpanIds: string[] = [];
  let group = [...currentGroup];

  // Split at sentence boundaries
  let remaining: Text = textNode;
  while (true) {
    const remainingText = remaining.textContent ?? '';
    const match = SENTENCE_BOUNDARY.exec(remainingText);

    if (!match) {
      // No more boundaries — add remaining to group
      return { currentGroup: [...group, remaining], flushedSpanIds };
    }

    // Split at the end of the boundary (after the whitespace)
    const splitIndex = match.index + match[0].length;
    const afterPart = remaining.splitText(splitIndex);

    // The "remaining" node now contains text up to and including the boundary
    group.push(remaining);

    // Flush group as a span — trackSpan MUST happen before startNewRegion
    flushAndTrack(group, generateId, tracker, flushedSpanIds);
    group = [];

    // Sentence boundary starts a new region
    startNewRegion(tracker);

    remaining = afterPart;
  }
}

/** Unwrap a span: move its children back to its parent, then remove it */
function unwrapSpan(span: HTMLElement): void {
  const parent = span.parentNode;
  if (!parent) return;
  while (span.firstChild) {
    parent.insertBefore(span.firstChild, span);
  }
  parent.removeChild(span);
}

/**
 * Annotates all inline interactions in the fragment with aria-labelledby
 * referencing spans wrapped around surrounding text. Mutates fragment in place.
 * Returns true if annotations were made, false if no interactions found.
 */
export function annotateInlineInteractions(
  fragment: DocumentFragment,
  generateId: () => string = defaultGenerateId
): boolean {
  // Find all block-level elements that contain interactions
  const allInteractions = fragment.querySelectorAll(INTERACTION_SELECTOR);
  if (allInteractions.length === 0) return false;

  // Filter out already-annotated interactions
  const unannotated = Array.from(allInteractions).filter(
    (el) => !el.hasAttribute('aria-labelledby')
  );
  if (unannotated.length === 0) return false;

  // Find all block containers that have interactions
  const blockContainers = new Set<Node>();
  for (const interaction of unannotated) {
    // Walk up to find the nearest block ancestor within the fragment
    let current: Node | null = interaction.parentNode;
    while (current && current !== fragment) {
      if (
        current.nodeType === Node.ELEMENT_NODE &&
        BLOCK_TAGS.has((current as Element).tagName.toLowerCase())
      ) {
        blockContainers.add(current);
        break;
      }
      current = current.parentNode;
    }
    // If no block ancestor found, process the fragment itself
    if (!current || current === fragment) {
      blockContainers.add(fragment);
    }
  }

  let annotated = false;

  for (const container of blockContainers) {
    const { interactions, spanIds: generatedSpanIds } = processContainer(container, generateId);

    if (interactions.length === 0) continue;

    // Collect all referenced span IDs across all interactions
    const referencedSpanIds = new Set<string>();

    // Assign IDs to interactions and build aria-labelledby
    for (let i = 0; i < interactions.length; i++) {
      const record = interactions[i]!;
      const el = record.element;

      // Assign an ID to the interaction if it doesn't have one
      if (!el.id) {
        el.id = generateId();
      }

      // Build aria-labelledby from before spans + self + after spans
      const labelParts = [
        ...record.beforeSpanIds,
        el.id,
        ...record.afterSpanIds,
      ];

      // Only set aria-labelledby if there are context spans
      if (record.beforeSpanIds.length > 0 || record.afterSpanIds.length > 0) {
        el.setAttribute('aria-labelledby', labelParts.join(' '));
        annotated = true;
        for (const id of record.beforeSpanIds) referencedSpanIds.add(id);
        for (const id of record.afterSpanIds) referencedSpanIds.add(id);
      } else {
        // Fallback: no surrounding text — no cutie-sr-only spans created,
        // so don't set annotated (avoids unnecessary style injection)
        if (interactions.length > 1) {
          el.setAttribute('aria-label', `blank ${i + 1} of ${interactions.length}`);
        } else {
          el.setAttribute('aria-label', 'blank');
        }
      }
    }

    // Unwrap orphan context spans that no aria-labelledby references
    const queryRoot = container.nodeType === Node.ELEMENT_NODE
      ? container as Element
      : fragment;
    for (const spanId of generatedSpanIds) {
      if (!referencedSpanIds.has(spanId)) {
        const escapedId = typeof CSS !== 'undefined' && CSS.escape
          ? CSS.escape(spanId) : spanId;
        const span = queryRoot.querySelector(`#${escapedId}`);
        if (span) unwrapSpan(span as HTMLElement);
      }
    }

    // Add aria-describedby for positional info when multiple interactions
    if (interactions.length > 1) {
      const appendTarget = container;

      for (let i = 0; i < interactions.length; i++) {
        const record = interactions[i]!;
        const el = record.element;

        // Only add describedby if we also have labelledby (not fallback)
        if (!el.hasAttribute('aria-labelledby')) continue;

        const descSpan = document.createElement('span');
        descSpan.id = generateId();
        descSpan.className = 'cutie-sr-only';
        descSpan.setAttribute('aria-hidden', 'true');
        descSpan.textContent = `blank ${i + 1} of ${interactions.length}`;

        appendTarget.appendChild(descSpan);
        el.setAttribute('aria-describedby', descSpan.id);
      }
    }
  }

  return annotated;
}

/** CSS for visually-hidden description spans */
export const SR_ONLY_STYLES = `
  .cutie-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
