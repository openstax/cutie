import { nclex } from './nclex/index.js';
import { standard } from './standard/index.js';
import type { Sample, SampleGroup } from './types.js';

export type { Sample, SampleGroup } from './types.js';
export { nclex } from './nclex/index.js';
export { standard } from './standard/index.js';

export const sampleGroups: SampleGroup[] = [
  standard,
  nclex,
];

export const samples: Sample[] = sampleGroups.flatMap(group => group.samples);
