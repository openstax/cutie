/**
 * Gap Match Interaction Handler
 *
 * Implements the QTI v3 qti-gap-match-interaction element.
 * This interaction presents a pool of draggable text/image choices
 * that users match to gap placeholders embedded in content.
 */

import { registry } from '../../registry';
import { GapHandler } from './gapHandler';
import { GapMatchInteractionHandler } from './gapMatchInteractionHandler';

// Register handlers
// GapHandler at priority 45 to be checked before GapMatchInteractionHandler
registry.register('gap', new GapHandler(), 45);
// GapMatchInteractionHandler at priority 50
registry.register('gap-match-interaction', new GapMatchInteractionHandler(), 50);

// Re-export for external use if needed
export { GapHandler } from './gapHandler';
export { GapMatchInteractionHandler } from './gapMatchInteractionHandler';
export { GapMatchController } from './controller';
