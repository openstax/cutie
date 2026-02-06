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
import * as choiceStandard from './standard-choice';
import * as choiceMultipleStandard from './standard-choice-multiple';
import * as textEntryStandard from './standard-text-entry';
import * as inlineChoiceStandard from './standard-inline-choice';
import * as matchStandard from './standard-match';
import * as gapMatchStandard from './standard-gap-match';
import * as multiInteractionStandard from './standard-multi-interaction';

/* these examples are copied exactly from examples in the spec
 * documents, they are used for verification that cutie works
 * correctly on official samples */
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

/* these were made just to show different types of feedback */
export const feedbackTypes = [
  modalFeedback,
  inlineFeedback,
  blockFeedback,
];

/* these examples were made for each interaction type to show editor-supported
 * response processing and feedback patterns, and show extensive feedback as
 * we would expect to see in real assessment items */
export const standardExamples = [
  textEntryMulti,
  inlineChoiceMulti,
  choiceStandard,
  choiceMultipleStandard,
  textEntryStandard,
  inlineChoiceStandard,
  matchStandard,
  gapMatchStandard,
  multiInteractionStandard,
];

export const exampleGroups: ExampleGroup[] = [
  {
    label: 'Supported Examples',
    items: standardExamples,
  },
  {
    label: 'Feedback Types',
    items: feedbackTypes,
  },
  {
    label: 'QTI Spec Examples',
    items: specExamples,
  },
];

// Flat list for backwards compatibility
export const examples: ExampleItem[] = exampleGroups.flatMap(g => g.items);
