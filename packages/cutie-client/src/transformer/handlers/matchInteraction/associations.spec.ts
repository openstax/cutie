import { describe, expect, it } from 'vitest';
import { type AssociableChoice, MatchAssociations } from './associations.js';

const choice = (id: string, overrides: Partial<AssociableChoice> = {}): AssociableChoice => ({
  id, matchMin: 0, matchMax: 1, content: id, matchGroups: [], ...overrides,
});

const build = (maxAssociations = 0, sources = [choice('S1'), choice('S2')], targets = [choice('T1'), choice('T2')]) => {
  const model = new MatchAssociations(maxAssociations);
  sources.forEach((source) => model.addSource(source));
  targets.forEach((target) => model.addTarget(target));
  return model;
};

describe('MatchAssociations', () => {
  it('records pairs in order and counts them per choice', () => {
    const model = build(0, [choice('S1', { matchMax: 0 })]);
    expect(model.add('S1', 'T2')).toBe(true);
    expect(model.add('S1', 'T1')).toBe(true);
    expect(model.add('S1', 'T1')).toBe(false);
    expect(model.pairs()).toEqual(['S1 T2', 'S1 T1']);
    expect(model.associationCount('S1')).toBe(2);
    expect(model.pairsOf('S1')).toEqual([{ sourceId: 'S1', targetId: 'T2' }, { sourceId: 'S1', targetId: 'T1' }]);

    expect(model.remove('S1', 'T2')).toBe(true);
    expect(model.remove('S1', 'T2')).toBe(false);
    expect(model.associationCount('T2')).toBe(0);
  });

  it('allows a new pair only within both match-maxes', () => {
    const model = build();
    model.add('S1', 'T1');
    expect(model.blocker('S1', 'T1')).toBe('made');
    expect(model.blocker('S1', 'T2')).toBe('source-full');
    expect(model.blocker('S2', 'T1')).toBe('target-full');
    expect(model.blocker('S2', 'T2')).toBeNull();
    expect(model.canAdd('S2', 'T2')).toBe(true);
  });

  it('sees freed pairs as gone', () => {
    const model = build(1);
    model.add('S1', 'T1');
    const freed = [{ sourceId: 'S1', targetId: 'T1' }];
    // Moving S1 to T2 frees its room and the association count
    expect(model.blocker('S1', 'T2', freed)).toBeNull();
    // Replacing S1 in T1 frees T1
    expect(model.blocker('S2', 'T1', freed)).toBeNull();
    // Re-adding a freed pair is allowed
    expect(model.blocker('S1', 'T1', freed)).toBeNull();
    // A pair that isn't made frees nothing
    expect(model.blocker('S2', 'T2', [{ sourceId: 'S2', targetId: 'T1' }])).toBe('max-associations');
  });

  it('blocks pairs with a choice it doesn\'t know', () => {
    expect(build().blocker('S1', 'X')).toBe('unknown');
  });

  it('treats a match-max of 0 as unlimited', () => {
    const model = build(0, [choice('S1', { matchMax: 0 })], [choice('T1', { matchMax: 0 }), choice('T2', { matchMax: 0 })]);
    model.add('S1', 'T1');
    expect(model.canAdd('S1', 'T2')).toBe(true);
  });

  it('allows no pair beyond max-associations', () => {
    const model = build(1);
    model.add('S1', 'T1');
    expect(model.blocker('S2', 'T2')).toBe('max-associations');
  });

  it('restricts pairs by match-group on either side', () => {
    const model = build(0, [choice('S1', { matchGroups: ['T1'] }), choice('S2')], [choice('T1'), choice('T2', { matchGroups: ['S1'] })]);
    expect(model.groupsAllow('S1', 'T1')).toBe(true);
    expect(model.groupsAllow('S1', 'T2')).toBe(false);
    expect(model.groupsAllow('S2', 'T2')).toBe(false);
    expect(model.blocker('S2', 'T2')).toBe('group');
  });

  it('caps a target\'s capacity by its match-max, the sources allowed, and max-associations', () => {
    const unlimited = { matchMax: 0 };
    expect(build(0, undefined, [choice('T1', unlimited)]).capacity('T1')).toBe(2);
    expect(build(0, undefined, [choice('T1', { matchMax: 1 })]).capacity('T1')).toBe(1);
    expect(build(1, undefined, [choice('T1', unlimited)]).capacity('T1')).toBe(1);
  });

  it('exhausts a source when it is full or paired with every target it may take', () => {
    const model = build(0, [choice('S1', { matchMax: 0, matchGroups: ['T1'] })]);
    expect(model.isSourceExhausted('S1')).toBe(false);
    model.add('S1', 'T1');
    expect(model.isSourceExhausted('S1')).toBe(true);
  });
});
