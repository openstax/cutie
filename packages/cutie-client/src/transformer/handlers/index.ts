/**
 * Handler registration module
 * Import all handlers to trigger side-effect registration with the registry
 */

// Specific qti-* interaction handlers (priority 10-100)
import './choiceInteraction'; // priority 50
import './extendedTextInteraction'; // priority 50
import './formulaInteraction'; // priority 40 (before extended-text)
import './gapMatchInteraction'; // priority 45 (gap), 50 (gap-match-interaction)
import './inlineChoiceInteraction'; // priority 50
import './matchInteraction'; // priority 50
import './textEntryInteraction'; // priority 50

// Feedback handlers (priority 50)
import './feedbackInline'; // priority 50
import './feedbackBlock'; // priority 50
import './modalFeedback'; // priority 50
import './contentBody'; // priority 50 - transparent container for feedback content

// Unsupported qti-* catch-all (priority 500)
import './unsupported';

// Generic HTML/XHTML passthrough (priority 1000)
import './htmlPassthrough';
