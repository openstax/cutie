/* spell-checker: ignore idempotently */
import { describe, expect, it, vi } from 'vitest';
import type { StyleManager } from '../transformer/types';
import { createParagraphValidationAggregator } from './validationDisplay';

function createMockStyleManager(): StyleManager {
  const styles = new Map<string, string>();
  return {
    addStyle: vi.fn((id: string, css: string) => {
      styles.set(id, css);
    }),
    hasStyle: vi.fn((id: string) => styles.has(id)),
  };
}

describe('createParagraphValidationAggregator', () => {
  it('reports hasFields() false until a field is registered', () => {
    const aggregator = createParagraphValidationAggregator();
    expect(aggregator.hasFields()).toBe(false);

    aggregator.registerField(1, 'Required');
    expect(aggregator.hasFields()).toBe(true);
  });

  it('increments nextOrdinal() independently of registerField() calls', () => {
    const aggregator = createParagraphValidationAggregator();
    expect(aggregator.nextOrdinal()).toBe(1);
    expect(aggregator.nextOrdinal()).toBe(2);
    expect(aggregator.nextOrdinal()).toBe(3);
    expect(aggregator.hasFields()).toBe(false);
  });

  it('renders row text as "Blank {ordinal}: {message}"', () => {
    const aggregator = createParagraphValidationAggregator();
    aggregator.registerField(2, 'Selection required');

    const row = aggregator.element.querySelector('.cutie-paragraph-validation-item')!;
    expect(row.textContent).toBe('Blank 2: Selection required');
  });

  it('toggles error visibility on only the targeted row', () => {
    const aggregator = createParagraphValidationAggregator();
    const fieldA = aggregator.registerField(1, 'Message A');
    const fieldB = aggregator.registerField(2, 'Message B');

    const rows = Array.from(
      aggregator.element.querySelectorAll('.cutie-paragraph-validation-item')
    );
    expect(rows).toHaveLength(2);

    fieldA.setError(true);
    expect(rows[0]!.classList.contains('cutie-constraint-error')).toBe(true);
    expect(rows[1]!.classList.contains('cutie-constraint-error')).toBe(false);

    fieldB.setError(true);
    expect(rows[1]!.classList.contains('cutie-constraint-error')).toBe(true);

    fieldA.setError(false);
    expect(rows[0]!.classList.contains('cutie-constraint-error')).toBe(false);
    expect(rows[1]!.classList.contains('cutie-constraint-error')).toBe(true);
  });

  it('gives each registered field a stable, unique id', () => {
    const aggregator = createParagraphValidationAggregator();
    const fieldA = aggregator.registerField(1, 'Message A');
    const fieldB = aggregator.registerField(2, 'Message B');

    expect(fieldA.id).not.toBe(fieldB.id);
    expect(aggregator.element.querySelector(`#${fieldA.id}`)).not.toBeNull();
    expect(aggregator.element.querySelector(`#${fieldB.id}`)).not.toBeNull();
  });

  it('registers styles idempotently via the provided StyleManager', () => {
    const styleManager = createMockStyleManager();

    createParagraphValidationAggregator(styleManager);
    createParagraphValidationAggregator(styleManager);

    expect(styleManager.addStyle).toHaveBeenCalledTimes(1);
    expect(styleManager.addStyle).toHaveBeenCalledWith(
      'cutie-paragraph-validation',
      expect.any(String)
    );
  });
});
