# @openstax/cutie-samples

Canonical QTI v3 assessment items showing how OpenStax writes each question type:
the structure of the question, its feedback, and its response processing.

Each sample includes the complete item XML and a Markdown description of the
authoring conventions it demonstrates. The descriptions are written for tools and
people creating new items, such as authoring guides or item generation prompts.

## Installation

```bash
npm install @openstax/cutie-samples
```

## Usage

```ts
import { sampleGroups, samples, standard } from '@openstax/cutie-samples';

// every sample, grouped by category
for (const group of sampleGroups) {
  console.log(group.label, group.description);
  for (const sample of group.samples) {
    console.log(sample.id, sample.name, sample.interactionTypes);
  }
}

// a single sample
const choice = standard.samples.find(sample => sample.id === 'choice');
console.log(choice?.description);
console.log(choice?.item); // QTI v3 XML
```

## Groups

- **Standard**: the default pattern for each supported interaction type.

## Guarantees

The package's tests check that every sample:

- uses response processing the Cutie editor can manage (not `custom`)
- declares a correct response for every automatically scored response
- sets every feedback identifier it shows
- scores its correct response as fully correct, and an incorrect response as 0,
  through `@openstax/cutie-core`
