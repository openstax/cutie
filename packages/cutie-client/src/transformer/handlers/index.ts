/* spell-checker: ignore hottext */
/**
 * Handler registration module
 * Import all handlers to trigger side-effect registration with the registry
 */

// Specific qti-* interaction handlers (priority 10-100)
import './choiceInteraction.js'; // priority 50
import './extendedText/index.js'; // priorities 40-50
import './gapMatchInteraction/index.js'; // priority 45 (gap), 50 (gap-match-interaction)
import './hottextInteraction.js'; // priority 45 (hottext), 50 (hottext-interaction)
import './inlineChoiceInteraction.js'; // priority 50
import './matchInteraction/index.js'; // priority 50
import './textEntryInteraction.js'; // priority 50

// Feedback handlers (priority 50)
import './feedback/index.js';
import './contentBody.js'; // priority 50 - transparent container for feedback content

// Unsupported qti-* catch-all (priority 500)
import './unsupported.js';

// Generic HTML/XHTML passthrough (priority 1000)
import './htmlPassthrough.js';
