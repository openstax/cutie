import type { TransformContext } from '../../types';
/**
 * Announces newly-visible feedback to screen readers.
 *
 * Tracks which feedback elements have been seen via a composite key stored in
 * `context.state`. On the initial render no announcement is made (the user
 * hasn't submitted yet). On subsequent renders (after `update()`), any
 * feedback with a key not previously seen is announced.
 *
 * The initial-vs-update distinction is determined by the `isUpdate` flag that
 * `mountItem` sets in persistent state after the first render completes.
 *
 * A nesting guard prevents double-announcement when a parent feedback element
 * and its child are both new — only the outermost ancestor announces.
 */
export declare function announceFeedback(sourceElement: Element, renderedElement: HTMLElement, context: TransformContext): void;
