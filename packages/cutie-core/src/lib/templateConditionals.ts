/**
 * Applies template-controlled visibility (QTI 3 Information Model: TemplateBlock
 * §5.145, TemplateInline §5.155, and the choices, gaps and hotspot choices that carry
 * `template-identifier`, e.g. SimpleChoice §5.132).
 *
 * `template-identifier` names a template variable, of identifier base-type and
 * single or multiple cardinality. The element's own `identifier` is compared
 * with that variable's value:
 * - `show-hide="show"` (the default): shown only if the variable matches, or
 *   contains, the identifier
 * - `show-hide="hide"`: hidden if the variable matches, or contains, the identifier
 *
 * Hidden elements are removed. Elements without `template-identifier` are left alone.
 */
export function processTemplateConditionals(
  root: Element,
  variables: Record<string, unknown>
): void {
  const templateElements = Array.from(root.getElementsByTagName('*')).filter((element) =>
    element.hasAttribute('template-identifier')
  );

  for (const element of templateElements) {
    const templateIdentifier = element.getAttribute('template-identifier') ?? '';
    const identifier = element.getAttribute('identifier') ?? '';
    const isMatch = valueContains(variables[templateIdentifier], identifier);
    const shown = element.getAttribute('show-hide') === 'hide' ? !isMatch : isMatch;

    if (!shown) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Checks if a value matches, or (for multiple cardinality) contains, the given identifier.
 */
export function valueContains(value: unknown, identifier: string): boolean {
  if (Array.isArray(value)) {
    return value.includes(identifier);
  }
  return value === identifier;
}
