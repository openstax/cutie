/* spell-checker: ignore hotspot hottext */
import { sampleGroups, samples } from '@openstax/cutie-samples';

export interface ExampleItem {
  name: string;
  item: string;
  interactionTypes: string[];
  /** Markdown authoring guidance, provided by canonical samples */
  description?: string;
}

export interface ExampleGroup {
  label: string;
  items: ExampleItem[];
}

import * as choice from './choice.js';
import * as choiceMultiple from './choice-multiple.js';
import * as textEntry from './text-entry.js';
import * as textEntryMulti from './text-entry-multi.js';
import * as inlineChoice from './inline-choice.js';
import * as inlineChoiceMulti from './inline-choice-multi.js';
import * as match from './match.js';
import * as gapMatch from './gap-match.js';
import * as order from './order.js';
import * as slider from './slider.js';
import * as hotspot from './hotspot.js';
import * as extendedText from './extended-text.js';
import * as associate from './associate.js';
import * as hottext from './hottext.js';
import * as hottextMultiple from './hottext-multiple.js';
import * as hottextHighlightFindings from './hottext-highlight-findings.js';
import * as hottextHighlightTable from './hottext-highlight-table.js';
import * as math from './math.js';
import * as selectPoint from './select-point.js';
import * as multiInput from './multi-input.js';
import * as modalFeedback from './modal-feedback.js';
import * as inlineFeedback from './inline-feedback.js';
import * as blockFeedback from './block-feedback.js';
import * as choiceMultipleStandard from './standard-choice-multiple-wrong-choice-feedback.js';
import * as inlineChoiceRationaleDyad from './standard-inline-choice-rationale-dyad.js';
import * as inlineChoiceRationaleTriad from './standard-inline-choice-rationale-triad.js';
import * as textEntryPartialStandard from './standard-text-entry-partial.js';
import * as choiceHorizontalStandard from './standard-choice-horizontal.js';
import * as choicePartialStandard from './standard-choice-partial.js';
import * as multiInteractionStandard from './standard-multi-interaction.js';
import * as adaptiveMontyHall from './spec-adaptive-monty-hall.js';
import * as templateImage from './spec-template-image.js';
import * as templateDigging from './template-digging.js';
import * as templateRounding from './template-rounding.js';
import * as formulaStrict from './formula-strict.js';
import * as formulaCanonical from './formula-canonical.js';
import * as formulaAlgebraic from './formula-algebraic.js';
import * as extendedTextScored from './extended-text-scored.js';
import * as extendedTextScoredRich from './extended-text-scored-rich.js';
import * as variantChoiceLabels from './variant-choice-labels.js';
import * as variantChoiceLayout from './variant-choice-layout.js';
import * as variantExtendedTextLayouts from './variant-extended-text-layouts.js';
import * as variantExtendedTextPattern from './variant-extended-text-pattern.js';
import * as variantGapMatchLayout from './variant-gap-match-layout.js';
import * as variantBowtieLayout from './variant-bowtie-layout.js';

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
  hottextMultiple,
  hottextHighlightFindings,
  hottextHighlightTable,
  math,
  selectPoint,
  multiInput,
  adaptiveMontyHall,
  templateDigging,
  templateImage,
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

/* items using template processing to randomize values per attempt */
export const templateExamples = [
  templateRounding,
];

/* variant testing examples for visual verification of CSS/layout features */
export const variantExamples = [
  variantChoiceLabels,
  variantChoiceLayout,
  variantExtendedTextLayouts,
  variantExtendedTextPattern,
  variantGapMatchLayout,
  variantBowtieLayout,
];

/* these examples were made for each interaction type to show editor-supported
 * response processing and feedback patterns, and show extensive feedback as
 * we would expect to see in real assessment items */
export const standardExamples = [
  choiceMultipleStandard,
  choiceHorizontalStandard,
  textEntryMulti,
  inlineChoiceMulti,
  inlineChoiceRationaleDyad,
  inlineChoiceRationaleTriad,
  textEntryPartialStandard,
  choicePartialStandard,
  multiInteractionStandard,
];

/* references for AI item generation: the canonical samples, with their
 * authoring guidance, plus the supported feature examples */
export const generationExamples: ExampleItem[] = [
  ...samples,
  ...standardExamples,
];

export const exampleGroups: ExampleGroup[] = [
  ...sampleGroups.map(group => ({
    label: `${group.label} Samples`,
    items: group.samples,
  })),
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
    label: 'Templated Items',
    items: templateExamples,
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
