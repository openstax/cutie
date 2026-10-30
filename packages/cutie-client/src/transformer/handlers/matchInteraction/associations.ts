/**
 * A choice of either match set, as the association rules see it.
 */
export interface AssociableChoice {
  id: string;
  matchMin: number;
  matchMax: number;
  content: string;
  // The identifiers of the opposite-set choices this choice may associate with.
  // Empty = unrestricted.
  matchGroups: string[];
}

interface ChoiceState extends Omit<AssociableChoice, 'matchGroups'> {
  matchGroups: Set<string>;
  connectedIds: Set<string>;
}

/**
 * A source→target association, as its two choices' identifiers.
 */
export interface Pair {
  sourceId: string;
  targetId: string;
}

/**
 * Why a pair can't be added:
 * - `'unknown'`: a choice isn't in the interaction
 * - `'made'`: the pair is already made
 * - `'group'`: match-group rules it out
 * - `'source-full'` / `'target-full'`: that choice's match-max is used up
 * - `'max-associations'`: the interaction's max-associations is reached
 */
export type AddBlocker = 'unknown' | 'made' | 'group' | 'source-full' | 'target-full' | 'max-associations';

/**
 * The associations of a match interaction and the rules that limit them:
 * match-group, each choice's match-max, and max-associations. It holds no
 * DOM; each presentation of the interaction (word banks and slots, or a
 * table) draws and edits the associations through it.
 */
export class MatchAssociations {
  private associations = new Set<string>(); // "sourceId targetId" pairs
  private choices = new Map<string, ChoiceState>();
  private sources: string[] = [];
  private targets: string[] = [];

  constructor(private readonly maxAssociations: number = 0) {}

  get sourceIds(): readonly string[] {
    return this.sources;
  }

  get targetIds(): readonly string[] {
    return this.targets;
  }

  addSource(choice: AssociableChoice): void {
    this.addChoice(choice);
    this.sources.push(choice.id);
  }

  addTarget(choice: AssociableChoice): void {
    this.addChoice(choice);
    this.targets.push(choice.id);
  }

  private addChoice(choice: AssociableChoice): void {
    this.choices.set(choice.id, {
      ...choice,
      matchGroups: new Set(choice.matchGroups),
      connectedIds: new Set(),
    });
  }

  hasChoice(id: string): boolean {
    return this.choices.has(id);
  }

  /** A choice's plain-text name, for announcements and accessible labels. */
  content(id: string): string {
    return this.choices.get(id)?.content ?? '';
  }

  matchMin(id: string): number {
    return this.choices.get(id)?.matchMin ?? 0;
  }

  matchMax(id: string): number {
    return this.choices.get(id)?.matchMax ?? 0;
  }

  /**
   * Whether a source→target association is allowed by match-group. A choice
   * with no groups is unrestricted; where a side declares groups, it must name
   * the other choice's identifier.
   */
  groupsAllow(sourceId: string, targetId: string): boolean {
    const sourceGroups = this.choices.get(sourceId)?.matchGroups;
    const targetGroups = this.choices.get(targetId)?.matchGroups;

    if (sourceGroups?.size && !sourceGroups.has(targetId)) return false;
    if (targetGroups?.size && !targetGroups.has(sourceId)) return false;
    return true;
  }

  /**
   * The most associations a target can ever hold: its match-max, the sources
   * allowed to pair with it, and max-associations, whichever is smallest.
   */
  capacity(targetId: string): number {
    const matchMax = this.matchMax(targetId);
    const allowedSources = this.sources.filter((sourceId) => this.groupsAllow(sourceId, targetId)).length;
    return Math.min(
      matchMax > 0 ? matchMax : Infinity,
      this.maxAssociations > 0 ? this.maxAssociations : Infinity,
      allowedSources
    );
  }

  has(sourceId: string, targetId: string): boolean {
    return this.associations.has(`${sourceId} ${targetId}`);
  }

  /**
   * What stops a source→target pair from being added, or null if it can be:
   * match-group, the pair already being made, room under both choices'
   * match-max, and room under max-associations. `freed` are made pairs that
   * are removed in the same edit (a replaced or moved pair), so the rules see
   * them as gone.
   */
  blocker(sourceId: string, targetId: string, freed: Pair[] = []): AddBlocker | null {
    if (!this.hasChoice(sourceId) || !this.hasChoice(targetId)) return 'unknown';
    if (!this.groupsAllow(sourceId, targetId)) return 'group';

    const removed = freed.filter((pair) => this.has(pair.sourceId, pair.targetId));
    const isFreed = (pair: Pair) => pair.sourceId === sourceId && pair.targetId === targetId;
    if (this.has(sourceId, targetId) && !removed.some(isFreed)) return 'made';

    const countAfter = (id: string) =>
      this.associationCount(id) - removed.filter((pair) => pair.sourceId === id || pair.targetId === id).length;
    if (!this.hasRoom(sourceId, countAfter(sourceId))) return 'source-full';
    if (!this.hasRoom(targetId, countAfter(targetId))) return 'target-full';

    if (this.maxAssociations > 0 && this.associations.size - removed.length >= this.maxAssociations) {
      return 'max-associations';
    }
    return null;
  }

  /** Whether a pair can be added (see blocker). */
  canAdd(sourceId: string, targetId: string, freed: Pair[] = []): boolean {
    return this.blocker(sourceId, targetId, freed) === null;
  }

  /**
   * Whether a choice with `count` associations has room for another under
   * its match-max.
   */
  private hasRoom(choiceId: string, count = this.associationCount(choiceId)): boolean {
    const matchMax = this.matchMax(choiceId);
    return matchMax === 0 || count < matchMax;
  }

  /**
   * Record an association. Only the pair being new is checked: callers check
   * the rules with canAdd first, freeing any pairs the edit replaces.
   */
  add(sourceId: string, targetId: string): boolean {
    const key = `${sourceId} ${targetId}`;
    if (this.associations.has(key)) return false;

    this.associations.add(key);
    this.choices.get(sourceId)?.connectedIds.add(targetId);
    this.choices.get(targetId)?.connectedIds.add(sourceId);
    return true;
  }

  remove(sourceId: string, targetId: string): boolean {
    const key = `${sourceId} ${targetId}`;
    if (!this.associations.delete(key)) return false;

    this.choices.get(sourceId)?.connectedIds.delete(targetId);
    this.choices.get(targetId)?.connectedIds.delete(sourceId);
    return true;
  }

  /** The pairs a source is in. */
  pairsOf(sourceId: string): Pair[] {
    return Array.from(this.choices.get(sourceId)?.connectedIds ?? [], (targetId) => ({ sourceId, targetId }));
  }

  /**
   * The number of associations a choice currently has.
   */
  associationCount(choiceId: string): number {
    return this.choices.get(choiceId)?.connectedIds.size ?? 0;
  }

  /**
   * Whether a source has nothing left to place: its match-max is used up, or
   * it is already paired with every target it may associate with.
   */
  isSourceExhausted(sourceId: string): boolean {
    if (!this.hasRoom(sourceId)) return true;
    return this.targets.every(
      (targetId) => !this.groupsAllow(sourceId, targetId) || this.has(sourceId, targetId)
    );
  }

  /**
   * The associations as directed pairs ("sourceId targetId").
   */
  pairs(): string[] {
    return Array.from(this.associations);
  }
}
