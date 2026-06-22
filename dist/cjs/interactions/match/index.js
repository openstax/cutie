"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchPropertiesPanels = exports.matchRenderers = exports.generateTargetId = exports.generateSourceId = exports.insertMatchInteraction = exports.matchSerializers = exports.matchParsers = exports.simpleAssociableChoiceConfig = exports.matchTargetSetConfig = exports.matchSourceSetConfig = exports.matchInteractionConfig = exports.SimpleAssociableChoicePropertiesPanel = exports.MatchPropertiesPanel = exports.SimpleAssociableChoiceElement = exports.MatchTargetSetElement = exports.MatchSourceSetElement = exports.MatchInteractionElement = void 0;
// Re-export individual components for direct use if needed
var Element_1 = require("./Element");
Object.defineProperty(exports, "MatchInteractionElement", { enumerable: true, get: function () { return Element_1.MatchInteractionElement; } });
Object.defineProperty(exports, "MatchSourceSetElement", { enumerable: true, get: function () { return Element_1.MatchSourceSetElement; } });
Object.defineProperty(exports, "MatchTargetSetElement", { enumerable: true, get: function () { return Element_1.MatchTargetSetElement; } });
Object.defineProperty(exports, "SimpleAssociableChoiceElement", { enumerable: true, get: function () { return Element_1.SimpleAssociableChoiceElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "MatchPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.MatchPropertiesPanel; } });
Object.defineProperty(exports, "SimpleAssociableChoicePropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.SimpleAssociableChoicePropertiesPanel; } });
// Re-export from other modules
var config_1 = require("./config");
Object.defineProperty(exports, "matchInteractionConfig", { enumerable: true, get: function () { return config_1.matchInteractionConfig; } });
Object.defineProperty(exports, "matchSourceSetConfig", { enumerable: true, get: function () { return config_1.matchSourceSetConfig; } });
Object.defineProperty(exports, "matchTargetSetConfig", { enumerable: true, get: function () { return config_1.matchTargetSetConfig; } });
Object.defineProperty(exports, "simpleAssociableChoiceConfig", { enumerable: true, get: function () { return config_1.simpleAssociableChoiceConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "matchParsers", { enumerable: true, get: function () { return serialization_1.matchParsers; } });
Object.defineProperty(exports, "matchSerializers", { enumerable: true, get: function () { return serialization_1.matchSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertMatchInteraction", { enumerable: true, get: function () { return insertion_1.insertMatchInteraction; } });
Object.defineProperty(exports, "generateSourceId", { enumerable: true, get: function () { return insertion_1.generateSourceId; } });
Object.defineProperty(exports, "generateTargetId", { enumerable: true, get: function () { return insertion_1.generateTargetId; } });
// Import components for creating maps
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
// Export objects that can be spread (one per concern)
exports.matchRenderers = {
    'qti-match-interaction': Element_2.MatchInteractionElement,
    'match-source-set': Element_2.MatchSourceSetElement,
    'match-target-set': Element_2.MatchTargetSetElement,
    'qti-simple-associable-choice': Element_2.SimpleAssociableChoiceElement,
};
exports.matchPropertiesPanels = {
    'qti-match-interaction': PropertiesPanel_2.MatchPropertiesPanel,
    'qti-simple-associable-choice': PropertiesPanel_2.SimpleAssociableChoicePropertiesPanel,
};
