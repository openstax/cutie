"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textEntryPropertiesPanels = exports.textEntryRenderers = exports.insertTextEntryInteraction = exports.textEntrySerializers = exports.textEntryParsers = exports.textEntryInteractionConfig = exports.TextEntryPropertiesPanel = exports.TextEntryElement = void 0;
// Re-export individual components for direct use if needed
var Element_1 = require("./Element");
Object.defineProperty(exports, "TextEntryElement", { enumerable: true, get: function () { return Element_1.TextEntryElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "TextEntryPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.TextEntryPropertiesPanel; } });
// Re-export from other modules
var config_1 = require("./config");
Object.defineProperty(exports, "textEntryInteractionConfig", { enumerable: true, get: function () { return config_1.textEntryInteractionConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "textEntryParsers", { enumerable: true, get: function () { return serialization_1.textEntryParsers; } });
Object.defineProperty(exports, "textEntrySerializers", { enumerable: true, get: function () { return serialization_1.textEntrySerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertTextEntryInteraction", { enumerable: true, get: function () { return insertion_1.insertTextEntryInteraction; } });
// Import components for creating maps
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
// Export objects that can be spread (one per concern)
exports.textEntryRenderers = {
    'qti-text-entry-interaction': Element_2.TextEntryElement,
};
exports.textEntryPropertiesPanels = {
    'qti-text-entry-interaction': PropertiesPanel_2.TextEntryPropertiesPanel,
};
