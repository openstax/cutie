"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptRenderers = exports.promptSerializers = exports.promptParsers = exports.promptConfig = exports.PromptElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "PromptElement", { enumerable: true, get: function () { return Element_1.PromptElement; } });
var config_1 = require("./config");
Object.defineProperty(exports, "promptConfig", { enumerable: true, get: function () { return config_1.promptConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "promptParsers", { enumerable: true, get: function () { return serialization_1.promptParsers; } });
Object.defineProperty(exports, "promptSerializers", { enumerable: true, get: function () { return serialization_1.promptSerializers; } });
const Element_2 = require("./Element");
exports.promptRenderers = {
    'qti-prompt': Element_2.PromptElement,
};
