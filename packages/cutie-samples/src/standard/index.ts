import type { SampleGroup } from '../types.js';
import { choiceMultiple } from './choice-multiple.js';
import { choice } from './choice.js';
import { extendedText } from './extended-text.js';
import { formula } from './formula.js';
import { gapMatch } from './gap-match.js';
import { inlineChoiceMultiple } from './inline-choice-multiple.js';
import { inlineChoice } from './inline-choice.js';
import { match } from './match.js';
import { textEntryMultiple } from './text-entry-multiple.js';
import { textEntryNumeric } from './text-entry-numeric.js';
import { textEntry } from './text-entry.js';

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
