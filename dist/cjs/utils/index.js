"use strict";
/**
 * Shared utilities for interaction handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearDropTargetHighlights = exports.highlightDropTargets = exports.initializeRovingTabindex = exports.updateRovingTabindex = exports.focusPrev = exports.focusNext = exports.LIVE_REGION_STYLES = exports.announce = void 0;
var liveRegion_1 = require("./liveRegion");
Object.defineProperty(exports, "announce", { enumerable: true, get: function () { return liveRegion_1.announce; } });
Object.defineProperty(exports, "LIVE_REGION_STYLES", { enumerable: true, get: function () { return liveRegion_1.LIVE_REGION_STYLES; } });
var rovingTabindex_1 = require("./rovingTabindex");
Object.defineProperty(exports, "focusNext", { enumerable: true, get: function () { return rovingTabindex_1.focusNext; } });
Object.defineProperty(exports, "focusPrev", { enumerable: true, get: function () { return rovingTabindex_1.focusPrev; } });
Object.defineProperty(exports, "updateRovingTabindex", { enumerable: true, get: function () { return rovingTabindex_1.updateRovingTabindex; } });
Object.defineProperty(exports, "initializeRovingTabindex", { enumerable: true, get: function () { return rovingTabindex_1.initializeRovingTabindex; } });
var dragDrop_1 = require("./dragDrop");
Object.defineProperty(exports, "highlightDropTargets", { enumerable: true, get: function () { return dragDrop_1.highlightDropTargets; } });
Object.defineProperty(exports, "clearDropTargetHighlights", { enumerable: true, get: function () { return dragDrop_1.clearDropTargetHighlights; } });
