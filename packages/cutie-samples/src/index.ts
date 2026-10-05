import { standard } from './standard';
import type { Sample, SampleGroup } from './types';

export type { Sample, SampleGroup } from './types';
export { standard } from './standard';

export const sampleGroups: SampleGroup[] = [
  standard,
];

export const samples: Sample[] = sampleGroups.flatMap(group => group.samples);
