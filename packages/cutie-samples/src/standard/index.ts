import type { SampleGroup } from '../types';
import { choice } from './choice';
import { choiceMultiple } from './choice-multiple';
import { extendedText } from './extended-text';
import { formula } from './formula';
import { gapMatch } from './gap-match';
import { inlineChoice } from './inline-choice';
import { inlineChoiceMultiple } from './inline-choice-multiple';
import { match } from './match';
import { textEntry } from './text-entry';
import { textEntryMultiple } from './text-entry-multiple';
import { textEntryNumeric } from './text-entry-numeric';

export const standard: SampleGroup = {
  id: 'standard',
  label: 'Standard',
  description: `\
Canonical OpenStax items for each supported interaction type. They show how we \
write questions, feedback, and response processing. Response processing follows \
the patterns the Cutie editor generates, so these items can be opened and edited \
there without being treated as custom response processing.`,
  samples: [
    choice,
    choiceMultiple,
    textEntry,
    textEntryNumeric,
    textEntryMultiple,
    inlineChoice,
    inlineChoiceMultiple,
    match,
    gapMatch,
    extendedText,
    formula,
  ],
};
