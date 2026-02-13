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
import * as textEntryPartialStandard from './standard-text-entry-partial';
import * as choiceHorizontalStandard from './standard-choice-horizontal';
import * as choicePartialStandard from './standard-choice-partial';
import * as multiInteractionStandard from './standard-multi-interaction';
import * as adaptiveMontyHall from './spec-adaptive-monty-hall';
import * as formulaStrict from './formula-strict';
import * as formulaCanonical from './formula-canonical';
import * as formulaAlgebraic from './formula-algebraic';
import * as extendedTextScored from './extended-text-scored';
import * as extendedTextScoredRich from './extended-text-scored-rich';
import * as variantChoiceLabels from './variant-choice-labels';
import * as variantChoiceLayout from './variant-choice-layout';
import * as variantExtendedTextSizes from './variant-extended-text-sizes';
import * as variantExtendedTextPattern from './variant-extended-text-pattern';

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
  adaptiveMontyHall,
];

/* these were made just to show different types of feedback */
export const feedbackTypes = [
  modalFeedback,
  inlineFeedback,
  blockFeedback,
];

/* externally scored items that use AI for scoring */
export const aiScoredExamples = [
  extendedTextScored,
  extendedTextScoredRich,
];

/* math formula entry examples demonstrating different comparison modes */
export const formulaExamples = [
  formulaStrict,
  formulaCanonical,
  formulaAlgebraic,
];

/* variant testing examples for visual verification of CSS/layout features */
export const variantExamples = [
  variantChoiceLabels,
  variantChoiceLayout,
  variantExtendedTextSizes,
  variantExtendedTextPattern,
];

/* these examples were made for each interaction type to show editor-supported
 * response processing and feedback patterns, and show extensive feedback as
 * we would expect to see in real assessment items */
export const standardExamples = [
  choiceStandard,
  choiceMultipleStandard,
  choiceHorizontalStandard,
  textEntryStandard,
  textEntryMulti,
  inlineChoiceStandard,
  inlineChoiceMulti,
  matchStandard,
  gapMatchStandard,
  textEntryPartialStandard,
  choicePartialStandard,
  multiInteractionStandard,
];

export const exampleGroups: ExampleGroup[] = [
  {
    label: 'Supported Examples',
    items: standardExamples,
  },
  {
    label: 'AI Scored',
    items: aiScoredExamples,
  },
  {
    label: 'Math Formula Entry',
    items: formulaExamples,
  },
  {
    label: 'Variant Testing',
    items: variantExamples,
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
