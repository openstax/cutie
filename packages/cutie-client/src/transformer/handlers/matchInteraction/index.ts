import { registry } from '../../registry.js';
import { MatchInteractionHandler } from './matchInteractionHandler.js';

// Register with priority 50 (before unsupported catch-all at 500)
registry.register('match-interaction', new MatchInteractionHandler(), 50);
