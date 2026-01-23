/* spell-checker: ignore hotspot hottext */
export interface ExampleItem {
  name: string;
  item: string;
}

import * as choice from './choice';
import * as choiceMultiple from './choice-multiple';
import * as textEntry from './text-entry';
import * as inlineChoice from './inline-choice';
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

export const examples: ExampleItem[] = [
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
];
