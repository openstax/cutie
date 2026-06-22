"use strict";
/**
 * Gap Match Interaction Handler
 *
 * Implements the QTI v3 qti-gap-match-interaction element.
 * This interaction presents a pool of draggable text/image choices
 * that users match to gap placeholders embedded in content.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapMatchController = exports.GapMatchInteractionHandler = exports.GapHandler = void 0;
const registry_1 = require("../../registry");
const gapHandler_1 = require("./gapHandler");
const gapMatchInteractionHandler_1 = require("./gapMatchInteractionHandler");
// Register handlers
// GapHandler at priority 45 to be checked before GapMatchInteractionHandler
registry_1.registry.register('gap', new gapHandler_1.GapHandler(), 45);
// GapMatchInteractionHandler at priority 50
registry_1.registry.register('gap-match-interaction', new gapMatchInteractionHandler_1.GapMatchInteractionHandler(), 50);
// Re-export for external use if needed
var gapHandler_2 = require("./gapHandler");
Object.defineProperty(exports, "GapHandler", { enumerable: true, get: function () { return gapHandler_2.GapHandler; } });
var gapMatchInteractionHandler_2 = require("./gapMatchInteractionHandler");
Object.defineProperty(exports, "GapMatchInteractionHandler", { enumerable: true, get: function () { return gapMatchInteractionHandler_2.GapMatchInteractionHandler; } });
var controller_1 = require("./controller");
Object.defineProperty(exports, "GapMatchController", { enumerable: true, get: function () { return controller_1.GapMatchController; } });
