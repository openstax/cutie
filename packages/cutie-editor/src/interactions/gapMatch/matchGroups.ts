import { Editor, Element, Node, Transforms } from 'slate';
import type { Path } from 'slate';
import type { MatchGroup, QtiGapMatchInteraction } from '../../types.js';

/**
 * QTI has no vocabulary for labeling a match-group, so a word-bank heading is
 * an ordinary heading inside the interaction, tied to its group by this custom
 * data attribute (QTI's extension point for behavior beyond the spec).
 */
export const MATCH_GROUP_HEADING_ATTRIBUTE = 'data-for-match-group';

/**
 * Whether an XML element is a word-bank heading
 */
export function isMatchGroupHeading(element: globalThis.Element): boolean {
  return (
    /^h[1-6]$/.test(element.tagName.toLowerCase()) &&
    element.hasAttribute(MATCH_GROUP_HEADING_ATTRIBUTE)
  );
}

/**
 * Split a match-group attribute (an IdentifierList) into its identifiers
 */
export function parseMatchGroupAttribute(value: string | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean);
}

function isGroupedNode(node: Node): node is Element & { attributes: Record<string, string | undefined> } {
  return (
    Element.isElement(node) &&
    (node.type === 'qti-gap-text' || node.type === 'qti-gap-img' || node.type === 'qti-gap')
  );
}

/**
 * The interaction's match-groups: those the author declared, then any other
 * group a choice or gap names (e.g. from imported XML without headings)
 */
export function getMatchGroups(interaction: QtiGapMatchInteraction): MatchGroup[] {
  const groups = [...(interaction.matchGroups ?? [])];
  const known = new Set(groups.map((group) => group.identifier));
  for (const [node] of Node.descendants(interaction)) {
    if (!isGroupedNode(node)) continue;
    for (const identifier of parseMatchGroupAttribute(node.attributes['match-group'])) {
      if (!known.has(identifier)) {
        known.add(identifier);
        groups.push({ identifier, heading: '' });
      }
    }
  }
  return groups;
}

/**
 * The nearest gap-match interaction containing a path
 */
export function findGapMatchInteraction(
  editor: Editor,
  path: Path
): { interaction: QtiGapMatchInteraction; interactionPath: Path } | null {
  const entry = Editor.above<QtiGapMatchInteraction>(editor, {
    at: path,
    match: (n) => Element.isElement(n) && n.type === 'qti-gap-match-interaction',
  });
  return entry ? { interaction: entry[0], interactionPath: entry[1] } : null;
}

/**
 * Generate a match-group identifier not already in use
 */
export function generateMatchGroupId(groups: MatchGroup[]): string {
  const used = new Set(groups.map((group) => group.identifier));
  let n = groups.length + 1;
  while (used.has(`group${n}`)) n++;
  return `group${n}`;
}

/**
 * Replace the interaction's declared match-groups
 */
export function setMatchGroups(editor: Editor, interactionPath: Path, groups: MatchGroup[]): void {
  Transforms.setNodes(editor, { matchGroups: groups } as Partial<QtiGapMatchInteraction>, {
    at: interactionPath,
  });
}

/**
 * Remove a match-group: drop its declaration and take it off every choice and
 * gap that names it
 */
export function removeMatchGroup(editor: Editor, interactionPath: Path, identifier: string): void {
  Editor.withoutNormalizing(editor, () => {
    const interaction = Node.get(editor, interactionPath) as QtiGapMatchInteraction;
    setMatchGroups(
      editor,
      interactionPath,
      getMatchGroups(interaction).filter((group) => group.identifier !== identifier)
    );

    for (const [node, nodePath] of Node.descendants(interaction)) {
      if (!isGroupedNode(node)) continue;
      const current = parseMatchGroupAttribute(node.attributes['match-group']);
      if (!current.includes(identifier)) continue;

      const remaining = current.filter((group) => group !== identifier);
      const attributes = { ...node.attributes };
      if (remaining.length > 0) {
        attributes['match-group'] = remaining.join(' ');
      } else {
        delete attributes['match-group'];
      }
      Transforms.setNodes(editor, { attributes } as Partial<Node>, { at: [...interactionPath, ...nodePath] });
    }
  });
}
