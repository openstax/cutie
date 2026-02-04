import { registry } from '../../registry';
import { MatchInteractionHandler } from './matchInteractionHandler';

// Register with priority 50 (before unsupported catch-all at 500)
registry.register('match-interaction', new MatchInteractionHandler(), 50);
