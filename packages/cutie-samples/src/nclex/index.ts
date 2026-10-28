import type { SampleGroup } from '../types.js';
import { bowtie } from './bowtie.js';
import { dragAndDropCloze } from './drag-and-drop-cloze.js';
import { dragAndDropRationale } from './drag-and-drop-rationale.js';
import { dropDownCloze } from './drop-down-cloze.js';
import { dropDownRationale } from './drop-down-rationale.js';
import { dropDownTable } from './drop-down-table.js';
import { highlightPassage } from './highlight-passage.js';
import { highlightTable } from './highlight-table.js';
import { selectAll } from './select-all.js';
import { selectN } from './select-n.js';

export const nclex: SampleGroup = {
  id: 'nclex',
  label: 'NCLEX',
  description: `\
OpenStax items written in the style of NCLEX questions for nursing courses. Each \
sample follows the format and scoring rule of one NCLEX question type, so items \
written from it work the same way they do on the exam. NCLEX types use three \
scoring rules: +/- (each correct selection earns a point, each incorrect \
selection loses one, minimum 0), 0/1 (each correct selection or blank earns a \
point), and rationale (all parts of a cause-and-effect statement must be correct). \
Use the rule shown in the sample for its type, even where the standard sample for \
the same interaction scores differently.`,
  samples: [
    selectAll,
    selectN,
    dropDownCloze,
    dropDownRationale,
    dropDownTable,
    dragAndDropCloze,
    dragAndDropRationale,
    highlightPassage,
    highlightTable,
    bowtie,
  ],
};
