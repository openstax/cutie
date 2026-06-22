"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gapMatchPropertiesPanels = exports.gapMatchRenderers = exports.generateChoiceId = exports.generateGapId = exports.insertGapAtSelection = exports.insertGapMatchInteraction = exports.gapMatchSerializers = exports.gapMatchParsers = exports.gapConfig = exports.gapImgConfig = exports.gapTextConfig = exports.gapMatchContentConfig = exports.gapMatchChoicesConfig = exports.gapMatchInteractionConfig = exports.GapPropertiesPanel = exports.GapImgPropertiesPanel = exports.GapTextPropertiesPanel = exports.GapMatchPropertiesPanel = exports.GapElement = exports.GapImgElement = exports.GapTextElement = exports.GapMatchContentElement = exports.GapMatchChoicesElement = exports.GapMatchInteractionElement = void 0;
// Re-export individual components for direct use if needed
var Element_1 = require("./Element");
Object.defineProperty(exports, "GapMatchInteractionElement", { enumerable: true, get: function () { return Element_1.GapMatchInteractionElement; } });
Object.defineProperty(exports, "GapMatchChoicesElement", { enumerable: true, get: function () { return Element_1.GapMatchChoicesElement; } });
Object.defineProperty(exports, "GapMatchContentElement", { enumerable: true, get: function () { return Element_1.GapMatchContentElement; } });
Object.defineProperty(exports, "GapTextElement", { enumerable: true, get: function () { return Element_1.GapTextElement; } });
Object.defineProperty(exports, "GapImgElement", { enumerable: true, get: function () { return Element_1.GapImgElement; } });
Object.defineProperty(exports, "GapElement", { enumerable: true, get: function () { return Element_1.GapElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "GapMatchPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.GapMatchPropertiesPanel; } });
Object.defineProperty(exports, "GapTextPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.GapTextPropertiesPanel; } });
Object.defineProperty(exports, "GapImgPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.GapImgPropertiesPanel; } });
Object.defineProperty(exports, "GapPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.GapPropertiesPanel; } });
// Re-export from other modules
var config_1 = require("./config");
Object.defineProperty(exports, "gapMatchInteractionConfig", { enumerable: true, get: function () { return config_1.gapMatchInteractionConfig; } });
Object.defineProperty(exports, "gapMatchChoicesConfig", { enumerable: true, get: function () { return config_1.gapMatchChoicesConfig; } });
Object.defineProperty(exports, "gapMatchContentConfig", { enumerable: true, get: function () { return config_1.gapMatchContentConfig; } });
Object.defineProperty(exports, "gapTextConfig", { enumerable: true, get: function () { return config_1.gapTextConfig; } });
Object.defineProperty(exports, "gapImgConfig", { enumerable: true, get: function () { return config_1.gapImgConfig; } });
Object.defineProperty(exports, "gapConfig", { enumerable: true, get: function () { return config_1.gapConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "gapMatchParsers", { enumerable: true, get: function () { return serialization_1.gapMatchParsers; } });
Object.defineProperty(exports, "gapMatchSerializers", { enumerable: true, get: function () { return serialization_1.gapMatchSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertGapMatchInteraction", { enumerable: true, get: function () { return insertion_1.insertGapMatchInteraction; } });
Object.defineProperty(exports, "insertGapAtSelection", { enumerable: true, get: function () { return insertion_1.insertGapAtSelection; } });
Object.defineProperty(exports, "generateGapId", { enumerable: true, get: function () { return insertion_1.generateGapId; } });
Object.defineProperty(exports, "generateChoiceId", { enumerable: true, get: function () { return insertion_1.generateChoiceId; } });
// Import components for creating maps
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
// Export objects that can be spread (one per concern)
exports.gapMatchRenderers = {
    'qti-gap-match-interaction': Element_2.GapMatchInteractionElement,
    'gap-match-choices': Element_2.GapMatchChoicesElement,
    'gap-match-content': Element_2.GapMatchContentElement,
    'qti-gap-text': Element_2.GapTextElement,
    'qti-gap-img': Element_2.GapImgElement,
    'qti-gap': Element_2.GapElement,
};
exports.gapMatchPropertiesPanels = {
    'qti-gap-match-interaction': PropertiesPanel_2.GapMatchPropertiesPanel,
    'qti-gap-text': PropertiesPanel_2.GapTextPropertiesPanel,
    'qti-gap-img': PropertiesPanel_2.GapImgPropertiesPanel,
    'qti-gap': PropertiesPanel_2.GapPropertiesPanel,
};
