"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackInlinePropertiesPanels = exports.feedbackInlineRenderers = exports.isInFeedbackInline = exports.removeFeedbackInline = exports.insertFeedbackInline = exports.feedbackInlineSerializers = exports.feedbackInlineParsers = exports.feedbackInlineConfig = exports.FeedbackInlinePropertiesPanel = exports.FeedbackInlineElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "FeedbackInlineElement", { enumerable: true, get: function () { return Element_1.FeedbackInlineElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "FeedbackInlinePropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.FeedbackInlinePropertiesPanel; } });
var config_1 = require("./config");
Object.defineProperty(exports, "feedbackInlineConfig", { enumerable: true, get: function () { return config_1.feedbackInlineConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "feedbackInlineParsers", { enumerable: true, get: function () { return serialization_1.feedbackInlineParsers; } });
Object.defineProperty(exports, "feedbackInlineSerializers", { enumerable: true, get: function () { return serialization_1.feedbackInlineSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertFeedbackInline", { enumerable: true, get: function () { return insertion_1.insertFeedbackInline; } });
Object.defineProperty(exports, "removeFeedbackInline", { enumerable: true, get: function () { return insertion_1.removeFeedbackInline; } });
Object.defineProperty(exports, "isInFeedbackInline", { enumerable: true, get: function () { return insertion_1.isInFeedbackInline; } });
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
exports.feedbackInlineRenderers = {
    'qti-feedback-inline': Element_2.FeedbackInlineElement,
};
exports.feedbackInlinePropertiesPanels = {
    'qti-feedback-inline': PropertiesPanel_2.FeedbackInlinePropertiesPanel,
};
