"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendedTextPropertiesPanels = exports.extendedTextRenderers = exports.insertExtendedTextInteraction = exports.extendedTextSerializers = exports.extendedTextParsers = exports.extendedTextInteractionConfig = exports.ExtendedTextPropertiesPanel = exports.ExtendedTextElement = void 0;
// Re-export individual components for direct use if needed
var Element_1 = require("./Element");
Object.defineProperty(exports, "ExtendedTextElement", { enumerable: true, get: function () { return Element_1.ExtendedTextElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "ExtendedTextPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.ExtendedTextPropertiesPanel; } });
// Re-export from other modules
var config_1 = require("./config");
Object.defineProperty(exports, "extendedTextInteractionConfig", { enumerable: true, get: function () { return config_1.extendedTextInteractionConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "extendedTextParsers", { enumerable: true, get: function () { return serialization_1.extendedTextParsers; } });
Object.defineProperty(exports, "extendedTextSerializers", { enumerable: true, get: function () { return serialization_1.extendedTextSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertExtendedTextInteraction", { enumerable: true, get: function () { return insertion_1.insertExtendedTextInteraction; } });
// Import components for creating maps
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
// Export objects that can be spread (one per concern)
exports.extendedTextRenderers = {
    'qti-extended-text-interaction': Element_2.ExtendedTextElement,
};
exports.extendedTextPropertiesPanels = {
    'qti-extended-text-interaction': PropertiesPanel_2.ExtendedTextPropertiesPanel,
};
