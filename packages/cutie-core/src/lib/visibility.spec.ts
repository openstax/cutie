import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
// Test fixture only: the official 1EdTech example the example app carries
import { item as templateImageItem } from '../../../cutie-example/src/example-items/spec-template-image';
import { beginAttempt, submitResponse } from '../index';

const speeds: Record<string, number> = { plane: 600, train: 200, bus: 50 };

describe('template conditionals on the official template_image example', () => {
  test.each(Array.from({ length: 10 }, (_, i) => i))('shows only the transport template processing chose (run %i)', async () => {
    const { state, template } = await beginAttempt(templateImageItem);
    const transport = state.variables.TRANSPORT as string;
    const doc = new DOMParser().parseFromString(template, 'text/xml');
    const images = Array.from(doc.getElementsByTagName('img')).map((img) => img.getAttribute('src'));

    expect(images).toEqual([`images/${transport}.png`]);
    // The picture reaches the client as plain content, with no template element around it
    expect(doc.getElementsByTagName('qti-template-inline')).toHaveLength(0);
    expect(template).toContain(`average speed of ${speeds[transport]} km/h`);

    // The correct response template processing set is this attempt's
    expect(state.correctResponses).toEqual({ RESPONSE: 3 * speeds[transport] });
    const result = await submitResponse({ RESPONSE: String(3 * speeds[transport]) }, state, templateImageItem);
    expect(result.state.variables.SCORE).toBe(1);
  });
});
