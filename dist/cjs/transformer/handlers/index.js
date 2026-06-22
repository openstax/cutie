"use strict";
/**
 * Handler registration module
 * Import all handlers to trigger side-effect registration with the registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Specific qti-* interaction handlers (priority 10-100)
require("./choiceInteraction"); // priority 50
require("./extendedText"); // priorities 40-50
require("./gapMatchInteraction"); // priority 45 (gap), 50 (gap-match-interaction)
require("./inlineChoiceInteraction"); // priority 50
require("./matchInteraction"); // priority 50
require("./textEntryInteraction"); // priority 50
// Feedback handlers (priority 50)
require("./feedback");
require("./contentBody"); // priority 50 - transparent container for feedback content
// Unsupported qti-* catch-all (priority 500)
require("./unsupported");
// Generic HTML/XHTML passthrough (priority 1000)
require("./htmlPassthrough");
