"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineChoicePropertiesPanels = exports.inlineChoiceRenderers = exports.insertInlineChoiceInteraction = exports.inlineChoiceSerializers = exports.inlineChoiceParsers = exports.inlineChoiceInteractionConfig = exports.InlineChoicePropertiesPanel = exports.InlineChoiceElement = void 0;
// Re-export individual components for direct use if needed
var Element_1 = require("./Element");
Object.defineProperty(exports, "InlineChoiceElement", { enumerable: true, get: function () { return Element_1.InlineChoiceElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "InlineChoicePropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.InlineChoicePropertiesPanel; } });
// Re-export from other modules
var config_1 = require("./config");
Object.defineProperty(exports, "inlineChoiceInteractionConfig", { enumerable: true, get: function () { return config_1.inlineChoiceInteractionConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "inlineChoiceParsers", { enumerable: true, get: function () { return serialization_1.inlineChoiceParsers; } });
Object.defineProperty(exports, "inlineChoiceSerializers", { enumerable: true, get: function () { return serialization_1.inlineChoiceSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertInlineChoiceInteraction", { enumerable: true, get: function () { return insertion_1.insertInlineChoiceInteraction; } });
// Import components for creating maps
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
// Export objects that can be spread (one per concern)
exports.inlineChoiceRenderers = {
    'qti-inline-choice-interaction': Element_2.InlineChoiceElement,
};
exports.inlineChoicePropertiesPanels = {
    'qti-inline-choice-interaction': PropertiesPanel_2.InlineChoicePropertiesPanel,
};
