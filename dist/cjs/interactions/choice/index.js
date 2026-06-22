"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choicePropertiesPanels = exports.choiceRenderers = exports.insertChoiceInteraction = exports.choiceSerializers = exports.choiceParsers = exports.choiceInteractionConfig = exports.ChoicePropertiesPanel = exports.ChoiceElement = void 0;
// Re-export individual components for direct use if needed
var Element_1 = require("./Element");
Object.defineProperty(exports, "ChoiceElement", { enumerable: true, get: function () { return Element_1.ChoiceElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "ChoicePropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.ChoicePropertiesPanel; } });
// Re-export from other modules
var config_1 = require("./config");
Object.defineProperty(exports, "choiceInteractionConfig", { enumerable: true, get: function () { return config_1.choiceInteractionConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "choiceParsers", { enumerable: true, get: function () { return serialization_1.choiceParsers; } });
Object.defineProperty(exports, "choiceSerializers", { enumerable: true, get: function () { return serialization_1.choiceSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertChoiceInteraction", { enumerable: true, get: function () { return insertion_1.insertChoiceInteraction; } });
// Import components for creating maps
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
// Export objects that can be spread (one per concern)
exports.choiceRenderers = {
    'qti-choice-interaction': Element_2.ChoiceElement,
    // qti-prompt, qti-simple-choice, choice-id-label, choice-content removed - now in /src/elements
};
exports.choicePropertiesPanels = {
    'qti-choice-interaction': PropertiesPanel_2.ChoicePropertiesPanel,
};
