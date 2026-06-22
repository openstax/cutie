"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleChoicePropertiesPanels = exports.simpleChoiceRenderers = exports.simpleChoiceSerializers = exports.simpleChoiceParsers = exports.simpleChoiceConfig = exports.choiceIdLabelConfig = exports.choiceContentConfig = exports.SimpleChoicePropertiesPanel = exports.ChoiceContent = exports.ChoiceIdLabel = exports.SimpleChoiceElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "SimpleChoiceElement", { enumerable: true, get: function () { return Element_1.SimpleChoiceElement; } });
var ChoiceIdLabel_1 = require("./ChoiceIdLabel");
Object.defineProperty(exports, "ChoiceIdLabel", { enumerable: true, get: function () { return ChoiceIdLabel_1.ChoiceIdLabel; } });
var ChoiceContent_1 = require("./ChoiceContent");
Object.defineProperty(exports, "ChoiceContent", { enumerable: true, get: function () { return ChoiceContent_1.ChoiceContent; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "SimpleChoicePropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.SimpleChoicePropertiesPanel; } });
var config_1 = require("./config");
Object.defineProperty(exports, "choiceContentConfig", { enumerable: true, get: function () { return config_1.choiceContentConfig; } });
Object.defineProperty(exports, "choiceIdLabelConfig", { enumerable: true, get: function () { return config_1.choiceIdLabelConfig; } });
Object.defineProperty(exports, "simpleChoiceConfig", { enumerable: true, get: function () { return config_1.simpleChoiceConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "simpleChoiceParsers", { enumerable: true, get: function () { return serialization_1.simpleChoiceParsers; } });
Object.defineProperty(exports, "simpleChoiceSerializers", { enumerable: true, get: function () { return serialization_1.simpleChoiceSerializers; } });
const ChoiceContent_2 = require("./ChoiceContent");
const ChoiceIdLabel_2 = require("./ChoiceIdLabel");
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
exports.simpleChoiceRenderers = {
    'qti-simple-choice': Element_2.SimpleChoiceElement,
    'choice-id-label': ChoiceIdLabel_2.ChoiceIdLabel,
    'choice-content': ChoiceContent_2.ChoiceContent,
};
exports.simpleChoicePropertiesPanels = {
    'qti-simple-choice': PropertiesPanel_2.SimpleChoicePropertiesPanel,
};
