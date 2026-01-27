/**
 * Shared types for expression evaluators
 */

/**
 * Type for recursive evaluation callback
 * Allows domain-specific evaluators to inject their own logic
 */
export type SubEvaluate = (
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
) => unknown;
