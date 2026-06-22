"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modalFeedbackPropertiesPanels = exports.modalFeedbackRenderers = exports.isInModalFeedback = exports.insertModalFeedback = exports.modalFeedbackSerializers = exports.modalFeedbackParsers = exports.modalFeedbackConfig = exports.ModalFeedbackPropertiesPanel = exports.ModalFeedbackElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "ModalFeedbackElement", { enumerable: true, get: function () { return Element_1.ModalFeedbackElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "ModalFeedbackPropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.ModalFeedbackPropertiesPanel; } });
var config_1 = require("./config");
Object.defineProperty(exports, "modalFeedbackConfig", { enumerable: true, get: function () { return config_1.modalFeedbackConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "modalFeedbackParsers", { enumerable: true, get: function () { return serialization_1.modalFeedbackParsers; } });
Object.defineProperty(exports, "modalFeedbackSerializers", { enumerable: true, get: function () { return serialization_1.modalFeedbackSerializers; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertModalFeedback", { enumerable: true, get: function () { return insertion_1.insertModalFeedback; } });
Object.defineProperty(exports, "isInModalFeedback", { enumerable: true, get: function () { return insertion_1.isInModalFeedback; } });
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
exports.modalFeedbackRenderers = {
    'qti-modal-feedback': Element_2.ModalFeedbackElement,
};
exports.modalFeedbackPropertiesPanels = {
    'qti-modal-feedback': PropertiesPanel_2.ModalFeedbackPropertiesPanel,
};
