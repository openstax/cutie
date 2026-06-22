"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../../registry");
const matchInteractionHandler_1 = require("./matchInteractionHandler");
// Register with priority 50 (before unsupported catch-all at 500)
registry_1.registry.register('match-interaction', new matchInteractionHandler_1.MatchInteractionHandler(), 50);
