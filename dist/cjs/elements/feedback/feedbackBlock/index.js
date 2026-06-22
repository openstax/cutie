"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackBlockPropertiesPanels = exports.feedbackBlockRenderers = exports.isInFeedbackBlock = exports.insertFeedbackBlock = exports.feedbackBlockSerializers = exports.feedbackBlockParsers = exports.feedbackBlockConfig = exports.FeedbackBlockPropertiesPanel = exports.FeedbackBlockElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "FeedbackBlockElement", { enumerable: true, get: function () { return Element_1.FeedbackBlockElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "FeedbackBlockPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.FeedbackBlockPropertiesPanel; } });
var config_1 = require("./config");
Object.defineProperty(exports, "feedbackBlockConfig", { enumerable: true, get: function () { return config_1.feedbackBlockConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "feedbackBlockParsers", { enumerable: true, get: function () { return serialization_1.feedbackBlockParsers; } });
Object.defineProperty(exports, "feedbackBlockSerializers", { enumerable: true, get: function () { return serialization_1.feedbackBlockSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertFeedbackBlock", { enumerable: true, get: function () { return insertion_1.insertFeedbackBlock; } });
Object.defineProperty(exports, "isInFeedbackBlock", { enumerable: true, get: function () { return insertion_1.isInFeedbackBlock; } });
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
exports.feedbackBlockRenderers = {
    'qti-feedback-block': Element_2.FeedbackBlockElement,
};
exports.feedbackBlockPropertiesPanels = {
    'qti-feedback-block': PropertiesPanel_2.FeedbackBlockPropertiesPanel,
};
