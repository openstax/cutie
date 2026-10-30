import type { TransformContext } from '../../types.js';
import type { AssociableChoice } from './associations.js';

/**
 * A qti-simple-associable-choice: its element, for rendering, and its
 * association attributes.
 */
export interface MatchChoice {
  element: Element;
  choice: AssociableChoice;
}

const getMatchGroups = (choice: Element): string[] =>
  (choice.getAttribute('match-group') ?? '').split(/\s+/).filter(Boolean);

/**
 * A choice's plain-text name, used for announcements and accessible labels: its
 * text, with each image's alt text in its place, so an image that identifies
 * the choice isn't lost beside text of its own.
 */
const getChoiceText = (choice: Element): string => {
  const parts: string[] = [];
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? '');
    } else if (node instanceof Element && node.tagName.toLowerCase() === 'img') {
      parts.push(` ${node.getAttribute('alt') ?? ''} `);
    } else {
      node.childNodes.forEach(walk);
    }
  };
  choice.childNodes.forEach(walk);
  return parts.join('').replace(/\s+/g, ' ').trim();
};

const parseCount = (choice: Element, attribute: string, fallback: number): number => {
  const parsed = parseInt(choice.getAttribute(attribute) ?? String(fallback), 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Read a match set's choices. A choice without an identifier can't be
 * associated, so it is skipped.
 */
export function readMatchSet(matchSet: Element): MatchChoice[] {
  return Array.from(matchSet.children).flatMap((element) => {
    if (element.tagName.toLowerCase() !== 'qti-simple-associable-choice') return [];
    const id = element.getAttribute('identifier');
    if (!id) {
      console.warn('qti-simple-associable-choice missing identifier, skipping');
      return [];
    }
    return [{
      element,
      choice: {
        id,
        matchMin: parseCount(element, 'match-min', 0),
        matchMax: parseCount(element, 'match-max', 1),
        content: getChoiceText(element),
        matchGroups: getMatchGroups(element),
      },
    }];
  });
}

/**
 * Warn about identifiers shared by more than one choice: QTI requires them to
 * be unique within the interaction, and associations can't tell them apart.
 */
export function warnDuplicateIdentifiers(choices: MatchChoice[]): void {
  const seen = new Set<string>();
  for (const { choice } of choices) {
    if (seen.has(choice.id)) {
      console.warn(`qti-match-interaction has more than one choice with identifier "${choice.id}"`);
    }
    seen.add(choice.id);
  }
}

/**
 * A choice's rendered content: its children transformed, for rich content
 * (HTML/MathML), or its plain text without a transformer.
 */
export function renderChoiceContent(choice: MatchChoice, context: TransformContext): Node {
  return context.transformChildren
    ? context.transformChildren(choice.element)
    : document.createTextNode(choice.choice.content);
}

/**
 * The id of the element labeling a choice: a target column's header, or a
 * table's row or column header.
 */
export const choiceLabelId = (responseIdentifier: string, choiceId: string): string =>
  `cutie-match-label-${responseIdentifier}-${choiceId}`;
