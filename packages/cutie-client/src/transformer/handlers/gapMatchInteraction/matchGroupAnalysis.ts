/**
 * Structural analysis of a gap-match interaction's match-group data.
 *
 * The grouped presentation is derived entirely from the item's data — there
 * is no layout flag. When every choice declares exactly one target group the
 * choices can be visually clustered by group, and when the content blocks
 * additionally partition the gaps by group each block can be rendered as a
 * column with its group's choices banked beneath it. Items whose data does
 * not prove either shape (no groups, multi-group choices, gaps mixed within
 * a block, etc.) fall back to the plain presentation.
 */

export interface MatchGroupAnalysis {
  /**
   * Ordered list of groups to cluster the choices by (order of first
   * appearance among gaps in document order), or null when the choices
   * cannot be clustered: a choice with zero or multiple match-groups, fewer
   * than two distinct groups, or a choice group no gap accepts.
   */
  trayGroups: string[] | null;
  /**
   * Per top-level content block, the single match-group of the gaps it
   * contains — or null when the blocks do not partition the gaps by group
   * (a gap with zero or multiple groups, a block without gaps or mixing
   * groups, a group spanning blocks, or fewer than two blocks). Non-null
   * only when trayGroups is non-null.
   */
  blockGroups: string[] | null;
}

const NO_GROUPING: MatchGroupAnalysis = { trayGroups: null, blockGroups: null };

function parseGroups(element: Element): string[] {
  return (element.getAttribute('match-group') ?? '').split(/\s+/).filter(Boolean);
}

function collectGaps(element: Element, out: Element[]): void {
  if (element.tagName.toLowerCase() === 'qti-gap') {
    out.push(element);
    return;
  }
  for (const child of Array.from(element.children)) {
    collectGaps(child, out);
  }
}

/**
 * Analyze the source qti-gap-match-interaction element's match-group data.
 */
export function analyzeMatchGroups(interaction: Element): MatchGroupAnalysis {
  const choiceGroups: string[][] = [];
  const blocks: Element[] = [];

  for (const child of Array.from(interaction.children)) {
    const tagName = child.tagName.toLowerCase();
    if (tagName === 'qti-gap-text' || tagName === 'qti-gap-img') {
      choiceGroups.push(parseGroups(child));
    } else if (tagName !== 'qti-prompt') {
      blocks.push(child);
    }
  }

  // Choices cluster only when every choice has exactly one target group.
  if (choiceGroups.length === 0 || choiceGroups.some((groups) => groups.length !== 1)) {
    return NO_GROUPING;
  }

  const distinctChoiceGroups = new Set(choiceGroups.map((groups) => groups[0]));
  if (distinctChoiceGroups.size < 2) {
    return NO_GROUPING;
  }

  // Every choice group must correspond to at least one gap that accepts it,
  // and section order follows the gaps' document order.
  const gaps: Element[] = [];
  for (const block of blocks) {
    collectGaps(block, gaps);
  }

  const trayGroups: string[] = [];
  for (const gap of gaps) {
    for (const group of parseGroups(gap)) {
      if (distinctChoiceGroups.has(group) && !trayGroups.includes(group)) {
        trayGroups.push(group);
      }
    }
  }
  if (trayGroups.length !== distinctChoiceGroups.size) {
    return NO_GROUPING;
  }

  return { trayGroups, blockGroups: deriveBlockGroups(blocks) };
}

/**
 * Determine whether the top-level content blocks partition the gaps by
 * group, returning each block's group in document order — or null.
 */
function deriveBlockGroups(blocks: Element[]): string[] | null {
  if (blocks.length < 2) return null;

  const blockGroups: string[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const gaps: Element[] = [];
    collectGaps(block, gaps);
    if (gaps.length === 0) return null;

    let blockGroup: string | null = null;
    for (const gap of gaps) {
      const gapGroups = parseGroups(gap);
      if (gapGroups.length !== 1) return null;
      if (blockGroup === null) {
        blockGroup = gapGroups[0];
      } else if (blockGroup !== gapGroups[0]) {
        return null;
      }
    }
    if (blockGroup === null || seen.has(blockGroup)) return null;

    seen.add(blockGroup);
    blockGroups.push(blockGroup);
  }

  return blockGroups;
}
