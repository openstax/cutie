/* spell-checker: ignore hotspot hottext */
export interface ExampleItem {
  name: string;
  item: string;
  interactionTypes: string[];
}

export interface ExampleGroup {
  label: string;
  items: ExampleItem[];
}

import * as choice from './choice';
import * as choiceMultiple from './choice-multiple';
import * as textEntry from './text-entry';
import * as textEntryMulti from './text-entry-multi';
import * as inlineChoice from './inline-choice';
import * as inlineChoiceMulti from './inline-choice-multi';
import * as match from './match';
import * as gapMatch from './gap-match';
import * as order from './order';
import * as slider from './slider';
import * as hotspot from './hotspot';
import * as extendedText from './extended-text';
import * as associate from './associate';
import * as hottext from './hottext';
import * as math from './math';
import * as selectPoint from './select-point';
import * as multiInput from './multi-input';
import * as modalFeedback from './modal-feedback';
import * as inlineFeedback from './inline-feedback';
import * as blockFeedback from './block-feedback';
import * as choiceFeedback from './choice-feedback';
import * as choiceMultipleFeedback from './choice-multiple-feedback';
import * as textEntryFeedback from './text-entry-feedback';
import * as inlineChoiceFeedback from './inline-choice-feedback';
import * as matchFeedback from './match-feedback';
import * as gapMatchFeedback from './gap-match-feedback';
import * as multiInteractionFeedback from './multi-interaction-feedback';

export const specExamples = [
  choice,
  choiceMultiple,
  textEntry,
  inlineChoice,
  match,
  gapMatch,
  order,
  slider,
  hotspot,
  extendedText,
  associate,
  hottext,
  math,
  selectPoint,
  multiInput,
];

export const customExamples = [
  textEntryMulti,
  inlineChoiceMulti,
  modalFeedback,
  inlineFeedback,
  blockFeedback,
  choiceFeedback,
  choiceMultipleFeedback,
  textEntryFeedback,
  inlineChoiceFeedback,
  matchFeedback,
  gapMatchFeedback,
  multiInteractionFeedback,
];

export const exampleGroups: ExampleGroup[] = [
  {
    label: 'Custom Examples',
    items: customExamples,
  },
  {
    label: 'QTI Spec Examples',
    items: specExamples,
  },
];

// Flat list for backwards compatibility
export const examples: ExampleItem[] = exampleGroups.flatMap(g => g.items);
