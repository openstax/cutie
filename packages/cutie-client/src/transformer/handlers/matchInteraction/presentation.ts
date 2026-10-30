import type { TransformContext } from '../../types.js';
import type { parseDirectedPair } from '../evaluation/index.js';
import type { MatchChoice } from './choices.js';

export type DirectedPair = NonNullable<ReturnType<typeof parseDirectedPair>>;

/**
 * What the shared interaction code needs of either presentation's controller.
 */
export interface MatchView {
  initialize(): void;
  initializeFromDefaults(defaults: string[]): void;
  associationCount(choiceId: string): number;
  getResponse(): string[];
  setEnabled(enabled: boolean): void;
}

/**
 * What a presentation is drawn from: the interaction, the container to draw
 * it into, and its choices.
 */
export interface PresentationInput {
  element: Element;
  container: HTMLElement;
  context: TransformContext;
  responseIdentifier: string;
  maxAssociations: number;
  sources: MatchChoice[];
  targets: MatchChoice[];
}

/**
 * A drawn presentation of the interaction: its controller, how to draw the
 * correct-answer key of an evaluation, and how to clear the marks of the key
 * that describe the response, once the learner edits it.
 */
export interface MatchPresentation {
  controller: MatchView;
  drawKey(pairs: DirectedPair[]): void;
  clearResponseMarks(): void;
}
