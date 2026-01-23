/**
 * Handler registration module
 * Import all handlers to trigger side-effect registration with the registry
 */

// Specific qti-* interaction handlers (priority 10-100)
// Future: import './choiceInteraction';      // priority ~50
// Future: import './textEntryInteraction';   // priority ~50
// Future: import './feedbackBlock';          // priority ~50

// Unsupported qti-* catch-all (priority 500)
import './unsupported';

// Generic HTML/XHTML passthrough (priority 1000)
import './htmlPassthrough';
