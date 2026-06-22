import type { TransformContext } from '../transformer/types';
type Urgency = 'polite' | 'assertive';
/**
 * Announces a message to screen readers via a shared live region.
 * Messages within the same microtask are batched and concatenated.
 *
 * @param urgency - `'polite'` (default) waits for the user to be idle;
 *                  `'assertive'` interrupts immediately.
 */
export declare function announce(ctx: TransformContext, message: string, urgency?: Urgency): void;
/**
 * CSS styles for visually hiding live regions while keeping them accessible.
 */
export declare const LIVE_REGION_STYLES = "\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n";
export {};
